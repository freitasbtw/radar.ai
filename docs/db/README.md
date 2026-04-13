# Banco de Dados

Este diretorio guarda migrations SQL versionadas do projeto.

## Convencao

- nome de arquivo: `YYYYMMDD_descricao_curta.sql`
- cada migration deve ser idempotente quando possivel
- toda mudanca de schema funcional deve ter migration dedicada

## Fluxo Recomendado

1. criar migration em `docs/db/migrations/`
2. aplicar no ambiente de desenvolvimento
3. validar impacto no frontend/backend
4. atualizar `docs/STATUS_AND_ROADMAP.md` se houver mudanca visivel

## Migrations Atuais

- `20260410_create_source_registry_and_ingestion_tables.sql`
- `20260410_tune_receita_polling_for_free_plan.sql`
- `20260410_add_authenticated_read_policies_for_dashboard.sql`
- `20260412_add_spread_column.sql`
