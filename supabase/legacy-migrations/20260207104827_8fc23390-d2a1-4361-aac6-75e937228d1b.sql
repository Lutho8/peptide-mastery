
-- Fix daily_doses RLS policies: Drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own doses" ON public.daily_doses;
DROP POLICY IF EXISTS "Users can insert own doses" ON public.daily_doses;
DROP POLICY IF EXISTS "Users can update own doses" ON public.daily_doses;
DROP POLICY IF EXISTS "Users can delete own doses" ON public.daily_doses;

CREATE POLICY "Users can view own doses" ON public.daily_doses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own doses" ON public.daily_doses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own doses" ON public.daily_doses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own doses" ON public.daily_doses FOR DELETE USING (auth.uid() = user_id);

-- Fix dose_reminders RLS policies
DROP POLICY IF EXISTS "Users can view own reminders" ON public.dose_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.dose_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.dose_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.dose_reminders;

CREATE POLICY "Users can view own reminders" ON public.dose_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.dose_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.dose_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.dose_reminders FOR DELETE USING (auth.uid() = user_id);

-- Fix user_stacks RLS policies
DROP POLICY IF EXISTS "Users can view own stacks" ON public.user_stacks;
DROP POLICY IF EXISTS "Users can insert own stacks" ON public.user_stacks;
DROP POLICY IF EXISTS "Users can update own stacks" ON public.user_stacks;
DROP POLICY IF EXISTS "Users can delete own stacks" ON public.user_stacks;

CREATE POLICY "Users can view own stacks" ON public.user_stacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stacks" ON public.user_stacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stacks" ON public.user_stacks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stacks" ON public.user_stacks FOR DELETE USING (auth.uid() = user_id);

-- Fix body_composition RLS policies
DROP POLICY IF EXISTS "Users can view own composition" ON public.body_composition;
DROP POLICY IF EXISTS "Users can insert own composition" ON public.body_composition;
DROP POLICY IF EXISTS "Users can update own composition" ON public.body_composition;
DROP POLICY IF EXISTS "Users can delete own composition" ON public.body_composition;

CREATE POLICY "Users can view own composition" ON public.body_composition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own composition" ON public.body_composition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own composition" ON public.body_composition FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own composition" ON public.body_composition FOR DELETE USING (auth.uid() = user_id);

-- Fix calculator_settings RLS policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.calculator_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.calculator_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.calculator_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.calculator_settings;

CREATE POLICY "Users can view own settings" ON public.calculator_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.calculator_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.calculator_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.calculator_settings FOR DELETE USING (auth.uid() = user_id);

-- Fix profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_memberships RLS policies
DROP POLICY IF EXISTS "Users can view own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can create own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.user_memberships;

CREATE POLICY "Users can view own membership" ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own membership" ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.user_memberships FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all memberships" ON public.user_memberships FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles RLS policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix renpho_credentials RLS policies
DROP POLICY IF EXISTS "Users can view own credentials" ON public.renpho_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.renpho_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.renpho_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.renpho_credentials;

CREATE POLICY "Users can view own credentials" ON public.renpho_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.renpho_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credentials" ON public.renpho_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.renpho_credentials FOR DELETE USING (auth.uid() = user_id);
