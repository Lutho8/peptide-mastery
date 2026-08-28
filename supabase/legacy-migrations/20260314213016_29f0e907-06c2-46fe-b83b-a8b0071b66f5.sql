
CREATE TABLE public.qna_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  experience_level TEXT NOT NULL DEFAULT 'beginner',
  topics_of_interest TEXT[],
  session_month TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, session_month)
);

ALTER TABLE public.qna_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (lead gen - no auth required)
CREATE POLICY "Anyone can register for QnA sessions"
ON public.qna_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view registrations
CREATE POLICY "Admins can view all registrations"
ON public.qna_registrations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
