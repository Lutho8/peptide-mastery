-- Create user_stacks table for syncing active protocols across devices
CREATE TABLE public.user_stacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  peptide_id TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_stacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
CREATE POLICY "Users can view own stacks"
ON public.user_stacks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stacks"
ON public.user_stacks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stacks"
ON public.user_stacks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stacks"
ON public.user_stacks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_stacks_updated_at
BEFORE UPDATE ON public.user_stacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster user lookups
CREATE INDEX idx_user_stacks_user_id ON public.user_stacks(user_id);