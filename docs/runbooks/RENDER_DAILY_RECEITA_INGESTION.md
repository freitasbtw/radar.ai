# Runbook: Receita Daily Ingestion on Render

Objective: run Receita ingestion once per day at 04:00 (America/Sao_Paulo).

## What was added in code

- Dedicated cron script:
  - `backend/src/scripts/runReceitaIngestion.ts`
- Backend npm command:
  - `npm run cron:receita`

The script runs ingestion only for `receita_sle_json` and exits with non-zero status on failure or skipped execution.

## Render Cron configuration

Create a new **Cron Job** service in Render with:

- Repository: this repo
- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm run cron:receita`
- Schedule: `0 7 * * *`

Why `0 7 * * *`:
- Render cron uses UTC.
- 04:00 in `America/Sao_Paulo` corresponds to 07:00 UTC on 2026-04-13.

## Environment variables (Cron service)

Set the same backend secrets in the cron service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production` (recommended)

Keep this in the backend web service:

- `INGESTION_WORKER_ENABLED=false`

This avoids duplicate runs from the in-process interval scheduler.

## Manual validation

After saving the cron job:

1. Trigger one manual run in Render (`Trigger Run`).
2. Check logs for lines like:
   - `[cron] start source=receita_sle_json ...`
   - `[cron] finish source=receita_sle_json status=success ...`
3. Confirm new rows in `public.ingestion_runs`.
