ALTER TABLE public.lab_reports
  ADD COLUMN IF NOT EXISTS scan_type text NOT NULL DEFAULT 'baseline',
  ADD COLUMN IF NOT EXISTS patient_age integer,
  ADD COLUMN IF NOT EXISTS patient_sex text,
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS peptide_history_used boolean,
  ADD COLUMN IF NOT EXISTS peptide_history_notes text,
  ADD COLUMN IF NOT EXISTS health_score integer,
  ADD COLUMN IF NOT EXISTS protocol jsonb,
  ADD COLUMN IF NOT EXISTS recommended_stack_peptides text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.lab_reports
  DROP CONSTRAINT IF EXISTS lab_reports_scan_type_check;
ALTER TABLE public.lab_reports
  ADD CONSTRAINT lab_reports_scan_type_check CHECK (scan_type IN ('baseline','deep'));

ALTER TABLE public.lab_reports
  DROP CONSTRAINT IF EXISTS lab_reports_health_score_range;
ALTER TABLE public.lab_reports
  ADD CONSTRAINT lab_reports_health_score_range CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));