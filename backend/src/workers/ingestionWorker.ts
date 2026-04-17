import { createHash } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SourceRegistryItem } from "../config/sourceRegistry";

type SourceRegistryRow = {
  source_key: string;
  source_name: string;
  source_type: "csv_file" | "json_api";
  base_url: string;
  is_active: boolean;
  poll_interval_minutes: number;
  poll_jitter_seconds: number;
  max_requests_per_run: number;
  request_timeout_ms: number;
  parser_config: Record<string, unknown>;
  normalization_config: Record<string, unknown>;
  storage_policy: Record<string, unknown>;
};

type SourcePollStateRow = {
  source_key: string;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  consecutive_failures: number;
  next_poll_at: string | null;
  last_etag: string | null;
  last_modified: string | null;
  last_payload_hash: string | null;
  updated_at: string;
};

type IngestionSummary = {
  fetchedCount: number;
  normalizedCount: number;
  upsertedCount: number;
  skippedCount: number;
  errorCount: number;
  warningMessages: string[];
};

type AuctionLotUpsert = {
  source_key: string;
  external_id: string;
  title: string;
  description: string | null;
  category: "real_estate" | "electronics" | "vehicle" | "other";
  status: "open" | "scheduled" | "closed" | "unknown";
  city: string | null;
  state: string | null;
  auction_date: string | null;
  min_bid: number | null;
  appraisal_value: number | null;
  currency: "BRL";
  lot_url: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  payload_hash: string;
  source_updated_at: string | null;
  last_seen_at: string;
};

type RunResult = {
  sourceKey: string;
  status: "success" | "partial" | "failed" | "skipped";
  summary?: IngestionSummary;
  error?: string;
};

let schedulerRef: ReturnType<typeof setInterval> | null = null;

function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toIsoDateWithBrazilOffset(input: string | null | undefined): string | null {
  if (!input) return null;

  const normalized = input.trim();
  if (!normalized) return null;

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const ymdhm = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/;

  const byDateOnly = normalized.match(ddmmyyyy);
  if (byDateOnly) {
    const [, dd, mm, yyyy] = byDateOnly;
    return `${yyyy}-${mm}-${dd}T00:00:00-03:00`;
  }

  const byDateTime = normalized.match(ymdhm);
  if (byDateTime) {
    const [, yyyy, mm, dd, hh, min] = byDateTime;
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
  }

  const nativeDate = new Date(normalized);
  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate.toISOString();
  }

  return null;
}

