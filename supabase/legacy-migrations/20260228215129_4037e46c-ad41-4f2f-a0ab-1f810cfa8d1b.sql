-- Add unique constraint on body_composition (user_id, date) so upsert works
CREATE UNIQUE INDEX body_composition_user_date_unique ON public.body_composition (user_id, date);