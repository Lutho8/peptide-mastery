-- Deduplicate any existing duplicates, keeping the most recently updated row
DELETE FROM public.user_stacks a
USING public.user_stacks b
WHERE a.user_id = b.user_id
  AND a.peptide_id = b.peptide_id
  AND a.updated_at < b.updated_at;

-- In case ties remain, keep the lowest id
DELETE FROM public.user_stacks a
USING public.user_stacks b
WHERE a.user_id = b.user_id
  AND a.peptide_id = b.peptide_id
  AND a.id > b.id;

ALTER TABLE public.user_stacks
  ADD CONSTRAINT user_stacks_user_peptide_unique UNIQUE (user_id, peptide_id);