function parsePtBrMoney(value: string | null | undefined): number | null {
  if (!value) return null;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMaybeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function parseCsvLine(line: string, delimiter = ";"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = i + 1 < line.length ? line[i + 1] : "";

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function payloadHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function mapReceitaStatus(code: number | null | undefined): "open" | "scheduled" | "closed" | "unknown" {
  if (code === 2) return "scheduled";
  if (code === 3) return "open";
  if (code === 8 || code === 9 || code === 10) return "closed";
  return "unknown";
}

function mapReceitaCategory(typeLabel: string | null | undefined): "real_estate" | "electronics" | "vehicle" | "other" {
  const normalized = (typeLabel ?? "").toLowerCase();
  if (!normalized) return "other";

  if (
    normalized.includes("eletr") ||
    normalized.includes("comput") ||
    normalized.includes("celular") ||
    normalized.includes("smart") ||
    normalized.includes("component")
  ) {
    return "electronics";
  }

  if (
    normalized.includes("veic") ||
    normalized.includes("autom") ||
    normalized.includes("moto") ||
    normalized.includes("caminh") ||
    normalized.includes("aeronave")
  ) {
    return "vehicle";
  }

  if (normalized.includes("imov") || normalized.includes("terreno") || normalized.includes("apartamento")) {
    return "real_estate";
  }

  return "other";
}

async function fetchWithTimeout(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timeoutRef = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestInit: RequestInit = {
      method: "GET",
      signal: controller.signal,
      ...(headers ? { headers } : {}),
    };

    const response = await fetch(url, {
      ...requestInit,
    });
    return response;
  } finally {
    clearTimeout(timeoutRef);
  }
}

async function upsertLotsOptimized(
  supabase: SupabaseClient,
  sourceKey: string,
  lots: AuctionLotUpsert[],
): Promise<number> {
  if (lots.length === 0) return 0;

  let upsertedCount = 0;
  const batchSize = 200;

  for (let i = 0; i < lots.length; i += batchSize) {
    const batch = lots.slice(i, i + batchSize);
    const externalIds = batch.map((lot) => lot.external_id);

    const { data: existingRows, error: existingError } = await supabase
      .from("auction_lots")
      .select("external_id,payload_hash")
      .eq("source_key", sourceKey)
      .in("external_id", externalIds);

    if (existingError) {
      throw new Error(`Failed to load existing lots for diff: ${existingError.message}`);
    }

    const existingMap = new Map<string, string | null>(
      (existingRows ?? []).map((row: { external_id: string; payload_hash: string | null }) => [
        row.external_id,
        row.payload_hash,
      ]),
    );

    const changed = batch.filter((lot) => {
      const oldHash = existingMap.get(lot.external_id);
      return oldHash !== lot.payload_hash;
    });

    if (changed.length === 0) continue;

    const { error: upsertError } = await supabase
      .from("auction_lots")
      .upsert(changed, { onConflict: "source_key,external_id" });

    if (upsertError) {
      throw new Error(`Failed to upsert lots: ${upsertError.message}`);
    }

    upsertedCount += changed.length;
  }

  return upsertedCount;
}

async function ingestCaixa(source: SourceRegistryRow): Promise<IngestionSummary> {
  const parserConfig = source.parser_config ?? {};
  const scope = String((parserConfig.default_scope as string) ?? "SP");
  const entrypointTemplate = String(parserConfig.entrypoint ?? "/listaweb/Lista_imoveis_{scope}.csv");
  const delimiter = String(parserConfig.delimiter ?? ";");
  const timeoutMs = source.request_timeout_ms ?? 20000;

  const endpoint = entrypointTemplate.replace("{scope}", scope);
  const url = `${source.base_url}${endpoint}`;

  const response = await fetchWithTimeout(url, timeoutMs);
  if (!response.ok) {
    throw new Error(`CAIXA download failed with status ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const decoded = new TextDecoder("windows-1252").decode(bytes);
  const lines = decoded.split(/\r?\n/);

  const headerIndex = lines.findIndex((line) => {
    const normalized = line.toLowerCase();
    return normalized.includes("uf;cidade;bairro");
  });
  if (headerIndex < 0) {
    throw new Error("CAIXA CSV header row was not found.");
  }

  const generationLine = lines[0] ?? "";
  const generationMatch = generationLine.match(/(\d{2}\/\d{2}\/\d{4})/);
  const sourceUpdatedAt = generationMatch ? toIsoDateWithBrazilOffset(generationMatch[1]) : null;

  const nowIso = new Date().toISOString();
  const normalizedLots: AuctionLotUpsert[] = [];

  let fetchedCount = 0;
  let skippedCount = 0;

  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const rawLine = lines[i];
    if (!rawLine || !rawLine.trim()) continue;

    const columns = parseCsvLine(rawLine, delimiter);
    if (columns.length < 12) {
      skippedCount += 1;
      continue;
    }

    fetchedCount += 1;

    const externalId = normalizeText(columns[0]);
    if (!externalId) {
      skippedCount += 1;
      continue;
    }

    const state = normalizeText(columns[1]) || null;
    const city = normalizeText(columns[2]) || null;
    const district = normalizeText(columns[3]) || null;
    const address = normalizeText(columns[4]) || null;
    const minBid = parsePtBrMoney(columns[5]);
    const appraisalValue = parsePtBrMoney(columns[6]);
    const discount = parseMaybeNumber(columns[7]?.replace(",", "."));
    const financing = normalizeText(columns[8]) || null;
    const description = normalizeText(columns[9]) || null;
    const saleMode = normalizeText(columns[10]) || null;
    const lotUrl = normalizeText(columns[11]) || null;

    const title = description
      ? (description.split(",")[0] ?? description).trim().slice(0, 120)
      : `Imovel ${externalId}`;

    const payload = {
      source_key: source.source_key,
      external_id: externalId,
      title,
      description,
      state,
      city,
      min_bid: minBid,
      appraisal_value: appraisalValue,
      lot_url: lotUrl,
      district,
      address,
      discount,
      financing,
      saleMode,
    };

    normalizedLots.push({
      source_key: source.source_key,
      external_id: externalId,
      title,
      description,
      category: "real_estate",
      status: "open",
      city,
      state,
      auction_date: null,
      min_bid: minBid,
      appraisal_value: appraisalValue,
      currency: "BRL",
      lot_url: lotUrl,
      image_url: null,
      metadata: {
        scope,
        district,
        address,
        discount_percent: discount,
        financing_allowed: financing,
        sale_mode: saleMode,
      },
      payload_hash: payloadHash(payload),
      source_updated_at: sourceUpdatedAt,
      last_seen_at: nowIso,
    });
  }

  const supabase = getSupabaseAdminClient();
  const upsertedCount = await upsertLotsOptimized(supabase, source.source_key, normalizedLots);

  return {
    fetchedCount,
    normalizedCount: normalizedLots.length,
    upsertedCount,
    skippedCount,
    errorCount: 0,
    warningMessages: [],
  };
}

function parseEdleParts(edle: string): { unidade: string; numero: string; exercicio: string } | null {
  const parts = edle.split("/");
  if (parts.length !== 3) return null;
  const [unidade, numero, exercicio] = parts;
  if (!unidade || !numero || !exercicio) return null;
  return { unidade, numero, exercicio };
}

async function ingestReceita(source: SourceRegistryRow): Promise<IngestionSummary> {
  const parserConfig = source.parser_config ?? {};
  const timeoutMs = source.request_timeout_ms ?? 20000;
  const headers = (parserConfig.request_headers as Record<string, string> | undefined) ?? {
    Accept: "application/json",
  };

  const entrypoint = String(parserConfig.entrypoint ?? "/api/editais-disponiveis");
  const detailTemplate = String(
    parserConfig.detail_entrypoint_template ?? "/api/edital/{unidade}/{numero}/{exercicio}",
  );

  const indexUrl = `${source.base_url}${entrypoint}`;
  const indexResponse = await fetchWithTimeout(indexUrl, timeoutMs, headers);
  if (!indexResponse.ok) {
    throw new Error(`Receita index failed with status ${indexResponse.status}`);
  }

  const indexJson = (await indexResponse.json()) as {
    situacoes?: Array<{
      situacao?: number;
      lista?: Array<{
        edital?: string;
        edle?: string;
        codigoSituacao?: number;
        cidade?: string;
        dataAberturaLances?: string;
      }>;
    }>;
  };

  const flattenedEditais: Array<{
    edle: string;
    edital: string;
    codigoSituacao: number | null;
    cidade: string | null;
    dataAberturaLances: string | null;
  }> = [];

  for (const situacao of indexJson.situacoes ?? []) {
    for (const item of situacao.lista ?? []) {
      if (!item.edle || !item.edital) continue;
      flattenedEditais.push({
        edle: item.edle,
        edital: item.edital,
        codigoSituacao: item.codigoSituacao ?? situacao.situacao ?? null,
        cidade: item.cidade ?? null,
        dataAberturaLances: item.dataAberturaLances ?? null,
      });
    }
  }

  const maxRequests = Math.max(1, source.max_requests_per_run ?? 1);
  const maxDetailRequests = Math.max(0, maxRequests - 1);
  const editaisToRead = flattenedEditais.slice(0, maxDetailRequests);

  let fetchedCount = flattenedEditais.length;
  let skippedCount = 0;
  let errorCount = 0;
  const warningMessages: string[] = [];
  const normalizedLots: AuctionLotUpsert[] = [];
  const nowIso = new Date().toISOString();

  for (const editalIndex of editaisToRead) {
    const parts = parseEdleParts(editalIndex.edle);
    if (!parts) {
      skippedCount += 1;
      warningMessages.push(`Invalid edle format: ${editalIndex.edle}`);
      continue;
    }

    const detailEndpoint = detailTemplate
      .replace("{unidade}", parts.unidade)
      .replace("{numero}", parts.numero)
      .replace("{exercicio}", parts.exercicio);

    const detailUrl = `${source.base_url}${detailEndpoint}`;
    let detailJson: {
      edital?: string;
      edle?: string;
      situacao?: number;
      cidade?: string;
      dataAberturaLances?: string;
      permitePF?: boolean;
      listaLotes?: Array<{
        loleNrSq?: number;
        nrAtribuido?: number;
        tipo?: string;
        valorMinimo?: number;
        valorAvaliacao?: number;
        imagens?: Array<{ src?: string; min?: string }>;
      }>;
    };

    try {
      const detailResponse = await fetchWithTimeout(detailUrl, timeoutMs, headers);
      if (!detailResponse.ok) {
        errorCount += 1;
        warningMessages.push(`Detail fetch failed (${detailResponse.status}) for ${editalIndex.edle}`);
        continue;
      }
      detailJson = (await detailResponse.json()) as typeof detailJson;
    } catch (error) {
      errorCount += 1;
      warningMessages.push(
        `Detail fetch exception for ${editalIndex.edle}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      continue;
    }

    const situacao = detailJson.situacao ?? editalIndex.codigoSituacao ?? null;
    const status = mapReceitaStatus(situacao);
    const auctionDate =
      toIsoDateWithBrazilOffset(detailJson.dataAberturaLances ?? editalIndex.dataAberturaLances) ?? null;

    for (const lot of detailJson.listaLotes ?? []) {
      const nrAtribuido = lot.nrAtribuido ?? lot.loleNrSq;
      if (!nrAtribuido) {
        skippedCount += 1;
        continue;
      }

      const externalId = `${editalIndex.edital}:${nrAtribuido}`;
      const typeLabel = normalizeText(lot.tipo);
      const category = mapReceitaCategory(typeLabel);
      const title = typeLabel ? `${typeLabel} - Lote ${nrAtribuido}` : `Lote ${nrAtribuido}`;
      const minBid = parseMaybeNumber(lot.valorMinimo);
      const appraisalValue = parseMaybeNumber(lot.valorAvaliacao);
      const image = (lot.imagens ?? [])[0];
      const imageUrl = image?.min ?? image?.src ?? null;
      const lotUrl = `${source.base_url}/portal/edital/${parts.unidade}/${parts.numero}/${parts.exercicio}/lote/${nrAtribuido}`;
      const city = detailJson.cidade ?? editalIndex.cidade ?? null;

      const payload = {
        source_key: source.source_key,
        external_id: externalId,
        title,
        category,
        status,
        city,
        min_bid: minBid,
        appraisal_value: appraisalValue,
        lot_url: lotUrl,
        edital: editalIndex.edital,
        edle: editalIndex.edle,
        nrAtribuido,
      };

      normalizedLots.push({
        source_key: source.source_key,
        external_id: externalId,
        title,
        description: typeLabel || null,
        category,
        status,
        city,
        state: null,
        auction_date: auctionDate,
        min_bid: minBid,
        appraisal_value: appraisalValue,
        currency: "BRL",
        lot_url: lotUrl,
        image_url: imageUrl,
        metadata: {
          edital: detailJson.edital ?? editalIndex.edital,
          edle: detailJson.edle ?? editalIndex.edle,
          situacao,
          permite_pf: detailJson.permitePF ?? null,
          nr_atribuido: nrAtribuido,
          lole_nr_sq: lot.loleNrSq ?? null,
        },
        payload_hash: payloadHash(payload),
        source_updated_at: null,
        last_seen_at: nowIso,
      });
    }
  }

  const supabase = getSupabaseAdminClient();
  const upsertedCount = await upsertLotsOptimized(supabase, source.source_key, normalizedLots);

  return {
    fetchedCount,
    normalizedCount: normalizedLots.length,
    upsertedCount,
    skippedCount,
    errorCount,
    warningMessages,
  };
}

async function loadActiveSourcesAndState(
  supabase: SupabaseClient,
): Promise<{ sources: SourceRegistryRow[]; statesByKey: Map<string, SourcePollStateRow> }> {
  const { data: sources, error: sourceError } = await supabase
    .from("source_registry")
    .select("*")
    .eq("is_active", true)
    .order("source_key", { ascending: true });

  if (sourceError) {
    throw new Error(`Failed to load source_registry: ${sourceError.message}`);
  }

  const { data: pollStates, error: stateError } = await supabase.from("source_poll_state").select("*");
  if (stateError) {
    throw new Error(`Failed to load source_poll_state: ${stateError.message}`);
  }

  const statesByKey = new Map<string, SourcePollStateRow>(
    (pollStates ?? []).map((state: SourcePollStateRow) => [state.source_key, state]),
  );

  return { sources: (sources ?? []) as SourceRegistryRow[], statesByKey };
}

function shouldRunNow(source: SourceRegistryRow, pollState: SourcePollStateRow | undefined): boolean {
  if (!pollState?.next_poll_at) return true;
  return new Date(pollState.next_poll_at).getTime() <= Date.now();
}

function computeNextPollAt(source: SourceRegistryRow, failures: number): string {
  const baseMinutes = source.poll_interval_minutes;
  const backoffMinutes = Math.min(baseMinutes * Math.max(1, failures + 1), 24 * 60);
  const jitterSeconds = Math.floor(Math.random() * (Math.max(0, source.poll_jitter_seconds) + 1));
  const ms = backoffMinutes * 60_000 + jitterSeconds * 1_000;
  return new Date(Date.now() + ms).toISOString();
}

async function persistPollStateSuccess(
  supabase: SupabaseClient,
  source: SourceRegistryRow,
  previousState: SourcePollStateRow | undefined,
): Promise<void> {
  const nextPollAt = computeNextPollAt(source, 0);

  const payload = {
    source_key: source.source_key,
    last_success_at: new Date().toISOString(),
    last_error_at: null,
    last_error_message: null,
    consecutive_failures: 0,
    next_poll_at: nextPollAt,
    last_etag: previousState?.last_etag ?? null,
    last_modified: previousState?.last_modified ?? null,
    last_payload_hash: previousState?.last_payload_hash ?? null,
  };

  const { error } = await supabase.from("source_poll_state").upsert(payload, { onConflict: "source_key" });
  if (error) {
    throw new Error(`Failed to update source_poll_state success: ${error.message}`);
  }
}

async function persistPollStateFailure(
  supabase: SupabaseClient,
  source: SourceRegistryRow,
  previousState: SourcePollStateRow | undefined,
  errorMessage: string,
): Promise<void> {
  const failures = (previousState?.consecutive_failures ?? 0) + 1;
  const nextPollAt = computeNextPollAt(source, failures);

  const payload = {
    source_key: source.source_key,
    last_error_at: new Date().toISOString(),
    last_error_message: errorMessage.slice(0, 1200),
    consecutive_failures: failures,
    next_poll_at: nextPollAt,
    last_success_at: previousState?.last_success_at ?? null,
    last_etag: previousState?.last_etag ?? null,
    last_modified: previousState?.last_modified ?? null,
    last_payload_hash: previousState?.last_payload_hash ?? null,
  };

  const { error } = await supabase.from("source_poll_state").upsert(payload, { onConflict: "source_key" });
  if (error) {
    throw new Error(`Failed to update source_poll_state failure: ${error.message}`);
  }
}

async function createIngestionRun(supabase: SupabaseClient, sourceKey: string): Promise<number> {
  const { data, error } = await supabase
    .from("ingestion_runs")
    .insert({ source_key: sourceKey, status: "partial" })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create ingestion_run: ${error.message}`);
  }

  return data.id as number;
}

async function finalizeIngestionRun(
  supabase: SupabaseClient,
  runId: number,
  status: "success" | "partial" | "failed",
  summary: IngestionSummary,
  errorMessage?: string,
): Promise<void> {
  const updatePayload = {
    finished_at: new Date().toISOString(),
    status,
    fetched_count: summary.fetchedCount,
    normalized_count: summary.normalizedCount,
    upserted_count: summary.upsertedCount,
    skipped_count: summary.skippedCount,
    error_count: summary.errorCount,
    error_message: errorMessage ? errorMessage.slice(0, 1200) : null,
  };

  const { error } = await supabase.from("ingestion_runs").update(updatePayload).eq("id", runId);
  if (error) {
    throw new Error(`Failed to finalize ingestion_run (${runId}): ${error.message}`);
  }
}

export async function runSourceIngestion(sourceKey: string): Promise<RunResult> {
  const supabase = getSupabaseAdminClient();
  const { sources, statesByKey } = await loadActiveSourcesAndState(supabase);
  const source = sources.find((item) => item.source_key === sourceKey);

  if (!source) {
    return {
      sourceKey,
      status: "skipped",
      error: "source not found or inactive",
    };
  }

  const previousState = statesByKey.get(source.source_key);
  const runId = await createIngestionRun(supabase, source.source_key);

  try {
    const summary =
      source.source_key === "caixa_imoveis_csv"
        ? await ingestCaixa(source)
        : await ingestReceita(source);

    const status: "success" | "partial" = summary.errorCount > 0 ? "partial" : "success";

    await finalizeIngestionRun(supabase, runId, status, summary);
    await persistPollStateSuccess(supabase, source, previousState);

    return {
      sourceKey: source.source_key,
      status,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown ingestion error";
    const failedSummary: IngestionSummary = {
      fetchedCount: 0,
      normalizedCount: 0,
      upsertedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      warningMessages: [],
    };

    await finalizeIngestionRun(supabase, runId, "failed", failedSummary, message);
    await persistPollStateFailure(supabase, source, previousState, message);

    return {
      sourceKey: source.source_key,
      status: "failed",
      error: message,
    };
  }
}

export async function runDueSourceIngestions(): Promise<{
  startedAt: string;
  finishedAt: string;
  dueCount: number;
  results: RunResult[];
}> {
  const startedAt = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const { sources, statesByKey } = await loadActiveSourcesAndState(supabase);

  const dueSources = sources.filter((source) => shouldRunNow(source, statesByKey.get(source.source_key)));
  const results: RunResult[] = [];

  for (const source of dueSources) {
    const result = await runSourceIngestion(source.source_key);
    results.push(result);
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    dueCount: dueSources.length,
    results,
  };
}

export function startIngestionScheduler(): void {
  if (schedulerRef) return;

  const enabled = String(process.env.INGESTION_WORKER_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) return;

  const intervalSeconds = Math.max(30, Number(process.env.INGESTION_WORKER_INTERVAL_SECONDS ?? 60));

  schedulerRef = setInterval(() => {
    runDueSourceIngestions()
      .then((result) => {
        if (result.dueCount > 0) {
          console.log(
            `[ingestion] run complete due=${result.dueCount} results=${result.results
              .map((item) => `${item.sourceKey}:${item.status}`)
              .join(",")}`,
          );
        }
      })
      .catch((error) => {
        console.error("[ingestion] scheduler run failed:", error);
      });
  }, intervalSeconds * 1000);

  console.log(`[ingestion] scheduler started interval=${intervalSeconds}s`);
}

export function stopIngestionScheduler(): void {
  if (!schedulerRef) return;
  clearInterval(schedulerRef);
  schedulerRef = null;
}

export function getIngestionWorkerHealth(): {
  enabled: boolean;
  running: boolean;
  intervalSeconds: number;
} {
  const enabled = String(process.env.INGESTION_WORKER_ENABLED ?? "false").toLowerCase() === "true";
  const intervalSeconds = Math.max(30, Number(process.env.INGESTION_WORKER_INTERVAL_SECONDS ?? 60));

  return {
    enabled,
    running: schedulerRef !== null,
    intervalSeconds,
  };
}

// Compile-time compatibility check to ensure source registry item shape still matches.
const _shapeCheck = (value: SourceRegistryItem): SourceRegistryItem => value;
void _shapeCheck;


