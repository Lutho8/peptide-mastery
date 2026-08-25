-- Consolidate owner/admin SELECT rules so Postgres evaluates one permissive
-- policy per table and action.

drop policy if exists customer_journeys_owner_select on tracker.customer_journeys;
drop policy if exists customer_journeys_admin_select on tracker.customer_journeys;
drop policy if exists customer_journeys_select on tracker.customer_journeys;
create policy customer_journeys_select
  on tracker.customer_journeys for select to authenticated
  using (
    (select auth.uid()) = user_id
    or tracker.has_role((select auth.uid()), 'admin'::tracker.app_role)
  );

drop policy if exists journey_events_owner_select on tracker.journey_events;
drop policy if exists journey_events_admin_select on tracker.journey_events;
drop policy if exists journey_events_select on tracker.journey_events;
create policy journey_events_select
  on tracker.journey_events for select to authenticated
  using (
    (select auth.uid()) = user_id
    or tracker.has_role((select auth.uid()), 'admin'::tracker.app_role)
  );

notify pgrst, 'reload schema';
