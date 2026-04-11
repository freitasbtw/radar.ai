begin;

drop policy if exists auction_lots_select_authenticated on public.auction_lots;
create policy auction_lots_select_authenticated
on public.auction_lots
for select
to authenticated
using (true);

drop policy if exists source_poll_state_select_authenticated on public.source_poll_state;
create policy source_poll_state_select_authenticated
on public.source_poll_state
for select
to authenticated
using (true);

drop policy if exists source_registry_select_authenticated on public.source_registry;
create policy source_registry_select_authenticated
on public.source_registry
for select
to authenticated
using (true);

drop policy if exists ingestion_runs_select_authenticated on public.ingestion_runs;
create policy ingestion_runs_select_authenticated
on public.ingestion_runs
for select
to authenticated
using (true);

commit;

