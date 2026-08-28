-- Capture every Buy Peptides handoff in Supabase while keeping the event
-- stream private. Known leads also receive a non-clinical CRM activity.

alter table tracker.crm_activities
  drop constraint if exists crm_activities_activity_type_check;

alter table tracker.crm_activities
  add constraint crm_activities_activity_type_check check (activity_type in (
    'page_view', 'qa_signup', 'course_start', 'calculator_use',
    'premium_click', 'pricing_view', 'peptide_search', 'email_open',
    'consultation_booked', 'store_click', 'account_created'
  ));

create table tracker.commerce_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name = 'buy_peptides_cta_clicked'),
  placement text not null check (char_length(placement) between 1 and 80),
  destination_host text not null check (char_length(destination_host) between 1 and 255),
  destination_path text not null check (char_length(destination_path) between 1 and 500),
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references tracker.crm_leads(id) on delete set null,
  session_id text,
  page_url text,
  created_at timestamptz not null default now()
);

create index commerce_events_created_idx
  on tracker.commerce_events (created_at desc);
create index commerce_events_placement_created_idx
  on tracker.commerce_events (placement, created_at desc);
create index commerce_events_session_created_idx
  on tracker.commerce_events (session_id, created_at desc)
  where session_id is not null;
create index commerce_events_user_created_idx
  on tracker.commerce_events (user_id, created_at desc)
  where user_id is not null;
create index commerce_events_lead_created_idx
  on tracker.commerce_events (lead_id, created_at desc)
  where lead_id is not null;

alter table tracker.commerce_events enable row level security;
revoke all on tracker.commerce_events from public, anon, authenticated;
revoke all on sequence tracker.commerce_events_id_seq from public, anon, authenticated;
grant select on tracker.commerce_events to authenticated;
grant all on tracker.commerce_events to service_role;
grant usage, select on sequence tracker.commerce_events_id_seq to service_role;

create policy commerce_events_admin_select
  on tracker.commerce_events for select to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

create or replace function tracker.get_customer_value_funnel(_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with date_window as (
    select greatest(1, least(coalesce(_days, 30), 365))::integer as days
  ), events as (
    select user_id, event_name, created_at
    from tracker.journey_events, date_window
    where created_at >= now() - make_interval(days => date_window.days)
  ), commerce_in_window as (
    select user_id, lead_id, session_id, placement
    from tracker.commerce_events, date_window
    where created_at >= now() - make_interval(days => date_window.days)
  ), orders_in_window as (
    select user_id, id
    from public.orders, date_window
    where created_at >= now() - make_interval(days => date_window.days)
      and status not in ('cancelled', 'failed')
  ), repeat_customers as (
    select user_id
    from public.orders
    where status not in ('cancelled', 'failed')
    group by user_id
    having count(*) > 1
  ), returning_dashboard_users as (
    select user_id
    from events
    where event_name = 'dashboard_viewed'
    group by user_id
    having count(distinct created_at::date) > 1
  )
  select jsonb_build_object(
    'days', (select days from date_window),
    'dashboard_users', (select count(distinct user_id) from events where event_name = 'dashboard_viewed'),
    'returning_dashboard_users', (select count(*) from returning_dashboard_users),
    'experience_selected_users', (select count(distinct user_id) from events where event_name = 'experience_selected'),
    'pathway_selected_users', (select count(distinct user_id) from events where event_name = 'pathway_selected'),
    'guided_support_users', (select count(distinct user_id) from events where event_name = 'guided_support_requested'),
    'store_clicks', (select count(*) from commerce_in_window),
    'store_click_sessions', (select count(distinct session_id) from commerce_in_window where session_id is not null),
    'store_click_users', (select count(distinct user_id) from commerce_in_window where user_id is not null),
    'store_click_leads', (select count(distinct lead_id) from commerce_in_window where lead_id is not null),
    'store_click_placements', coalesce((
      select jsonb_object_agg(placement, clicks)
      from (
        select placement, count(*) as clicks
        from commerce_in_window
        group by placement
      ) placement_totals
    ), '{}'::jsonb),
    'reorder_click_users', (select count(distinct user_id) from events where event_name = 'reorder_cta_clicked'),
    'ordering_customers', (select count(distinct user_id) from orders_in_window),
    'orders', (select count(*) from orders_in_window),
    'repeat_customers', (select count(*) from repeat_customers),
    'journey_mix', jsonb_build_object(
      'new_to_peptides', (select count(*) from tracker.customer_journeys where experience_mode = 'new_to_peptides'),
      'experienced', (select count(*) from tracker.customer_journeys where experience_mode = 'experienced'),
      'guided', (select count(*) from tracker.customer_journeys where pathway = 'guided'),
      'research', (select count(*) from tracker.customer_journeys where pathway = 'research')
    )
  )
  where tracker.has_role((select auth.uid()), 'admin'::tracker.app_role);
$$;

revoke execute on function tracker.get_customer_value_funnel(integer) from public, anon;
grant execute on function tracker.get_customer_value_funnel(integer) to authenticated, service_role;

notify pgrst, 'reload schema';
