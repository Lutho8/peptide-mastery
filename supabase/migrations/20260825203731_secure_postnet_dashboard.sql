-- Phase 3: expose a minimal owner-scoped order/fulfilment snapshot and harden
-- the existing in-house PostNet tables. Internal packing operations stay
-- service-role/admin only; customers receive status fields for their orders.

drop policy if exists auth_full_shipments on public.shipments;
drop policy if exists auth_full_fulf_events on public.fulfilment_events;

drop policy if exists shipments_owner_select on public.shipments;
create policy shipments_owner_select
  on public.shipments for select to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = shipments.web_order_id
        and orders.user_id = (select auth.uid())
    )
  );

drop policy if exists shipments_admin_manage on public.shipments;
create policy shipments_admin_manage
  on public.shipments for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists fulfilment_events_owner_select on public.fulfilment_events;
create policy fulfilment_events_owner_select
  on public.fulfilment_events for select to authenticated
  using (
    exists (
      select 1
      from public.shipments
      join public.orders on orders.id = shipments.web_order_id
      where shipments.id = fulfilment_events.shipment_id
        and orders.user_id = (select auth.uid())
    )
  );

drop policy if exists fulfilment_events_admin_manage on public.fulfilment_events;
create policy fulfilment_events_admin_manage
  on public.fulfilment_events for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

revoke all on public.shipments from anon, authenticated;
revoke all on public.fulfilment_events from anon, authenticated;
revoke all on public.shipment_batch_allocations from anon, authenticated;
revoke all on public.reorder_reminders from anon, authenticated;

grant select (
  id, web_order_id, order_ref, courier, tracking_number, status, service,
  postnet_branch_name, promised_date, delivered_at, picked_at, packed_at,
  dispatched_at, ready_for_collection_at, created_at, updated_at
) on public.shipments to authenticated;
grant select (id, shipment_id, event, created_at)
  on public.fulfilment_events to authenticated;
grant select (id, user_id, product_slug, variant_label, due_at, source_order_id)
  on public.reorder_reminders to authenticated;
grant select (
  id, user_id, total, created_at, status, currency, paid_at, public_ref,
  shipping_method
) on public.orders to authenticated;

create or replace function public.assert_shipment_pack_ready()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status in ('ready_for_collection', 'dispatched', 'in_transit', 'delivered') then
    if not (
      coalesce((new.packing_checklist ->> 'items_verified')::boolean, false)
      and coalesce((new.packing_checklist ->> 'batch_verified')::boolean, false)
      and coalesce((new.packing_checklist ->> 'insulation_added')::boolean, false)
      and coalesce((new.packing_checklist ->> 'cold_pack_added')::boolean, false)
      and coalesce((new.packing_checklist ->> 'tamper_seal_applied')::boolean, false)
      and coalesce((new.packing_checklist ->> 'insert_added')::boolean, false)
      and coalesce((new.packing_checklist ->> 'final_check')::boolean, false)
    ) then
      raise exception 'Shipment cannot be released: packing checklist is incomplete';
    end if;

    if nullif(btrim(new.tamper_seal_number), '') is null then
      raise exception 'Shipment cannot be released: tamper seal number is required';
    end if;

    if new.packed_at is null then
      raise exception 'Shipment cannot be released: packed_at is required';
    end if;

    if not exists (
      select 1 from public.shipment_batch_allocations
      where shipment_id = new.id
    ) then
      raise exception 'Shipment cannot be released: batch allocation is required';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists shipments_pack_ready_gate on public.shipments;
create trigger shipments_pack_ready_gate
before insert or update on public.shipments
for each row execute function public.assert_shipment_pack_ready();

revoke execute on function public.assert_shipment_pack_ready() from public, anon, authenticated;

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
