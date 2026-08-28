-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create calculator_settings table
CREATE TABLE public.calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  syringe_type TEXT NOT NULL DEFAULT 'u40',
  experience_level TEXT NOT NULL DEFAULT 'intermediate',
  last_vial_size TEXT,
  last_bac_water TEXT,
  last_target_dose TEXT,
  last_selected_peptide TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;

-- Calculator settings RLS policies
CREATE POLICY "Users can view own settings" ON public.calculator_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.calculator_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.calculator_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.calculator_settings FOR DELETE USING (auth.uid() = user_id);

-- Create dose_reminders table
CREATE TABLE public.dose_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  peptide_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  time TIME NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dose_reminders ENABLE ROW LEVEL SECURITY;

-- Dose reminders RLS policies
CREATE POLICY "Users can view own reminders" ON public.dose_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.dose_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.dose_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.dose_reminders FOR DELETE USING (auth.uid() = user_id);

-- Create body_composition table with all Renpho fields
CREATE TABLE public.body_composition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(4,1),
  body_fat DECIMAL(4,1),
  fat_free_weight DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  skeletal_muscle DECIMAL(4,1),
  body_water DECIMAL(4,1),
  subcutaneous_fat DECIMAL(4,1),
  visceral_fat INTEGER,
  bone_mass DECIMAL(4,2),
  protein DECIMAL(4,1),
  bmr INTEGER,
  metabolic_age INTEGER,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;

-- Body composition RLS policies
CREATE POLICY "Users can view own composition" ON public.body_composition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own composition" ON public.body_composition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own composition" ON public.body_composition FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own composition" ON public.body_composition FOR DELETE USING (auth.uid() = user_id);

-- Create renpho_credentials table for storing encrypted credentials
CREATE TABLE public.renpho_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_encrypted TEXT NOT NULL,
  password_hash_encrypted TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renpho_credentials ENABLE ROW LEVEL SECURITY;

-- Renpho credentials RLS policies
CREATE POLICY "Users can view own credentials" ON public.renpho_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.renpho_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credentials" ON public.renpho_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.renpho_credentials FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calculator_settings_updated_at BEFORE UPDATE ON public.calculator_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dose_reminders_updated_at BEFORE UPDATE ON public.dose_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_renpho_credentials_updated_at BEFORE UPDATE ON public.renpho_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();