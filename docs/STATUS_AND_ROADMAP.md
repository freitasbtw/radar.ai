# Estado Atual vs Roadmap

Ultima atualizacao: 2026-04-12

Este documento compara o que ja esta implementado no codigo com o que ainda esta planejado.

## Estado Atual (Implementado)

## Backend

- API Express ativa em `/api`.
- Endpoints disponiveis:
  - `GET /api`
  - `GET /api/ingestion/health`
  - `POST /api/ingestion/run-due`
  - `POST /api/ingestion/run/:sourceKey`
- Worker de ingestao com scheduler controlado por env:
  - `INGESTION_WORKER_ENABLED`
  - `INGESTION_WORKER_INTERVAL_SECONDS`
- Ingestao implementada para duas fontes:
  - `caixa_imoveis_csv`
  - `receita_sle_json`
- Persistencia via Supabase em tabelas de lotes, runs e estado de polling.

## Frontend

- Landing page publica implementada.
- Login com Supabase Auth implementado.
- Dashboard implementado com:
  - listagem de lotes
  - filtros (titulo, origem, categoria, local, status)
  - ordenacao (incluindo spread)
  - paginacao
- No estado atual, o dashboard consulta Supabase diretamente (nao usa endpoint `/api/lots` do backend).

## Banco e Migracoes

- Migracoes SQL versionadas em `docs/db/migrations/`.
- Migracoes encontradas:
  - `20260410_create_source_registry_and_ingestion_tables.sql`
  - `20260410_tune_receita_polling_for_free_plan.sql`
  - `20260410_add_authenticated_read_policies_for_dashboard.sql`
  - `20260412_add_spread_column.sql`

## Qualidade e Operacao

- Script `backend`:
  - `npm run dev` disponivel.
  - `npm test` ainda placeholder.
- Script `frontend`:
  - `dev`, `build`, `start`, `lint`.
- Ainda sem suite de testes automatizados consolidada (unit/integration/e2e).

## Roadmap (Proximo)

## Fase 1 - Alinhamento de Contrato

- Implementar API de leitura no backend para o dashboard:
  - `GET /api/lots`
  - `GET /api/lots/:id`
  - `GET /api/summary`
  - `GET /api/ingestion/status`
- Mover frontend para consumir backend (em vez de query direta no Supabase) para reduzir acoplamento.

## Fase 2 - Confiabilidade

- Adicionar testes de ingestao e testes dos endpoints principais.
- Melhorar observabilidade:
  - logs estruturados por `run_id`
  - metricas de falha por fonte
  - alerta de defasagem de dados

## Fase 3 - Produto

- Expandir filtros e detalhes de lote (risco, comparaveis, margem esperada).
- Evoluir scoring de oportunidade e regras de priorizacao.
- Adicionar alertas para oportunidades por perfil do usuario.

## Fase 4 - Operacao e Release

- Definir fluxo claro de staging e producao.
- Publicar politica de release e rollback.
- Definir SLO/SLA operacionais para API e pipeline de ingestao.

## Matriz Rapida (Hoje vs Planejado)

| Area | Hoje | Planejado |
|---|---|---|
| Coleta de dados | 2 fontes com worker e polling | ampliar fontes e robustez de retries |
| API backend para dashboard | apenas endpoints operacionais e health | endpoints de consulta de negocio (`lots`, `summary`) |
| Dashboard | funcional, com filtros e ordenacao | consumir backend + ampliar analise de risco/margem |
| Testes | basico/placeholder no backend | suite automatizada (unit/integration/e2e) |
| Operacao | scheduler por env e logs basicos | observabilidade completa e alertas |

## Como Atualizar Este Arquivo

Atualize este arquivo sempre que ocorrer:

- criacao/remocao de endpoint;
- mudanca de fluxo de dados frontend/backend;
- nova migration que altere capacidade funcional;
- entrega de fase do roadmap.

Formato sugerido para cada atualizacao:

1. atualizar a data no topo;
2. ajustar "Estado Atual";
3. marcar itens concluidos no "Roadmap";
4. revisar a "Matriz Rapida".
