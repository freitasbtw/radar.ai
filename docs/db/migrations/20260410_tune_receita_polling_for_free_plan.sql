update public.source_registry
set poll_interval_minutes = 20,
    max_requests_per_run = 4,
    updated_at = now()
where source_key = 'receita_sle_json';

