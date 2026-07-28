import { useMemo, useState } from 'react';
import { Syringe, Wind, Info } from 'lucide-react';
import {
  getRouteDosing,
  getAvailableRoutes,
  type DoseRoute,
  type ExperienceTier,
  type Sex,
} from '@/data/dosingRoutes';
import { parseDose, resolveConcentration, convertDose } from '@/lib/doseMath';
import { getStoredVialSize } from '@/components/peptide/VialSizeSelector';
import { cn } from '@/lib/utils';

interface Props {
  peptideId: string;
  tier?: ExperienceTier;
  sex?: Sex;
  defaultRoute?: DoseRoute;
  className?: string;
  /** Fires whenever the user changes route so parent (e.g. EditStackModal)
   *  can persist the choice on the StackItem. */
  onRouteChange?: (route: DoseRoute) => void;
}

const TIERS: ExperienceTier[] = ['beginner', 'intermediate', 'advanced', 'athlete'];
const TIER_LABEL: Record<ExperienceTier, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  athlete: 'Athlete',
};

/** Render "≈ N units (U-40)" for a mg-denominated dose string. Skips IU/units strings. */
function unitsHint(peptideId: string, doseStr: string): string | null {
  const parsed = parseDose(doseStr);
  if (!parsed || parsed.unit === 'iu' || parsed.unit === 'units') return null;
  const conc = resolveConcentration(peptideId, getStoredVialSize(peptideId));
  const out = convertDose(parsed, conc.mgPerMl, 'U-40');
  if (!out) return null;
  // Show 1 decimal for sub-unit doses so low-mass peptides don't display "≈ 0 units".
  const display = out.units >= 10 ? Math.round(out.units).toString() : out.units.toFixed(1);
  return `≈ ${display} units (U-40)`;
}

/**
 * Dosing schedule with route (subcutaneous / intranasal) + sex + tier
 * controls. Renders nothing if the peptide has no multi-route data.
 * Defaults to SubQ so users see mg/units first — intranasal is one tap away.
 */
export function DosingSchedule({
  peptideId,
  tier: tierProp,
  sex: sexProp,
  defaultRoute,
  className,
  onRouteChange,
}: Props) {
  const routes = getAvailableRoutes(peptideId);
  const rd = getRouteDosing(peptideId);

  const [route, setRoute] = useState<DoseRoute>(
    defaultRoute && routes.includes(defaultRoute) ? defaultRoute : (routes[0] ?? 'subcutaneous'),
  );
  const [tier, setTier] = useState<ExperienceTier>(tierProp ?? 'intermediate');
  const [sex, setSex] = useState<Sex>(sexProp ?? 'male');

  const table = useMemo(() => rd?.[route], [rd, route]);

  if (!rd || routes.length === 0 || !table) return null;

  const changeRoute = (r: DoseRoute) => {
    setRoute(r);
    onRouteChange?.(r);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3 sm:p-4 space-y-3',
        className,
      )}
      data-testid="dosing-schedule"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Info size={14} className="text-primary" />
          Dosing Schedule
        </h4>
        {routes.length > 1 && (
          <div
            role="tablist"
            aria-label="Administration route"
            className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 w-full sm:w-auto"
          >
            {routes.map((r) => {
              const active = r === route;
              const Icon = r === 'intranasal' ? Wind : Syringe;
              return (
                <button
                  key={r}
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeRoute(r)}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[44px] touch-manipulation',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground active:bg-muted',
                  )}
                >
                  <Icon size={14} />
                  <span>{r === 'intranasal' ? 'Intranasal' : 'Sub-Q (mg/units)'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sex + tier row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div
          role="tablist"
          aria-label="Sex"
          className="inline-flex rounded-md border border-border bg-muted/30 p-0.5"
        >
          {(['male', 'female'] as Sex[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={sex === s}
              onClick={() => setSex(s)}
              className={cn(
                'px-3 py-2 rounded text-xs font-medium transition min-h-[44px] min-w-[64px] capitalize touch-manipulation',
                sex === s ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground">{table.frequency}</div>
      </div>

      {/* Tier grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIERS.map((t) => {
          const cell = table[t];
          const active = t === tier;
          const hint = route === 'subcutaneous' ? unitsHint(peptideId, cell[sex]) : null;
          return (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                'text-left rounded-lg border p-2.5 transition-all min-h-[84px] touch-manipulation',
                active
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-background/40 hover:border-primary/40 active:bg-primary/5',
              )}
              aria-pressed={active}
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {TIER_LABEL[t]}
              </p>
              <p className={cn('text-sm font-semibold leading-tight mt-0.5', active ? 'text-primary' : 'text-foreground')}>
                {cell[sex]}
              </p>
              {hint && (
                <p className="text-[10px] text-primary/80 mt-0.5 leading-tight font-medium">{hint}</p>
              )}
              {cell.notes && (
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{cell.notes}</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
        <span>Cycle: {table.cycleDays}</span>
        <span>Route: <span className="capitalize text-foreground">{route === 'intranasal' ? 'intranasal' : 'subcutaneous'}</span></span>
      </div>

      {(rd.routeGuidance || table.sourceNotes) && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          {rd.routeGuidance} {table.sourceNotes && <span className="opacity-80">— {table.sourceNotes}</span>}
        </p>
      )}
    </div>
  );
}
