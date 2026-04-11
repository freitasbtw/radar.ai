# Source Registry (Supabase)

## Objetivo

Definir um contrato tecnico unico para fontes externas de leiloes com:

- polling controlado;
- parser por tipo de fonte;
- normalizacao para schema canonic;
- armazenamento enxuto para plano Supabase Free.

## Fontes Ativas (MVP)

1. `caixa_imoveis_csv`
2. `receita_sle_json`

## Diretrizes de Custo (Supabase Free)

- Polling conservador:
  - CAIXA: `12h`
  - Receita SLE: `20min`
- Sem armazenamento de payload bruto completo por padrao.
- Apenas lotes normalizados + runs de ingestao + estado de polling.
- Retencao de runs: 30 dias.
- Sem indices extras caros (GIN/FTS) no MVP.

## Tabelas do Contrato

### `source_registry`

Cadastro da fonte e configuracoes de polling/parser/normalizacao.

Campos principais:

- `source_key` (PK)
- `poll_interval_minutes`
- `parser_config` (JSONB)
- `normalization_config` (JSONB)
- `storage_policy` (JSONB)

### `source_poll_state`

Estado operacional por fonte.

Campos principais:

- `source_key` (PK/FK)
- `last_success_at`
- `last_error_at`
- `consecutive_failures`
- `next_poll_at`

### `ingestion_runs`

Historico por execucao de ingestao.

Campos principais:

- `id`
- `source_key`
- `status`
- `fetched_count`
- `normalized_count`
- `upserted_count`
- `error_count`

### `auction_lots`

Entidade canonic de lotes.

Chave de idempotencia:

- `UNIQUE (source_key, external_id)`

## Contrato de Polling

### Regra de elegibilidade

Uma fonte pode ser executada quando:

- `is_active = true`, e
- `now() >= next_poll_at` (ou `next_poll_at` nulo).

### Backoff de falha (simples)

- A cada falha, incrementar `consecutive_failures`.
- Recalcular `next_poll_at` com multiplicador:
  - `min(poll_interval_minutes * (1 + consecutive_failures), 24h)`.

### Sucesso

- `consecutive_failures = 0`
- `last_success_at = now()`
- `next_poll_at = now() + poll_interval_minutes`

## Contrato de Parser

### `csv_file` (CAIXA)

- Ler arquivo por `entrypoint`.
- Encoding: `windows-1252`.
- Delimitador: `;`.
- Pular linhas de cabecalho tecnico.
- Converter valores monetarios BR para decimal.

### `json_api` (Receita)

- Ler indice em `/api/editais-disponiveis`.
- Derivar detalhes por edital:
  - `/api/edital/{unidade}/{numero}/{exercicio}`.
- Extrair `listaLotes` e normalizar.
- Limitar requests por run para reduzir custo:
  - `max_requests_per_run = 4` (1 indice + ate 3 detalhes).

## Contrato de Normalizacao

Saida minima por lote:

```json
{
  "source_key": "string",
  "external_id": "string",
  "title": "string",
  "category": "real_estate|electronics|vehicle|other",
  "status": "open|scheduled|closed|unknown",
  "city": "string|null",
  "state": "string|null",
  "auction_date": "ISO-8601|null",
  "min_bid": 0,
  "appraisal_value": 0,
  "currency": "BRL",
  "lot_url": "string|null",
  "payload_hash": "string",
  "first_seen_at": "ISO-8601",
  "last_seen_at": "ISO-8601"
}
```

## Idempotencia e Delta

- Upsert por `(source_key, external_id)`.
- Atualizar somente quando `payload_hash` mudar.
- Em cada run:
  - lotes vistos atualizam `last_seen_at`;
  - lotes nao vistos contam para politica de inatividade.

## Limpeza Recomendada

Jobs periodicos (diario):

- remover `ingestion_runs` com mais de 30 dias;
- manter tabela de lotes sem payload bruto para reduzir storage.

## Variaveis de Ambiente do Worker

No backend, configure:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INGESTION_WORKER_ENABLED` (`true|false`)
- `INGESTION_WORKER_INTERVAL_SECONDS` (padrao: `60`)

Arquivo de referencia:

- `backend/.env.example`

## Endpoints Operacionais

Todos sob `/api`:

- `GET /ingestion/health`
  - retorna status do scheduler e configuracao efetiva.
- `POST /ingestion/run-due`
  - executa ingestao das fontes elegiveis por `next_poll_at`.
- `POST /ingestion/run/:sourceKey`
  - executa ingestao manual de uma fonte.

`sourceKey` suportados no MVP:

- `caixa_imoveis_csv`
- `receita_sle_json`

## Arquivos Relacionados

- Implementacao TS:
  - `backend/src/config/sourceRegistry.ts`
- Estrutura SQL versionada:
  - `docs/db/migrations/20260410_create_source_registry_and_ingestion_tables.sql`
  - `docs/db/migrations/20260410_tune_receita_polling_for_free_plan.sql`
  - `docs/db/migrations/20260410_add_authenticated_read_policies_for_dashboard.sql`
- Migrations aplicadas no Supabase:
  - `create_source_registry_and_ingestion_tables`
  - `harden_set_updated_at_search_path`
  - `tune_receita_polling_for_free_plan`
  - `add_authenticated_read_policies_for_dashboard`
