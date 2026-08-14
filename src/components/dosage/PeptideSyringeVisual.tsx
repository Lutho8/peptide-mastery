import { useMemo } from 'react';
import { SyringeVisual } from '@/components/dosage/SyringeVisual';
import { getStoredVialSize } from '@/components/peptide/VialSizeSelector';
import { parseDose, resolveConcentration } from '@/lib/doseMath';

interface Props {
  peptideId: string;
  /** Dose string such as "1 mg" or "0.5-1 mg twice weekly". */
  doseStr?: string;
  className?: string;
}

/**
 * Connects the presentational SyringeVisual to catalog data: resolves the
 * peptide's concentration (stored vial size or the standard fallback) and the
 * mg value from a free-form dose string. Renders nothing for IU/unit doses.
 */
export function PeptideSyringeVisual({ peptideId, doseStr, className }: Props) {
  const data = useMemo(() => {
    const conc = resolveConcentration(peptideId, getStoredVialSize(peptideId));
    const parsed = parseDose(doseStr);
    if (!parsed || parsed.unit === 'iu' || parsed.unit === 'units') return null;
    const mg = parsed.unit === 'ml' ? parsed.value * conc.mgPerMl : parsed.value;
    return { mgPerMl: conc.mgPerMl, mg, note: conc.source };
  }, [peptideId, doseStr]);

  if (!data) return null;

  return (
    <SyringeVisual
      doseMg={Math.round(data.mg * 1000) / 1000}
      mgPerMl={data.mgPerMl}
      presets={[data.mg, ...[0.25, 0.5, 1, 2, 4].filter((p) => Math.abs(p - data.mg) > 0.0001)]
        .sort((a, b) => a - b)
        .slice(0, 5)}
      concentrationNote={data.note}
      className={className}
    />
  );
}
