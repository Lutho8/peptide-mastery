-- Legacy users imported during the independent Supabase cutover can contain
-- NULL values in Auth string fields. GoTrue scans these fields into strings,
-- causing otherwise valid email and OAuth sign-ins to fail with HTTP 500.
--
-- Supabase troubleshooting guidance for confirmation_token:
-- https://supabase.com/docs/guides/troubleshooting/scan-error-on-column-confirmation_token-converting-null-to-string-is-unsupported-during-auth-login-a0c686

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  phone_change = coalesce(phone_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or email_change is null
   or phone_change_token is null
   or phone_change is null
   or email_change_token_current is null
   or reauthentication_token is null;
