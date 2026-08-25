-- Authenticated customer-journey state for the tracker dashboard.
-- This deliberately does not duplicate CRM leads, orders, subscriptions, or
-- fulfilment records: those remain in the existing Supabase CRM tables.

create table tracker.customer_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  experience_mode text
    check (experience_mode is null or experience_mode in ('new_to_peptides', 'experienced')),
  pathway text not null default 'undecided'
    check (pathway in ('undecided', 'guided', 'research')),
  lifecycle_stage text not null default 'orientation'
    check (lifecycle_stage in (
      'orientation', 'pathway_selected', 'guided_intake', 'research_workspace',
      'active_customer', 'retention', 'paused'
    )),
  primary_goal text
    check (primary_goal is null or primary_goal in (
      'weight_management', 'general_research', 'recovery_research', 'other'
    )),
  onboarding_step smallint not null default 0
    check (onboarding_step between 0 and 4),
  next_action_code text not null default 'choose_experience'
    check (next_action_code in (
      'choose_experience', 'choose_pathway', 'complete_guided_intake',
      'review_research_library', 'record_existing_plan', 'view_order',
      'review_workspace', 'contact_support', 'none'
    )),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tracker.journey_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'dashboard_viewed', 'experience_selected', 'pathway_selected',
    'next_action_started', 'next_action_completed', 'guided_support_requested',
    'research_item_saved', 'workspace_entry', 'order_cta_clicked',
    'order_status_viewed', 'reorder_cta_clicked', 'support_opened'
  )),
  source text not null default 'dashboard'
    check (char_length(source) between 1 and 60),
  context jsonb not null default '{}'::jsonb
    check (jsonb_typeof(context) = 'object'),
  created_at timestamptz not null default now()
);

create index customer_journeys_stage_active_idx
  on tracker.customer_journeys (lifecycle_stage, last_active_at desc);
create index journey_events_user_created_idx
  on tracker.journey_events (user_id, created_at desc, id desc);
create index journey_events_name_created_idx
  on tracker.journey_events (event_name, created_at desc);

create trigger customer_journeys_set_updated_at
  before update on tracker.customer_journeys
  for each row execute function tracker.update_updated_at_column();

alter table tracker.customer_journeys enable row level security;
alter table tracker.journey_events enable row level security;

revoke all on tracker.customer_journeys from public, anon, authenticated;
revoke all on tracker.journey_events from public, anon, authenticated;
revoke all on sequence tracker.journey_events_id_seq from public, anon, authenticated;

grant select, insert, update on tracker.customer_journeys to authenticated;
grant select, insert on tracker.journey_events to authenticated;
grant usage, select on sequence tracker.journey_events_id_seq to authenticated;

grant all on tracker.customer_journeys to service_role;
grant all on tracker.journey_events to service_role;
grant usage, select on sequence tracker.journey_events_id_seq to service_role;

create policy customer_journeys_select
  on tracker.customer_journeys for select to authenticated
  using (
    (select auth.uid()) = user_id
    or tracker.has_role((select auth.uid()), 'admin'::tracker.app_role)
  );
create policy customer_journeys_owner_insert
  on tracker.customer_journeys for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy customer_journeys_owner_update
  on tracker.customer_journeys for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy journey_events_select
  on tracker.journey_events for select to authenticated
  using (
    (select auth.uid()) = user_id
    or tracker.has_role((select auth.uid()), 'admin'::tracker.app_role)
  );
create policy journey_events_owner_insert
  on tracker.journey_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
create or replace function tracker.get_dashboard_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'journey', (
      select to_jsonb(journey_row)
      from (
        select
          experience_mode,
          pathway,
          lifecycle_stage,
          primary_goal,
          onboarding_step,
          next_action_code,
          last_active_at,
          updated_at
        from tracker.customer_journeys
        where user_id = (select auth.uid())
      ) as journey_row
    ),
    'profile', (
      select jsonb_build_object(
        'display_name', display_name,
        'profile_completed', profile_completed_at is not null
      )
      from tracker.profiles
      where id = (select auth.uid())
    ),
    'workspace', jsonb_build_object(
      'stack_items', (
        select count(*) from tracker.user_stacks
        where user_id = (select auth.uid())
      ),
      'recent_events', coalesce((
        select jsonb_agg(to_jsonb(event_row) order by event_row.created_at desc)
        from (
          select id, event_name, source, context, created_at
          from tracker.journey_events
          where user_id = (select auth.uid())
          order by created_at desc, id desc
          limit 8
        ) as event_row
      ), '[]'::jsonb),
      'latest_lab_report', (
        select jsonb_build_object(
          'id', id,
          'status', status,
          'uploaded_at', uploaded_at,
          'report_date', report_date
        )
        from tracker.lab_reports
        where user_id = (select auth.uid())
        order by uploaded_at desc
        limit 1
      )
    )
  )
  where (select auth.uid()) is not null;
$$;

revoke execute on function tracker.get_dashboard_snapshot() from public, anon;
grant execute on function tracker.get_dashboard_snapshot() to authenticated, service_role;

notify pgrst, 'reload schema';
