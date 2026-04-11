begin;

create table if not exists public.source_registry (
  source_key text primary key,
  source_name text not null,
  source_type text not null check (source_type in ('csv_file', 'json_api')),
  base_url text not null,
  is_active boolean not null default true,
  poll_interval_minutes integer not null check (poll_interval_minutes > 0),
  poll_jitter_seconds integer not null default 0 check (poll_jitter_seconds >= 0),
  max_requests_per_run integer not null default 1 check (max_requests_per_run > 0),
  request_timeout_ms integer not null default 20000 check (request_timeout_ms > 0),
  parser_config jsonb not null default '{}'::jsonb,
  normalization_config jsonb not null default '{}'::jsonb,
  storage_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_poll_state (
  source_key text primary key references public.source_registry(source_key) on delete cascade,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  next_poll_at timestamptz,
  last_etag text,
  last_modified text,
  last_payload_hash text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ingestion_runs (
  id bigint generated always as identity primary key,
  source_key text not null references public.source_registry(source_key) on delete restrict,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('success', 'partial', 'failed')),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  normalized_count integer not null default 0 check (normalized_count >= 0),
  upserted_count integer not null default 0 check (upserted_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.auction_lots (
  id bigint generated always as identity primary key,
  source_key text not null references public.source_registry(source_key) on delete restrict,
  external_id text not null,
  title text not null,
  description text,
  category text not null check (category in ('vehicle', 'real_estate', 'electronics', 'other')),
  status text not null check (status in ('open', 'scheduled', 'closed', 'unknown')),
  city text,
  state text,
  auction_date timestamptz,
  min_bid numeric(14,2),
  appraisal_value numeric(14,2),
  currency char(3) not null default 'BRL',
  lot_url text,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  payload_hash text,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_key, external_id)
);

create index if not exists idx_ingestion_runs_source_started_at
  on public.ingestion_runs(source_key, started_at desc);

create index if not exists idx_auction_lots_status_category_date
  on public.auction_lots(status, category, auction_date desc);

create index if not exists idx_auction_lots_state_city
  on public.auction_lots(state, city);

create index if not exists idx_auction_lots_last_seen_at
  on public.auction_lots(last_seen_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_source_registry_updated_at on public.source_registry;
create trigger trg_source_registry_updated_at
before update on public.source_registry
for each row execute function public.set_updated_at();

drop trigger if exists trg_source_poll_state_updated_at on public.source_poll_state;
create trigger trg_source_poll_state_updated_at
before update on public.source_poll_state
for each row execute function public.set_updated_at();

drop trigger if exists trg_auction_lots_updated_at on public.auction_lots;
create trigger trg_auction_lots_updated_at
before update on public.auction_lots
for each row execute function public.set_updated_at();

insert into public.source_registry (
  source_key,
  source_name,
  source_type,
  base_url,
  is_active,
  poll_interval_minutes,
  poll_jitter_seconds,
  max_requests_per_run,
  request_timeout_ms,
  parser_config,
  normalization_config,
  storage_policy
) values (
  'caixa_imoveis_csv',
  'CAIXA - Lista de Imoveis (CSV)',
  'csv_file',
  'https://venda-imoveis.caixa.gov.br',
  true,
  720,
  180,
  1,
  20000,
  '{"mode":"csv_file","entrypoint":"/listaweb/Lista_imoveis_{scope}.csv","encoding":"windows-1252","delimiter":";","skip_header_lines":2,"supported_scopes":["SP","geral"],"default_scope":"SP"}'::jsonb,
  '{"default_category":"real_estate","external_id_field":"numero_imovel","field_map":{"external_id":"numero_imovel","state":"uf","city":"cidade","title":"descricao","min_bid":"preco","appraisal_value":"valor_avaliacao","lot_url":"link_acesso","description":"descricao"},"static_values":{"currency":"BRL","source":"caixa_imoveis_csv"}}'::jsonb,
  '{"upsert_key":["source_key","external_id"],"inactive_after_missing_runs":3,"run_retention_days":30}'::jsonb
)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  is_active = excluded.is_active,
  poll_interval_minutes = excluded.poll_interval_minutes,
  poll_jitter_seconds = excluded.poll_jitter_seconds,
  max_requests_per_run = excluded.max_requests_per_run,
  request_timeout_ms = excluded.request_timeout_ms,
  parser_config = excluded.parser_config,
  normalization_config = excluded.normalization_config,
  storage_policy = excluded.storage_policy,
  updated_at = now();

insert into public.source_registry (
  source_key,
  source_name,
  source_type,
  base_url,
  is_active,
  poll_interval_minutes,
  poll_jitter_seconds,
  max_requests_per_run,
  request_timeout_ms,
  parser_config,
  normalization_config,
  storage_policy
) values (
  'receita_sle_json',
  'Receita Federal - SLE (JSON)',
  'json_api',
  'https://www25.receita.fazenda.gov.br/sle-sociedade',
  true,
  20,
  60,
  4,
  20000,
  '{"mode":"json_api","entrypoint":"/api/editais-disponiveis","detail_entrypoint_template":"/api/edital/{unidade}/{numero}/{exercicio}","request_headers":{"Accept":"application/json"}}'::jsonb,
  '{"default_category":"electronics","external_id_field":"edital+nrlote","field_map":{"external_id":"edital:nrAtribuido","title":"tipo","city":"cidade","auction_date":"dataAberturaLances","min_bid":"valorMinimo","appraisal_value":"valorAvaliacao","lot_url":"edital","description":"tipo"},"static_values":{"currency":"BRL","source":"receita_sle_json"}}'::jsonb,
  '{"upsert_key":["source_key","external_id"],"inactive_after_missing_runs":6,"run_retention_days":30}'::jsonb
)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  is_active = excluded.is_active,
  poll_interval_minutes = excluded.poll_interval_minutes,
  poll_jitter_seconds = excluded.poll_jitter_seconds,
  max_requests_per_run = excluded.max_requests_per_run,
  request_timeout_ms = excluded.request_timeout_ms,
  parser_config = excluded.parser_config,
  normalization_config = excluded.normalization_config,
  storage_policy = excluded.storage_policy,
  updated_at = now();

insert into public.source_poll_state (source_key, next_poll_at)
values ('caixa_imoveis_csv', now()), ('receita_sle_json', now())
on conflict (source_key) do nothing;

commit;


