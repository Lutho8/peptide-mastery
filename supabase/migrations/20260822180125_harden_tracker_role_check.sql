-- Prevent authenticated callers from probing another user's role while keeping
-- the function usable in owner/admin RLS policies.
create or replace function tracker.has_role(
  _user_id uuid,
  _role tracker.app_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select _user_id = (select auth.uid())
    and exists (
      select 1
      from tracker.user_roles
      where user_id = _user_id and role = _role
    )
$$;

revoke execute on function tracker.has_role(uuid, tracker.app_role) from public, anon;
grant execute on function tracker.has_role(uuid, tracker.app_role) to authenticated, service_role;
