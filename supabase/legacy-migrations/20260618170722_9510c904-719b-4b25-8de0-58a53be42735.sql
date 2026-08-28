
CREATE TABLE IF NOT EXISTS public.bloodwork_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_report_id UUID NOT NULL REFERENCES public.lab_reports(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pre','due','overdue')),
  due_at TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','acknowledged','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_report_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloodwork_reminders TO authenticated;
GRANT ALL ON public.bloodwork_reminders TO service_role;

ALTER TABLE public.bloodwork_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own bloodwork reminders"
ON public.bloodwork_reminders FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_bloodwork_reminders_updated_at
BEFORE UPDATE ON public.bloodwork_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bloodwork_reminders_due
  ON public.bloodwork_reminders(due_at) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_reminders_user
  ON public.bloodwork_reminders(user_id, status);

-- Auto-schedule 75/90/105-day reminders when a bloodwork report completes
CREATE OR REPLACE FUNCTION public.schedule_bloodwork_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anchor_ts TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    anchor_ts := COALESCE(NEW.report_date::timestamptz, NEW.uploaded_at, now());
    INSERT INTO public.bloodwork_reminders (user_id, lab_report_id, kind, due_at)
    VALUES
      (NEW.user_id, NEW.id, 'pre',      anchor_ts + INTERVAL '75 days'),
      (NEW.user_id, NEW.id, 'due',      anchor_ts + INTERVAL '90 days'),
      (NEW.user_id, NEW.id, 'overdue',  anchor_ts + INTERVAL '105 days')
    ON CONFLICT (lab_report_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_bloodwork_reminders ON public.lab_reports;
CREATE TRIGGER trg_schedule_bloodwork_reminders
AFTER UPDATE ON public.lab_reports
FOR EACH ROW EXECUTE FUNCTION public.schedule_bloodwork_reminders();
