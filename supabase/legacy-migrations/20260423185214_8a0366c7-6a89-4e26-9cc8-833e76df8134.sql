DROP TABLE IF EXISTS public.user_memberships CASCADE;
DROP TYPE IF EXISTS public.membership_status;
DROP FUNCTION IF EXISTS public.has_active_membership(uuid);
DROP FUNCTION IF EXISTS public.grant_trial_membership() CASCADE;