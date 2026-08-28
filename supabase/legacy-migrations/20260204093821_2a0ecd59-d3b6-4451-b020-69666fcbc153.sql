-- Create enum for membership status
CREATE TYPE public.membership_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- Create user_memberships table to track subscriptions
CREATE TABLE public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status membership_status NOT NULL DEFAULT 'pending',
    paypal_subscription_id TEXT,
    paypal_payer_id TEXT,
    plan_id TEXT,
    price_amount NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
    currency TEXT NOT NULL DEFAULT 'EUR',
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only view their own membership
CREATE POLICY "Users can view own membership"
ON public.user_memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own membership (for initial creation)
CREATE POLICY "Users can create own membership"
ON public.user_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "Users can update own membership"
ON public.user_memberships
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_memberships_updated_at
BEFORE UPDATE ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to check if user has active membership (for use in other policies)
CREATE OR REPLACE FUNCTION public.has_active_membership(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_memberships
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;