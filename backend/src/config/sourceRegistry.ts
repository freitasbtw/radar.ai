export type SourceKey = "caixa_imoveis_csv" | "receita_sle_json";

export type SourceType = "csv_file" | "json_api";

export interface SourcePollingConfig {
  intervalMinutes: number;
  jitterSeconds: number;
  timeoutMs: number;
  maxRequestsPerRun: number;
}

export interface SourceParserConfig {
  mode: SourceType;
  entrypoint: string;
  detailEntrypointTemplate?: string;
  encoding?: string;
  delimiter?: string;
  skipHeaderLines?: number;
  supportedScopes?: string[];
  defaultScope?: string;
  requestHeaders?: Record<string, string>;
}

export interface SourceNormalizationConfig {
  defaultCategory: "real_estate" | "electronics" | "vehicle" | "other";
  externalIdField: string;
  fieldMap: Record<string, string>;
  staticValues?: Record<string, string | number | boolean>;
}

export interface SourceStoragePolicy {
  upsertKey: [string, string];
  inactiveAfterMissingRuns: number;
  runRetentionDays: number;
}

export interface SourceRegistryItem {
  key: SourceKey;
  name: string;
  type: SourceType;
  baseUrl: string;
  active: boolean;
  polling: SourcePollingConfig;
  parser: SourceParserConfig;
  normalization: SourceNormalizationConfig;
  storage: SourceStoragePolicy;
}

export const SOURCE_REGISTRY: SourceRegistryItem[] = [
  {
    key: "caixa_imoveis_csv",
    name: "CAIXA - Lista de Imoveis (CSV)",
    type: "csv_file",
    baseUrl: "https://venda-imoveis.caixa.gov.br",
    active: true,
    polling: {
      // Conservative schedule for Supabase Free and low source load.
      intervalMinutes: 720,
      jitterSeconds: 180,
      timeoutMs: 20000,
      maxRequestsPerRun: 1,
    },
    parser: {
      mode: "csv_file",
      entrypoint: "/listaweb/Lista_imoveis_{scope}.csv",
      encoding: "windows-1252",
      delimiter: ";",
      skipHeaderLines: 2,
      supportedScopes: ["SP", "geral"],
      defaultScope: "SP",
    },
    normalization: {
      defaultCategory: "real_estate",
      externalIdField: "numero_imovel",
      fieldMap: {
        external_id: "numero_imovel",
        state: "uf",
        city: "cidade",
        title: "descricao",
        min_bid: "preco",
        appraisal_value: "valor_avaliacao",
        lot_url: "link_acesso",
        description: "descricao",
      },
      staticValues: {
        currency: "BRL",
        source: "caixa_imoveis_csv",
      },
    },
    storage: {
      upsertKey: ["source_key", "external_id"],
      inactiveAfterMissingRuns: 3,
      runRetentionDays: 30,
    },
  },
  {
    key: "receita_sle_json",
    name: "Receita Federal - SLE (JSON)",
    type: "json_api",
    baseUrl: "https://www25.receita.fazenda.gov.br/sle-sociedade",
    active: true,
    polling: {
      intervalMinutes: 20,
      jitterSeconds: 60,
      timeoutMs: 20000,
      maxRequestsPerRun: 4,
    },
    parser: {
      mode: "json_api",
      entrypoint: "/api/editais-disponiveis",
      detailEntrypointTemplate: "/api/edital/{unidade}/{numero}/{exercicio}",
      requestHeaders: {
        Accept: "application/json",
      },
    },
    normalization: {
      defaultCategory: "electronics",
      externalIdField: "edital+nrAtribuido",
      fieldMap: {
        external_id: "edital:nrAtribuido",
        title: "tipo",
        city: "cidade",
        auction_date: "dataAberturaLances",
        min_bid: "valorMinimo",
        appraisal_value: "valorAvaliacao",
        lot_url: "edital",
        description: "tipo",
      },
      staticValues: {
        currency: "BRL",
        source: "receita_sle_json",
      },
    },
    storage: {
      upsertKey: ["source_key", "external_id"],
      inactiveAfterMissingRuns: 6,
      runRetentionDays: 30,
    },
  },
];
