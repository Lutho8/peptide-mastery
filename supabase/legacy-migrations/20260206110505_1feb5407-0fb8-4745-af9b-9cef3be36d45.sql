
-- Add email notification preference to dose_reminders
ALTER TABLE public.dose_reminders ADD COLUMN IF NOT EXISTS email_notification_enabled boolean NOT NULL DEFAULT false;

-- Add user email preference to profiles for receiving email reminders  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT false;
