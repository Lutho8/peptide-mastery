
ALTER TABLE public.qna_registrations
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_country_code TEXT DEFAULT '+49',
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS email_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing full_name data to first_name/last_name
UPDATE public.qna_registrations 
SET first_name = split_part(full_name, ' ', 1),
    last_name = CASE 
      WHEN position(' ' in full_name) > 0 
      THEN substring(full_name from position(' ' in full_name) + 1)
      ELSE ''
    END
WHERE first_name IS NULL;
