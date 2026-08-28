-- Create daily_doses table for cloud sync
CREATE TABLE public.daily_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  peptide_id TEXT NOT NULL,
  peptide_name TEXT NOT NULL,
  dose NUMERIC NOT NULL CHECK (dose > 0),
  unit TEXT NOT NULL CHECK (unit IN ('mcg', 'mg', 'IU')),
  time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_doses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own doses"
ON public.daily_doses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doses"
ON public.daily_doses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doses"
ON public.daily_doses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own doses"
ON public.daily_doses FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient date-based queries
CREATE INDEX idx_daily_doses_user_date ON public.daily_doses(user_id, date);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_doses_updated_at
BEFORE UPDATE ON public.daily_doses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();