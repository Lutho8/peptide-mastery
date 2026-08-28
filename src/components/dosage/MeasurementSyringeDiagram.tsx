import { cn } from '@/lib/utils';
import type { MeasurementSyringeType } from '@/lib/measurementMath';

interface MeasurementSyringeDiagramProps {
  syringeType: MeasurementSyringeType;
  barrelCapacityMl: number;
  units: number;
  volumeMl: number;
  amountLabel: string;
  fitsSelectedBarrel: boolean;
}

const BARREL_X = 28;
const BARREL_Y = 48;
const BARREL_WIDTH = 284;
const BARREL_HEIGHT = 44;

function formatMark(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function MeasurementSyringeDiagram({
  syringeType,
  barrelCapacityMl,
  units,
  volumeMl,
  amountLabel,
  fitsSelectedBarrel,
}: MeasurementSyringeDiagramProps) {
  const unitsPerMl = syringeType === 'U-40' ? 40 : 100;
  const maximumUnits = barrelCapacityMl * unitsPerMl;
  const fillFraction = Math.max(0, Math.min(1, units / maximumUnits));
  const markerX = BARREL_X + BARREL_WIDTH * fillFraction;
  const majorStep = maximumUnits / 5;
  const minorStep = majorStep / 5;
  const ticks = Array.from({ length: 26 }, (_, index) => {
    const value = minorStep * index;
    return {
      value,
      x: BARREL_X + (value / maximumUnits) * BARREL_WIDTH,
      major: index % 5 === 0,
    };
  });

  return (
    <figure className="space-y-3" data-testid="measurement-syringe-diagram">
      <div className="overflow-x-auto rounded-2xl border border-border bg-background p-2 sm:p-3">
        <svg
          viewBox="0 0 360 132"
          className="h-auto min-w-[300px] w-full"
          role="img"
          aria-label={`${amountLabel} corresponds to ${formatMark(units)} units, or ${formatMark(volumeMl)} millilitres, on the selected ${syringeType} ${barrelCapacityMl} millilitre syringe scale.`}
        >
          <line x1="330" y1="70" x2="356" y2="70" className="stroke-muted-foreground" strokeWidth="2" />
          <rect x="312" y="63" width="18" height="14" rx="3" className="fill-muted stroke-border" />
          <rect x="18" y="40" width="8" height="60" rx="2" className="fill-muted stroke-border" />
          <rect x={BARREL_X} y={BARREL_Y} width={BARREL_WIDTH} height={BARREL_HEIGHT} rx="7" className="fill-card stroke-border" strokeWidth="2" />
          <rect
            x={BARREL_X + 1}
            y={BARREL_Y + 1}
            width={BARREL_WIDTH * fillFraction}
            height={BARREL_HEIGHT - 2}
            rx="6"
            className={cn(fitsSelectedBarrel ? 'fill-primary/25' : 'fill-destructive/20')}
          />

          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={tick.x}
                y1={BARREL_Y}
                x2={tick.x}
                y2={BARREL_Y + (tick.major ? 15 : 8)}
                className="stroke-foreground"
                strokeWidth={tick.major ? 1.4 : 0.8}
                opacity={tick.major ? 0.75 : 0.45}
              />
              {tick.major && (
                <text x={tick.x} y={BARREL_Y + 32} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
                  {formatMark(tick.value)}
                </text>
              )}
            </g>
          ))}

          <line
            x1={markerX}
            y1="24"
            x2={markerX}
            y2={BARREL_Y + BARREL_HEIGHT + 8}
            className={fitsSelectedBarrel ? 'stroke-primary' : 'stroke-destructive'}
            strokeWidth="2.5"
          />
          <path
            d={`M ${markerX - 6} 25 L ${markerX + 6} 25 L ${markerX} 34 Z`}
            className={fitsSelectedBarrel ? 'fill-primary' : 'fill-destructive'}
          />
          <text
            x={Math.max(45, Math.min(315, markerX))}
            y="16"
            textAnchor="middle"
            className={fitsSelectedBarrel ? 'fill-primary' : 'fill-destructive'}
            fontSize="12"
            fontWeight="700"
          >
            {formatMark(units)} units
          </text>
          <text x="170" y="122" textAnchor="middle" className="fill-muted-foreground" fontSize="10">
            {syringeType} scale · {formatMark(maximumUnits)} units maximum · {barrelCapacityMl} mL barrel
          </text>
        </svg>
      </div>
      <figcaption className="text-center text-sm text-foreground">
        {fitsSelectedBarrel ? (
          <>The highlighted marker is <strong className="text-primary">{formatMark(units)} units</strong> on the selected barrel scale, calculated from your entered concentration.</>
        ) : (
          <>The calculated <strong className="text-destructive">{formatMark(units)} units</strong> is outside this barrel’s printed scale. No draw-up marker is implied; re-check the inputs with a qualified professional.</>
        )}
      </figcaption>
    </figure>
  );
}
