# Radar.ai - Technical Spec (MVP)

## 1. Objetivo Técnico

Definir arquitetura e contratos mínimos para ingestão de dados de leilões via APIs públicas e visualização em dashboard web.

## 2. Arquitetura Proposta

```text
[Public Auction APIs]
        |
        v
[Ingestion Workers] --> [Normalizer/Deduper] --> [Database]
                                                |
                                                v
                                      [Backend API - Express]
                                                |
                                                v
                                  [Frontend Dashboard - Next.js]
```

## 3. Componentes

### 3.1 Ingestion Workers

- Executam em intervalo configurável por fonte.
- Tratam autenticação (quando aplicável), paginação e retry.
- Persistem resultados brutos para auditoria (opcional no MVP, recomendado).

### 3.2 Normalizer / Deduper

- Converte payload externo para schema canônico interno.
- Estratégia de deduplicação por `source + external_id` e fallback por fingerprint.
- Atualiza `updated_at` sem perder histórico de origem.

### 3.3 Backend API (Express + TypeScript)

- Expõe endpoints de leitura para dashboard.
- Expõe endpoints operacionais básicos de status de coleta.
- Isola regras de transformação e ordenação.

### 3.4 Frontend Dashboard (Next.js)

- Consome API interna.
- Renderiza visão de resumo e tabela de lotes.
- Aplica filtros e ordenação no cliente com suporte a paginação da API.

## 4. Modelo de Dados Canônico

### 4.1 Entidade `auction_lot`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string (uuid) | sim | Identificador interno |
| source | string | sim | Nome da fonte de origem |
| external_id | string | sim | ID original na fonte |
| title | string | sim | Título resumido do lote |
| description | string | não | Descrição detalhada |
| category | enum | sim | `vehicle`, `real_estate`, `electronics`, `other` |
| status | enum | sim | `open`, `scheduled`, `closed`, `unknown` |
| city | string | não | Cidade do lote |
| state | string | não | Estado do lote |
| auction_date | datetime | não | Data/hora do leilão |
| min_bid | decimal(14,2) | não | Lance mínimo |
| currency | string | sim | Moeda (default `BRL`) |
| lot_url | string | não | URL de detalhe no portal original |
| source_payload_hash | string | sim | Hash do payload para change tracking |
| first_seen_at | datetime | sim | Primeira aparição |
| last_seen_at | datetime | sim | Última coleta com presença |
| created_at | datetime | sim | Criação do registro |
| updated_at | datetime | sim | Última atualização interna |

### 4.2 Entidade `ingestion_run`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string (uuid) | sim | Execução da coleta |
| source | string | sim | Fonte coletada |
| started_at | datetime | sim | Início |
| finished_at | datetime | não | Fim |
| status | enum | sim | `success`, `partial`, `failed` |
| fetched_count | int | sim | Itens recebidos da API |
| upserted_count | int | sim | Itens inseridos/atualizados |
| error_message | string | não | Mensagem de erro |

## 5. Contrato da API Interna (v1)

Base URL: `/api`

### 5.1 `GET /health`

Retorno:

```json
{
  "status": "ok",
  "timestamp": "2026-04-10T12:00:00Z"
}
```

### 5.2 `GET /lots`

Query params:

- `page` (default 1)
- `pageSize` (default 20, max 100)
- `category`
- `status`
- `state`
- `city`
- `minBidMin`
- `minBidMax`
- `sortBy` (`auction_date`, `min_bid`, `updated_at`)
- `sortOrder` (`asc`, `desc`)

Retorno:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 5.3 `GET /lots/:id`

Retorno:

```json
{
  "id": "uuid",
  "source": "example_source",
  "external_id": "abc-123",
  "title": "Lote Exemplo",
  "category": "vehicle",
  "status": "open",
  "auction_date": "2026-04-10T12:00:00Z",
  "min_bid": 50000,
  "currency": "BRL"
}
```

### 5.4 `GET /summary`

Retorno:

```json
{
  "totalLots": 0,
  "openLots": 0,
  "scheduledLots": 0,
  "avgMinBid": 0,
  "lastUpdateAt": "2026-04-10T12:00:00Z"
}
```

### 5.5 `GET /ingestion/status`

Retorno:

```json
{
  "sources": [
    {
      "source": "example_source",
      "lastRunStatus": "success",
      "lastRunAt": "2026-04-10T11:00:00Z",
      "lastFetchedCount": 120
    }
  ]
}
```

## 6. Regras de Negócio (MVP)

- `RB-001`: Um lote é único por `source + external_id`.
- `RB-002`: Se um lote não aparece por N coletas consecutivas, status pode ser atualizado para `closed` (N configurável).
- `RB-003`: Lotes sem `min_bid` permanecem visíveis, mas com flag `missing_price = true`.
- `RB-004`: Fontes com falha devem registrar erro e não bloquear demais fontes.

## 7. Dashboard - Requisitos de UI/UX

- Visão de topo com cards:
  - total de lotes ativos;
  - lote com menor lance;
  - atualização mais recente;
  - distribuição por categoria.
- Tabela com colunas mínimas:
  - título, categoria, localidade, data do leilão, lance mínimo, status, fonte.
- Filtros persistentes na URL para compartilhamento de visão.
- Estado de erro e vazio explícitos.

## 8. Observabilidade

- Log estruturado por execução de coleta com `run_id`.
- Métricas por fonte:
  - taxa de sucesso;
  - latência de coleta;
  - volume coletado.
- Alerta quando fonte fica sem atualização acima do SLA definido.

## 9. Segurança e Compliance

- Sanitização de dados externos antes de persistência.
- Validação de schema no boundary de ingestão.
- Rate limit na API pública do backend.
- Sem exposição de segredos no frontend.

## 10. Plano de Entrega por Fases

### Fase A - Fundação

- Estruturar módulos backend (`ingestion`, `lots`, `summary`).
- Configurar banco de dados e migrações iniciais.

### Fase B - Ingestão

- Implementar adaptador de 2 fontes.
- Persistir `auction_lot` + `ingestion_run`.

### Fase C - API

- Implementar endpoints `/lots`, `/lots/:id`, `/summary`, `/ingestion/status`.
- Adicionar paginação, filtros e ordenação.

### Fase D - Dashboard

- Integrar frontend aos endpoints.
- Entregar cards, tabela e filtros.

### Fase E - Hardening

- Logs, métricas, tratamento de erro e testes de integração.

## 11. Critérios de Pronto (Definition of Done)

- Contratos de API implementados e documentados.
- Casos de erro cobertos (fonte offline, payload inválido, timeout).
- Testes mínimos para fluxo de ingestão e listagem.
- Deploy com ambiente de staging validado.
