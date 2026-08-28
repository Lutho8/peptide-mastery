UPDATE public.daily_doses SET dose = dose / 1000, unit = 'mg' WHERE unit = 'mcg';
ALTER TABLE public.daily_doses DROP CONSTRAINT daily_doses_unit_check;
ALTER TABLE public.daily_doses ADD CONSTRAINT daily_doses_unit_check CHECK (unit = ANY (ARRAY['mg'::text, 'IU'::text, 'units'::text]));