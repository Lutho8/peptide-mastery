-- Extend the profiles table with personalization fields synced from the onboarding wizard
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS activity_level TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Validate categorical fields without using time-based check constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check,
  DROP CONSTRAINT IF EXISTS profiles_activity_check,
  DROP CONSTRAINT IF EXISTS profiles_experience_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR gender IN ('male','female')),
  ADD CONSTRAINT profiles_activity_check CHECK (activity_level IS NULL OR activity_level IN ('sedentary','moderate','active','athlete')),
  ADD CONSTRAINT profiles_experience_check CHECK (experience IS NULL OR experience IN ('beginner','intermediate','advanced'));