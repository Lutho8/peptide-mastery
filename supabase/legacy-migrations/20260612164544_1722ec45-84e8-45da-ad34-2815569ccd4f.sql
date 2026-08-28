
-- 1. safety_profiles
CREATE TABLE public.safety_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  medications text[] NOT NULL DEFAULT '{}',
  conditions text[] NOT NULL DEFAULT '{}',
  allergies text[] NOT NULL DEFAULT '{}',
  is_pregnant boolean NOT NULL DEFAULT false,
  age integer,
  sex text,
  weight_kg numeric,
  kidney_status text,
  liver_status text,
  oncology_history boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_profiles TO authenticated;
GRANT ALL ON public.safety_profiles TO service_role;
ALTER TABLE public.safety_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own safety profile" ON public.safety_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_safety_profiles_updated BEFORE UPDATE ON public.safety_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. safety_checks (cache)
CREATE TABLE public.safety_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  peptide_id text NOT NULL,
  profile_hash text NOT NULL,
  status text NOT NULL,
  severity text NOT NULL,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  contraindications jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasoning text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, peptide_id, profile_hash)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_checks TO authenticated;
GRANT ALL ON public.safety_checks TO service_role;
ALTER TABLE public.safety_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own safety checks" ON public.safety_checks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_safety_checks_lookup ON public.safety_checks (user_id, peptide_id, expires_at);

-- 3. pk_user_overrides
CREATE TABLE public.pk_user_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  peptide_id text NOT NULL,
  half_life_hours numeric,
  bioavailability numeric,
  absorption_rate numeric,
  route text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, peptide_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pk_user_overrides TO authenticated;
GRANT ALL ON public.pk_user_overrides TO service_role;
ALTER TABLE public.pk_user_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pk overrides" ON public.pk_user_overrides
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_pk_overrides_updated BEFORE UPDATE ON public.pk_user_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
