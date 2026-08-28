-- Auto-grant 2-month membership to s14-salem@yahoo.com on signup
CREATE OR REPLACE FUNCTION public.grant_trial_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 's14-salem@yahoo.com' THEN
    INSERT INTO public.user_memberships (user_id, status, price_amount, started_at, expires_at)
    VALUES (NEW.id, 'active', 0, now(), now() + interval '2 months')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_trial_membership();