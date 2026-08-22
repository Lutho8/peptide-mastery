import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Syringe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyringeType } from '@/lib/doseMath';

interface SyringeVisualProps {
  /** Dose in mg to visualise. */
  doseMg: number;
  /** Concentration of the reconstituted vial. */
  mgPerMl: number;
  /** Syringe barrel type. */
  syringe?: SyringeType;
  onSyringeChange?: (s: SyringeType) => void;
  /** Optional preset doses (mg) shown as tappable chips. */
  presets?: number[];
  onDoseChange?: (mg: number) => void;
  concentrationNote?: string;
  className?: string;
}

const DEFAULT_PRESETS = [0.25, 0.5, 1, 2, 4];

// SVG geometry (viewBox 0 0 320 90)
const BARREL_X = 20;
const BARREL_W = 236;
const BARREL_Y = 30;
const BARREL_H = 26;

export function SyringeVisual({
  doseMg,
  mgPerMl,
  syringe: syringeProp,
  onSyringeChange,
  presets = DEFAULT_PRESETS,
  onDoseChange,
  concentrationNote,
  className,
}: SyringeVisualProps) {
  const [internalSyringe, setInternalSyringe] = useState<SyringeType>('U-40');
  const [internalDose, setInternalDose] = useState<number | null>(null);

  const syringe = syringeProp ?? internalSyringe;
  const setSyringe = (s: SyringeType) => {
    setInternalSyringe(s);
    onSyringeChange?.(s);
  };

  const activeDose = internalDose ?? doseMg;
  const setDose = (mg: number) => {
    setInternalDose(mg);
    onDoseChange?.(mg);
  };

  const capacity = syringe === 'U-40' ? 40 : 100;
  const perMl = capacity; // U-40 barrel = 40 units per mL, U-100 = 100 per mL

  const { units, mL, overflow, fillFraction } = useMemo(() => {
    const safeConc = mgPerMl > 0 ? mgPerMl : 5;
    const volume = activeDose / safeConc;
    const u = volume * perMl;
    return {
      units: u,
      mL: volume,
      overflow: u > capacity,
      fillFraction: Math.max(0, Math.min(1, u / capacity)),
    };
  }, [activeDose, mgPerMl, perMl, capacity]);

  const majorStep = syringe === 'U-40' ? 5 : 10;
  const ticks = useMemo(() => {
    const out: { value: number; x: number; major: boolean }[] = [];
    const minorStep = majorStep / 5;
    for (let v = 0; v <= capacity + 0.001; v += minorStep) {
      const value = Math.round(v * 100) / 100;
      out.push({
        value,
        x: BARREL_X + (value / capacity) * BARREL_W,
        major: Math.abs(value % majorStep) < 0.001,
      });
    }
    return out;
  }, [capacity, majorStep]);

  const fillW = BARREL_W * fillFraction;
  const markerX = BARREL_X + fillW;
  const unitLabel = units < 10 ? units.toFixed(1) : Math.round(units).toString();

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3',
        className,
      )}
      data-testid="syringe-visual"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Syringe size={15} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Draw-up Guide</span>
        </div>
        {!syringeProp && (
          <div
            className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1"
            role="group"
            aria-label="Syringe scale"
          >
            {(['U-40', 'U-100'] as SyringeType[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSyringe(opt)}
                className={cn(
                  'relative min-h-11 min-w-11 px-4 text-sm font-medium rounded-md touch-manipulation',
                  'transition-[transform,background-color,color] active:scale-[0.97]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  syringe === opt
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground active:bg-muted',
                )}
                aria-pressed={syringe === opt}
                aria-label={`Use ${opt} syringe scale`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

      </div>

      <svg
        viewBox="0 0 320 90"
        className="w-full h-auto"
        role="img"
        aria-label={`${activeDose} mg equals ${unitLabel} units on a ${syringe} syringe`}
      >
        {/* Needle */}
        <line x1={286} y1={43} x2={314} y2={43} className="stroke-muted-foreground" strokeWidth={2} />
        <rect x={256} y={36} width={30} height={14} rx={3} className="fill-muted stroke-border" strokeWidth={1} />

        {/* Barrel */}
        <rect
          x={BARREL_X}
          y={BARREL_Y}
          width={BARREL_W}
          height={BARREL_H}
          rx={4}
          className="fill-background stroke-border"
          strokeWidth={1.5}
        />

        {/* Fill */}
        <motion.rect
          x={BARREL_X}
          y={BARREL_Y + 1.5}
          height={BARREL_H - 3}
          rx={3}
          className={overflow ? 'fill-destructive/40' : 'fill-primary/35'}
          initial={false}
          animate={{ width: Math.max(0, fillW) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />

        {/* Plunger */}
        <motion.g
          initial={false}
          animate={{ x: Math.max(0, fillW) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        >
          <rect x={BARREL_X - 2} y={BARREL_Y - 2} width={5} height={BARREL_H + 4} rx={2} className="fill-primary" />
          <line
            x1={BARREL_X}
            y1={BARREL_Y - 10}
            x2={BARREL_X}
            y2={BARREL_Y + BARREL_H + 8}
            className={overflow ? 'stroke-destructive' : 'stroke-primary'}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        </motion.g>

        {/* Flange */}
        <rect x={12} y={26} width={6} height={34} rx={2} className="fill-muted stroke-border" strokeWidth={1} />

        {/* Ticks */}
        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={t.x}
              y1={BARREL_Y}
              x2={t.x}
              y2={BARREL_Y + (t.major ? 9 : 5)}
              className="stroke-muted-foreground"
              strokeWidth={t.major ? 1 : 0.6}
              opacity={t.major ? 0.8 : 0.45}
            />
            {t.major && (
              <text
                x={t.x}
                y={BARREL_Y + 20}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={7}
              >
                {t.value}
              </text>
            )}
          </g>
        ))}

        {/* Draw marker label */}
        <motion.g initial={false} animate={{ x: markerX }} transition={{ type: 'spring', stiffness: 220, damping: 28 }}>
          <text
            x={0}
            y={20}
            textAnchor="middle"
            className={overflow ? 'fill-destructive' : 'fill-primary'}
            fontSize={11}
            fontWeight={700}
          >
            {unitLabel} units
          </text>
        </motion.g>
      </svg>

      <div className="text-xs text-foreground font-medium text-center" aria-live="polite">
        {activeDose} mg = <span className="text-primary font-bold">{unitLabel} units</span> ({syringe}) ·{' '}
        <span className="text-muted-foreground font-normal">{mL.toFixed(2)} mL @ {(mgPerMl > 0 ? mgPerMl : 5).toFixed(2)} mg/mL</span>
      </div>

      {overflow && (
        <div className="flex items-start gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            This result exceeds the {capacity}-unit scale. Do not estimate or split it in-app; stop and verify the dose, concentration, and syringe with a qualified professional.
          </span>
        </div>
      )}

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Preset doses">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDose(p)}
              aria-pressed={Math.abs(p - activeDose) < 0.0001}
              aria-label={`Set dose to ${p} mg`}
              className={cn(
                'min-h-11 min-w-11 px-4 rounded-lg border text-sm font-medium touch-manipulation',
                'transition-[transform,background-color,border-color,color] active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                Math.abs(p - activeDose) < 0.0001
                  ? 'border-primary bg-primary/15 text-primary ring-1 ring-primary/40'
                  : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted',
              )}
            >
              {p} mg
            </button>
          ))}
          {internalDose !== null && (
            <button
              type="button"
              onClick={() => setInternalDose(null)}
              aria-label="Reset to recommended dose"
              className={cn(
                'min-h-11 min-w-11 px-4 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground touch-manipulation',
                'transition-[transform,background-color,color] active:scale-[0.97] hover:text-foreground active:bg-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              Reset
            </button>
          )}
        </div>
      )}


      {concentrationNote && (
        <p className="text-[10px] text-muted-foreground text-center">{concentrationNote}</p>
      )}
    </div>
  );
}
