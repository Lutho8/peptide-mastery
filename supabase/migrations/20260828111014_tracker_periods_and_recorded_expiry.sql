-- Keep user-entered tracking periods consistent across devices. These rows
-- record an existing plan; they never select a compound, amount, cadence,
-- duration or pause for the customer.
create table if not exists tracker.tracking_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  peptide_id text not null,
  peptide_name text not null,
  recorded_amount text not null,
  recorded_frequency text not null,
  start_date date not null,
  planned_duration_days integer not null check (planned_duration_days > 0),
  recorded_pause_days integer not null default 0 check (recorded_pause_days >= 0),
  status text not null default 'active' check (status in ('active', 'break', 'completed')),
  notes text,
  pause_reason text check (pause_reason is null or pause_reason in ('missed_doses', 'out_of_stock', 'other')),
  paused_at date,
  resumed_at date,
  missed_days integer check (missed_days is null or missed_days >= 0),
  split_parts integer check (split_parts is null or split_parts > 0),
  dose_times text[] not null default '{}'::text[],
  reminder_enabled boolean not null default false,
  reminder_lead_minutes integer check (reminder_lead_minutes is null or reminder_lead_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tracking_periods_user_status_start
  on tracker.tracking_periods (user_id, status, start_date desc);

alter table tracker.tracking_periods enable row level security;

drop policy if exists owner_select on tracker.tracking_periods;
drop policy if exists owner_insert on tracker.tracking_periods;
drop policy if exists owner_update on tracker.tracking_periods;
drop policy if exists owner_delete on tracker.tracking_periods;

create policy owner_select on tracker.tracking_periods
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy owner_insert on tracker.tracking_periods
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy owner_update on tracker.tracking_periods
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy owner_delete on tracker.tracking_periods
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on tracker.tracking_periods to authenticated;
grant all on tracker.tracking_periods to service_role;

drop trigger if exists update_tracking_periods_updated_at on tracker.tracking_periods;
create trigger update_tracking_periods_updated_at
  before update on tracker.tracking_periods
  for each row execute function tracker.update_updated_at_column();

-- Realtime is configured through the existing publication. Do not modify the
-- managed realtime schema (locked by Supabase as of July 2026).
do $$
declare
  target_table text;
begin
  foreach target_table in array array['tracking_periods', 'inventory_items', 'injection_records'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'tracker'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table tracker.%I', target_table);
    end if;
  end loop;
end
$$;

-- Expiry dates are recorded from the vial, COA or qualified instruction. A
-- single automatic 28-day rule is not accurate across every compound or vial.
drop trigger if exists trg_set_inventory_expiry on tracker.inventory_items;
drop function if exists tracker.set_inventory_expiry();

notify pgrst, 'reload schema';
