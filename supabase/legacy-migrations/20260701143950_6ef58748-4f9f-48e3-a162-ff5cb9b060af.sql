ALTER TABLE public.lab_reports
  ADD COLUMN IF NOT EXISTS ai_summary_de text,
  ADD COLUMN IF NOT EXISTS ai_insights_de text,
  ADD COLUMN IF NOT EXISTS detected_language text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'lab_reports'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_reports';
  END IF;
END $$;

ALTER TABLE public.lab_reports REPLICA IDENTITY FULL;