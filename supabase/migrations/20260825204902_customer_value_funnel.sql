-- Phase 4: admin-only, aggregate journey funnel. This is a security-invoker
-- function, so existing RLS remains the authorization boundary.
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
    'store_click_users', (select count(distinct user_id) from events where event_name = 'order_cta_clicked'),
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
