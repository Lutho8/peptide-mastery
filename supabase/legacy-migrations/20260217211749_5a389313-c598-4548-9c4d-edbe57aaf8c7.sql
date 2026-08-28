
-- CRM table for course enrollments
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  sms_consent BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  course_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public inserts (no auth required for free course enrollment)
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can enroll in the free course"
  ON public.course_enrollments
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read enrollments (CRM access)
CREATE POLICY "Admins can view all enrollments"
  ON public.course_enrollments
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update enrollments
CREATE POLICY "Admins can update enrollments"
  ON public.course_enrollments
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete enrollments
CREATE POLICY "Admins can delete enrollments"
  ON public.course_enrollments
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Unique constraint on email to prevent duplicate enrollments
CREATE UNIQUE INDEX idx_course_enrollments_email ON public.course_enrollments (email);

-- Trigger for updated_at
CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
