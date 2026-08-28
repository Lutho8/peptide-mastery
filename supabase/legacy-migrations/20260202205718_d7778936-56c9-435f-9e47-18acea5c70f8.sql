-- Fix 1: Harden the handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Sanitize and validate the display_name from user metadata
  safe_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    'User'
  );
  -- Limit length to prevent excessively long values
  safe_name := LEFT(safe_name, 100);
  -- Remove any potentially dangerous characters
  safe_name := regexp_replace(safe_name, '[<>"'';&]', '', 'g');
  
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, safe_name);
  RETURN NEW;
END;
$$;

-- Fix 2: Add constraint on profiles.display_name to enforce length limit
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_display_name_length 
CHECK (char_length(display_name) <= 100);

-- Fix 3: Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix 4: Create encryption helper functions for Renpho credentials
-- These will be used by the edge function to encrypt/decrypt credentials

-- Function to encrypt text data
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
END;
$$;

-- Function to decrypt text data
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL; -- Return NULL if decryption fails
END;
$$;

-- Revoke direct access to these functions from anon and authenticated roles
-- They should only be called by the service role (edge functions)
REVOKE ALL ON FUNCTION public.encrypt_credential(TEXT, TEXT) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_credential(TEXT, TEXT) FROM anon, authenticated;