-- Keep the security-invoker snapshot on owner-visible reminder columns only.
create or replace function tracker.get_order_dashboard()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with latest_order as (
    select id, public_ref, status, total, currency, created_at, paid_at, shipping_method
    from public.orders
    where user_id = (select auth.uid())
    order by created_at desc
    limit 1
  ), latest_shipment as (
    select
      s.id, s.order_ref, s.status, s.service, s.courier, s.tracking_number,
      s.postnet_branch_name, s.promised_date, s.picked_at, s.packed_at,
      s.ready_for_collection_at, s.dispatched_at, s.delivered_at, s.updated_at
    from public.shipments s
    join latest_order o on o.id = s.web_order_id
    order by s.created_at desc
    limit 1
  ), next_reorder as (
    select id, product_slug, variant_label, due_at, source_order_id
    from public.reorder_reminders
    where user_id = (select auth.uid())
    order by due_at asc
    limit 1
  )
  select jsonb_build_object(
    'order_count', (
      select count(*) from public.orders where user_id = (select auth.uid())
    ),
    'latest_order', (select to_jsonb(latest_order) from latest_order),
    'latest_shipment', (select to_jsonb(latest_shipment) from latest_shipment),
    'next_reorder', (select to_jsonb(next_reorder) from next_reorder)
  )
  where (select auth.uid()) is not null;
$$;

revoke execute on function tracker.get_order_dashboard() from public, anon;
grant execute on function tracker.get_order_dashboard() to authenticated, service_role;

notify pgrst, 'reload schema';
