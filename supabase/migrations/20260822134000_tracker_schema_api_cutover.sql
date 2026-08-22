-- Expose the tracker application schema in the company-owned Supabase project
-- and restore least-privilege access after namespacing the imported tables.
-- Idempotent so it can be rehearsed on a Supabase branch before production.

alter role authenticator
  set pgrst.db_schemas = 'public, storage, graphql_public, tracker';

grant usage on schema tracker to anon, authenticated, service_role;
grant all on all tables in schema tracker to service_role;
grant all on all sequences in schema tracker to service_role;
grant execute on all functions in schema tracker to service_role;

grant select, insert, update, delete on all tables in schema tracker to authenticated;
grant usage, select on all sequences in schema tracker to authenticated;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. The imported
-- schema contains credential and queue helpers that must never be callable from
-- the Data API. Start closed, then expose only the client-safe role check.
revoke execute on all functions in schema tracker from public, anon, authenticated;
grant execute on function tracker.has_role(uuid, tracker.app_role) to authenticated;

alter default privileges in schema tracker grant all on tables to service_role;
alter default privileges in schema tracker grant all on sequences to service_role;
alter default privileges in schema tracker grant execute on functions to service_role;
alter default privileges in schema tracker revoke execute on functions from public;

-- Tables whose rows are wholly owned by user_id.
do $$
declare
  table_name text;
  owner_tables text[] := array[
    'bloodwork_reminders', 'body_composition', 'calculator_settings',
    'daily_doses', 'dose_reminders', 'food_logs', 'injection_records',
    'inventory_items', 'lab_reports', 'measurements', 'pk_user_overrides',
    'progress_photos', 'protocol_adherence', 'renpho_credentials',
    'safety_checks', 'safety_profiles', 'user_stacks', 'water_intake'
  ];
begin
  foreach table_name in array owner_tables loop
    execute format('drop policy if exists owner_select on tracker.%I', table_name);
    execute format('drop policy if exists owner_insert on tracker.%I', table_name);
    execute format('drop policy if exists owner_update on tracker.%I', table_name);
    execute format('drop policy if exists owner_delete on tracker.%I', table_name);

    execute format(
      'create policy owner_select on tracker.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name
    );
    execute format(
      'create policy owner_insert on tracker.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name
    );
    execute format(
      'create policy owner_update on tracker.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name
    );
    execute format(
      'create policy owner_delete on tracker.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end
$$;

-- Profiles use the auth user UUID as their primary key.
drop policy if exists owner_select on tracker.profiles;
drop policy if exists owner_insert on tracker.profiles;
drop policy if exists owner_update on tracker.profiles;
drop policy if exists admin_select on tracker.profiles;
create policy owner_select on tracker.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy owner_insert on tracker.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy owner_update on tracker.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy admin_select on tracker.profiles for select to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

-- Roles are readable by their owner but only administrators may mutate them.
drop policy if exists owner_select on tracker.user_roles;
drop policy if exists admin_all on tracker.user_roles;
create policy owner_select on tracker.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy admin_all on tracker.user_roles for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

-- Subscription state is provider-owned. Users may read, never forge, it.
drop policy if exists owner_select on tracker.subscriptions;
drop policy if exists admin_all on tracker.subscriptions;
create policy owner_select on tracker.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy admin_all on tracker.subscriptions for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

-- Audit records are append-only to users and readable only by their owner.
drop policy if exists owner_select on tracker.audit_logs;
drop policy if exists owner_insert on tracker.audit_logs;
create policy owner_select on tracker.audit_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy owner_insert on tracker.audit_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Reference data required by the injection-site picker.
grant select on tracker.injection_sites to anon;
drop policy if exists reference_read on tracker.injection_sites;
create policy reference_read on tracker.injection_sites for select to anon, authenticated
  using (true);

-- Public lead forms: insert-only for visitors; administrator read access.
grant insert on tracker.course_enrollments, tracker.qna_registrations to anon;
drop policy if exists public_insert on tracker.course_enrollments;
drop policy if exists admin_all on tracker.course_enrollments;
create policy public_insert on tracker.course_enrollments for insert to anon, authenticated
  with check (true);
create policy admin_all on tracker.course_enrollments for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

drop policy if exists public_insert on tracker.qna_registrations;
drop policy if exists admin_all on tracker.qna_registrations;
create policy public_insert on tracker.qna_registrations for insert to anon, authenticated
  with check (true);
create policy admin_all on tracker.qna_registrations for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

-- Search Console history is administration-only.
drop policy if exists admin_all on tracker.gsc_submissions;
create policy admin_all on tracker.gsc_submissions for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));
drop policy if exists admin_all on tracker.gsc_coverage_snapshots;
create policy admin_all on tracker.gsc_coverage_snapshots for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

-- Queue infrastructure stays server-only even though it shares the schema.
revoke all on tracker.email_send_log from anon, authenticated;
revoke all on tracker.email_send_state from anon, authenticated;
revoke all on tracker.email_unsubscribe_tokens from anon, authenticated;
revoke all on tracker.suppressed_emails from anon, authenticated;

notify pgrst, 'reload config';
