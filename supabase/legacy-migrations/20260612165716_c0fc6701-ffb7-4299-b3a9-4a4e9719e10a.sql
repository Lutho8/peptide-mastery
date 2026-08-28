
-- =============== INVENTORY V2 ===============
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  peptide_id TEXT NOT NULL,
  peptide_name TEXT NOT NULL,
  vial_total_mg NUMERIC NOT NULL CHECK (vial_total_mg > 0),
  bac_water_ml NUMERIC,
  reconstituted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  remaining_mg NUMERIC NOT NULL,
  lot_number TEXT,
  vendor TEXT,
  coa_url TEXT,
  status TEXT NOT NULL DEFAULT 'sealed' CHECK (status IN ('sealed','active','finished','expired','discarded')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inventory" ON public.inventory_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_inventory_user_peptide_status ON public.inventory_items (user_id, peptide_id, status);
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set expires_at = reconstituted_at + 28 days whenever reconstituted_at is set/changed
CREATE OR REPLACE FUNCTION public.set_inventory_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reconstituted_at IS NOT NULL THEN
    NEW.expires_at := NEW.reconstituted_at + INTERVAL '28 days';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_set_inventory_expiry
  BEFORE INSERT OR UPDATE OF reconstituted_at ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_inventory_expiry();

-- Decrement oldest active vial on dose insert (when dose unit = mg)
CREATE OR REPLACE FUNCTION public.decrement_inventory_on_dose()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  IF NEW.unit <> 'mg' THEN RETURN NEW; END IF;
  SELECT id INTO target_id
    FROM public.inventory_items
   WHERE user_id = NEW.user_id
     AND peptide_id = NEW.peptide_id
     AND status IN ('sealed','active')
     AND remaining_mg > 0
   ORDER BY COALESCE(reconstituted_at, created_at) ASC
   LIMIT 1;
  IF target_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.inventory_items
     SET remaining_mg = GREATEST(0, remaining_mg - NEW.dose),
         status = CASE
                    WHEN remaining_mg - NEW.dose <= 0 THEN 'finished'
                    WHEN status = 'sealed' THEN 'active'
                    ELSE status
                  END,
         updated_at = now()
   WHERE id = target_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_decrement_inventory
  AFTER INSERT ON public.daily_doses
  FOR EACH ROW EXECUTE FUNCTION public.decrement_inventory_on_dose();

-- =============== INJECTION SITES CATALOG ===============
CREATE TABLE public.injection_sites (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('L','R','C')),
  zone_index SMALLINT NOT NULL,
  svg_path_id TEXT NOT NULL,
  recommended_routes TEXT[] NOT NULL DEFAULT ARRAY['subcutaneous']::TEXT[],
  display_name TEXT NOT NULL
);
GRANT SELECT ON public.injection_sites TO authenticated;
GRANT ALL ON public.injection_sites TO service_role;
ALTER TABLE public.injection_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read injection sites" ON public.injection_sites
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.injection_sites (id, region, side, zone_index, svg_path_id, recommended_routes, display_name) VALUES
  ('abdomen-ul','abdomen','L',1,'zone-abdomen-ul',ARRAY['subcutaneous'],'Upper Abdomen (Left)'),
  ('abdomen-ur','abdomen','R',2,'zone-abdomen-ur',ARRAY['subcutaneous'],'Upper Abdomen (Right)'),
  ('abdomen-ll','abdomen','L',3,'zone-abdomen-ll',ARRAY['subcutaneous'],'Lower Abdomen (Left)'),
  ('abdomen-lr','abdomen','R',4,'zone-abdomen-lr',ARRAY['subcutaneous'],'Lower Abdomen (Right)'),
  ('thigh-l','thigh','L',5,'zone-thigh-l',ARRAY['subcutaneous','intramuscular'],'Thigh (Left)'),
  ('thigh-r','thigh','R',6,'zone-thigh-r',ARRAY['subcutaneous','intramuscular'],'Thigh (Right)'),
  ('deltoid-l','deltoid','L',7,'zone-deltoid-l',ARRAY['subcutaneous','intramuscular'],'Deltoid (Left)'),
  ('deltoid-r','deltoid','R',8,'zone-deltoid-r',ARRAY['subcutaneous','intramuscular'],'Deltoid (Right)'),
  ('triceps-l','triceps','L',9,'zone-triceps-l',ARRAY['subcutaneous'],'Triceps (Left)'),
  ('triceps-r','triceps','R',10,'zone-triceps-r',ARRAY['subcutaneous'],'Triceps (Right)'),
  ('glute-ul','glute','L',11,'zone-glute-ul',ARRAY['intramuscular'],'Upper Glute (Left)'),
  ('glute-ur','glute','R',12,'zone-glute-ur',ARRAY['intramuscular'],'Upper Glute (Right)'),
  ('flank-l','flank','L',13,'zone-flank-l',ARRAY['subcutaneous'],'Flank/Love Handle (Left)'),
  ('flank-r','flank','R',14,'zone-flank-r',ARRAY['subcutaneous'],'Flank/Love Handle (Right)');

-- =============== INJECTION RECORDS ===============
CREATE TABLE public.injection_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_id TEXT NOT NULL REFERENCES public.injection_sites(id),
  peptide_id TEXT NOT NULL,
  peptide_name TEXT,
  dose_mg NUMERIC,
  route TEXT NOT NULL DEFAULT 'subcutaneous',
  injected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pain_score SMALLINT CHECK (pain_score BETWEEN 0 AND 10),
  swelling_score SMALLINT CHECK (swelling_score BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.injection_records TO authenticated;
GRANT ALL ON public.injection_records TO service_role;
ALTER TABLE public.injection_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own injection records" ON public.injection_records
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_injection_records_user_time ON public.injection_records (user_id, injected_at DESC);
CREATE INDEX idx_injection_records_user_site ON public.injection_records (user_id, site_id, injected_at DESC);
