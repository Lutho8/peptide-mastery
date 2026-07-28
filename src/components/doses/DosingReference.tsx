import { useMemo } from 'react';
import { Beaker, Droplet, Syringe, AlertCircle } from 'lucide-react';
import { findBlendData } from '@/data/blendAdapters';
import { getVialSizesFor } from '@/data/vialSizes';
import { parseDose, resolveConcentration, convertDose, type SyringeType } from '@/lib/doseMath';
import { cn } from '@/lib/utils';

interface DosingReferenceProps {
  peptideId: string;
  dose: string;
  /** Optional override of syringe type. Defaults to U-40 (insulin) per Peptide South Africa standard. */
  syringe?: SyringeType;
  className?: string;
}

/**
 * Compact, read-only reconstitution + per-dose syringe reference shown inside
 * cycle cards. Pulls from existing vial catalog / dose math; never uses mcg.
 */
export function DosingReference({ peptideId, dose, syringe = 'U-40', className }: DosingReferenceProps) {
  const blend = findBlendData(peptideId);

  const ref = useMemo(() => {
    // Blend path — use its declared vial size + reconstitute string
    if (blend) {
      const mg = parseFloat(blend.vialSize.match(/([\d.]+)\s*mg/i)?.[1] ?? '');
      const ml = parseFloat(blend.quickstart.reconstitute.match(/([\d.]+)\s*mL/i)?.[1] ?? '');
      const conc = resolveConcentration(peptideId);
      const parsed = parseDose(dose);
      const converted = parsed ? convertDose(parsed, conc.mgPerMl, syringe) : null;
      return {
        vial: isFinite(mg) && mg > 0 ? `${mg} mg` : blend.vialSize,
        bac: isFinite(ml) && ml > 0 ? `${ml} mL BAC` : blend.quickstart.reconstitute,
        concentration: `${conc.mgPerMl.toFixed(2)} mg/mL`,
        perDose: converted
          ? `${Math.round(converted.units)} ${syringe}`
          : (parsed?.unit === 'iu' || parsed?.unit === 'units' ? dose : '—'),
        perDoseMl: converted ? `${converted.mL.toFixed(2)} mL` : null,
      };
    }

    // Single-peptide path
    const sizes = getVialSizesFor(peptideId) ?? [];
    const vialMg = sizes[0]; // smallest commonly stocked size
    const bacMl = vialMg && vialMg <= 10 ? 2 : vialMg && vialMg <= 20 ? 2 : 3;
    const conc = resolveConcentration(peptideId, vialMg, bacMl);
    const parsed = parseDose(dose);
    const converted = parsed ? convertDose(parsed, conc.mgPerMl, syringe) : null;

    return {
      vial: vialMg ? `${vialMg} mg` : '—',
      bac: vialMg ? `${bacMl} mL BAC` : '—',
      concentration: `${conc.mgPerMl.toFixed(2)} mg/mL`,
      perDose: converted
        ? `${Math.round(converted.units)} ${syringe}`
        : (parsed?.unit === 'iu' || parsed?.unit === 'units' ? dose : '—'),
      perDoseMl: converted ? `${converted.mL.toFixed(2)} mL` : null,
    };
  }, [blend, peptideId, dose, syringe]);

  return (
    <div
      className={cn(
        'rounded-lg border border-primary/15 bg-primary/5 p-2.5 text-[11px]',
        className,
      )}
      data-testid="dosing-reference"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Beaker size={12} className="text-primary" />
        <span className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
          Reconstitution &amp; Dose
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-muted-foreground flex items-center gap-1"><Beaker size={10} /> Vial</p>
          <p className="text-foreground font-medium leading-tight">{ref.vial}</p>
        </div>
        <div>
          <p className="text-muted-foreground flex items-center gap-1"><Droplet size={10} /> Mix</p>
          <p className="text-foreground font-medium leading-tight">{ref.bac}</p>
        </div>
        <div>
          <p className="text-muted-foreground flex items-center gap-1"><Syringe size={10} /> Per dose</p>
          <p className="text-primary font-semibold leading-tight">{ref.perDose}</p>
          {ref.perDoseMl && (
            <p className="text-[9px] text-muted-foreground leading-tight">{ref.perDoseMl}</p>
          )}
        </div>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{ref.concentration} concentration</span>
        <span className="inline-flex items-center gap-1"><AlertCircle size={9} /> Use within 28 days</span>
      </div>
    </div>
  );
}
