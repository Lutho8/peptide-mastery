INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', false);

CREATE TABLE public.lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  file_url text NOT NULL,
  file_name text NOT NULL,
  report_date date,
  status text NOT NULL DEFAULT 'pending',
  ai_summary text,
  extracted_biomarkers jsonb DEFAULT '[]'::jsonb,
  ai_insights text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lab reports" ON public.lab_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lab reports" ON public.lab_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lab reports" ON public.lab_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lab reports" ON public.lab_reports FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own lab reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own lab reports storage" ON storage.objects FOR SELECT USING (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own lab reports storage" ON storage.objects FOR DELETE USING (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);