-- Consolidate permissive SELECT policies on the order/PostNet path. Admin
-- mutations run through the authenticated Edge Function and service role.

drop policy if exists shipments_owner_select on public.shipments;
drop policy if exists shipments_admin_manage on public.shipments;
create policy shipments_owner_or_admin_select
  on public.shipments for select to authenticated
  using (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or exists (
      select 1
      from public.orders
      where orders.id = shipments.web_order_id
        and orders.user_id = (select auth.uid())
    )
  );

drop policy if exists fulfilment_events_owner_select on public.fulfilment_events;
drop policy if exists fulfilment_events_admin_manage on public.fulfilment_events;
create policy fulfilment_events_owner_or_admin_select
  on public.fulfilment_events for select to authenticated
  using (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or exists (
      select 1
      from public.shipments
      join public.orders on orders.id = shipments.web_order_id
      where shipments.id = fulfilment_events.shipment_id
        and orders.user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins view all orders" on public.orders;
drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users view own orders" on public.orders;
create policy orders_owner_or_admin_select
  on public.orders for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

drop policy if exists "No user access to reorder_reminders" on public.reorder_reminders;
drop policy if exists "Admins manage reminders" on public.reorder_reminders;
drop policy if exists "Users view own reminders" on public.reorder_reminders;
create policy reorder_reminders_owner_or_admin_select
  on public.reorder_reminders for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

notify pgrst, 'reload schema';
