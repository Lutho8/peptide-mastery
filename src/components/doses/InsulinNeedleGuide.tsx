import { useState, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Syringe, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { findBlendData } from '@/data/blendAdapters';
import { RecommendedDoseDisplay } from '@/components/dosage/RecommendedDoseDisplay';
import { SyringeVisual } from '@/components/dosage/SyringeVisual';

interface InsulinNeedleGuideProps {
  dose: number;
  unit: 'mg' | 'IU' | 'units';
  concentration?: number;
  peptideId?: string;
}

interface BlendConcentration {
  totalMg: number;
  waterMl: number;
  concentrationMgPerMl: number;
}

type SyringeType = 'U-40' | 'U-100';

function getBlendConcentration(peptideId?: string): BlendConcentration | null {
  if (!peptideId) return null;
  const blend = findBlendData(peptideId);
  if (!blend) return null;

  const mgMatch = blend.vialSize.match(/([\d.]+)\s*mg/i);
  const totalMg = mgMatch ? parseFloat(mgMatch[1]) : null;
  if (!totalMg) return null;

  const waterMatch = blend.quickstart.reconstitute.match(/([\d.]+)\s*mL/i);
  const waterMl = waterMatch ? parseFloat(waterMatch[1]) : 2.0;

  return {
    totalMg,
    waterMl,
    concentrationMgPerMl: totalMg / waterMl,
  };
}

const QUICK_REF_DOSES = [0.25, 0.5, 1, 2];

// Syringe type segmented toggle
function SyringeTypeToggle({ value, onChange }: { value: SyringeType; onChange: (v: SyringeType) => void }) {
  const options: SyringeType[] = ['U-40', 'U-100'];
  return (
    <div className="space-y-1.5">
      <div
        className="relative flex gap-1 rounded-lg border border-border bg-muted/50 p-1"
        role="group"
        aria-label="Syringe scale"
      >
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={isActive}
              aria-label={`Use ${opt} syringe scale`}
              className={cn(
                "relative z-10 flex-1 min-h-11 px-4 text-sm font-medium rounded-md touch-manipulation",
                "transition-[transform,color] active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground active:bg-muted"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="syringe-type-bg"
                  className="absolute inset-0 bg-primary rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{opt}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Pick the syringe type printed on your barrel.
      </p>
    </div>
  );
}


// Dynamic calculator section — uses active syringe type
function ReconstitutionCalculator({
  defaultTotalMg,
  defaultWaterMl,
  syringeType,
  unitsPerMl,
}: {
  defaultTotalMg: number;
  defaultWaterMl: number;
  syringeType: SyringeType;
  unitsPerMl: number;
}) {
  const [totalMg, setTotalMg] = useState(defaultTotalMg);
  const [waterMl, setWaterMl] = useState(defaultWaterMl);
  const fieldId = useId();


  const concentrationMgPerMl = waterMl > 0 ? totalMg / waterMl : 0;
  const mgPerUnit = concentrationMgPerMl > 0 ? concentrationMgPerMl / unitsPerMl : 0;

  const dosePresets = [0.25, 0.5, 1, 2];

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Syringe size={14} className="text-primary" />
        Dynamic Calculator ({syringeType} Syringe)
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${fieldId}-mg`} className="text-xs text-muted-foreground">Total mg in vial</Label>
          <Input
            id={`${fieldId}-mg`}
            type="number"
            inputMode="decimal"
            value={totalMg}
            onChange={(e) => setTotalMg(parseFloat(e.target.value) || 0)}
            className="h-11 text-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            min={0}
            step={1}
          />
        </div>
        <div>
          <Label htmlFor={`${fieldId}-ml`} className="text-xs text-muted-foreground">mL BAC water</Label>
          <Input
            id={`${fieldId}-ml`}
            type="number"
            inputMode="decimal"
            value={waterMl}
            onChange={(e) => setWaterMl(parseFloat(e.target.value) || 0)}
            className="h-11 text-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            min={0.1}
            step={0.5}
          />
        </div>
      </div>


      {concentrationMgPerMl > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-md bg-background border border-border">
              <div className="text-muted-foreground">Concentration</div>
              <div className="text-sm font-bold text-foreground">{concentrationMgPerMl.toFixed(2)} mg/mL</div>
            </div>
            <div className="p-2 rounded-md bg-background border border-border">
              <div className="text-muted-foreground">1 unit ({syringeType})</div>
              <div className="text-sm font-bold text-primary">{mgPerUnit.toFixed(3)} mg</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">Target Dose</TableHead>
                <TableHead className="h-8 text-xs">{syringeType} Units</TableHead>
                <TableHead className="h-8 text-xs">Volume (mL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dosePresets.map((doseMg) => {
                const volumeMl = concentrationMgPerMl > 0 ? doseMg / concentrationMgPerMl : 0;
                const units = volumeMl * unitsPerMl;
                return (
                  <TableRow key={doseMg}>
                    <TableCell className="py-1.5 text-sm font-medium">{doseMg} mg</TableCell>
                    <TableCell className="py-1.5 text-sm font-bold text-primary">{units.toFixed(1)} units</TableCell>
                    <TableCell className="py-1.5 text-sm text-muted-foreground">{volumeMl.toFixed(3)} mL</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function InsulinNeedleGuide({ dose, unit, concentration, peptideId }: InsulinNeedleGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [syringeType, setSyringeType] = useState<SyringeType>('U-40');
  const panelId = useId();

  const unitsPerMl = syringeType === 'U-40' ? 40 : 100;

  const blendConc = useMemo(() => getBlendConcentration(peptideId), [peptideId]);
  const isBlend = !!blendConc;
  const blendData = useMemo(() => peptideId ? findBlendData(peptideId) : null, [peptideId]);

  // Standard reconstitution: 10mg vial + 2mL BAC water = 5 mg/mL
  const activeTotalMg = blendConc?.totalMg ?? 10;
  const activeWaterMl = blendConc?.waterMl ?? 2;
  const activeConcentrationMgPerMl = blendConc?.concentrationMgPerMl ?? (concentration ? concentration / 1000 : 5);

  // Convert dose to mg
  const doseMg = unit === 'mg' ? dose : dose;
  const volumeNeededMl = activeConcentrationMgPerMl > 0 ? doseMg / activeConcentrationMgPerMl : 0;
  const drawUnits = volumeNeededMl * unitsPerMl;

  if (dose <= 0) return null;

  const title = isBlend
    ? `${blendData?.shortName || 'Blend'} ${syringeType} Dosage Guide`
    : `${syringeType} Syringe Dosage Guide`;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
        className={cn(
          'w-full min-h-12 flex items-center justify-between gap-2 px-3 py-3 text-left touch-manipulation',
          'transition-colors hover:bg-muted/50 active:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        )}
      >
        <div className="flex items-center gap-2">
          <Syringe size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {isExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >

            <div className="p-3 pt-0 space-y-3">
              {/* Syringe type selector */}
              <SyringeTypeToggle value={syringeType} onChange={setSyringeType} />

              {/* Safety Warning for blends */}
              {isBlend && (
                <Alert variant="destructive" className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-bold">⚠️ SAFETY CORRECTION</AlertTitle>
                  <AlertDescription className="text-xs">
                    Previous dosage values for this blend were <strong>incorrect and potentially dangerous</strong>.
                    The values below use the verified standard protocol ({activeTotalMg}mg vial + {activeWaterMl}mL BAC water).
                    Always verify concentration based on YOUR reconstitution.
                  </AlertDescription>
                </Alert>
              )}

              {/* Concentration info */}
              <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <span className="text-foreground font-medium">Reconstitution: </span>
                    {activeTotalMg}mg vial + {activeWaterMl}mL BAC water = {activeConcentrationMgPerMl.toFixed(2)} mg/mL
                  </div>
                  <div className="text-foreground font-medium">
                    1 mg = {activeConcentrationMgPerMl > 0 ? (unitsPerMl / activeConcentrationMgPerMl).toFixed(1) : '0'} {syringeType} units
                  </div>
                  <div>
                    <span className="text-muted-foreground">1 {syringeType} unit = {(activeConcentrationMgPerMl / unitsPerMl).toFixed(3)} mg</span>
                  </div>
                </div>
              </div>

              {/* Visual syringe draw-up guide */}
              <SyringeVisual
                doseMg={doseMg}
                mgPerMl={activeConcentrationMgPerMl}
                syringe={syringeType}
                presets={QUICK_REF_DOSES}
                concentrationNote={`${activeTotalMg} mg vial + ${activeWaterMl} mL BAC water`}
              />

              {/* Quick reference strip */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">
                  Quick reference (current vial settings)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_REF_DOSES.map((doseValue) => {
                    const volMl = activeConcentrationMgPerMl > 0 ? doseValue / activeConcentrationMgPerMl : 0;
                    const units = volMl * unitsPerMl;
                    return (
                      <div
                        key={doseValue}
                        className="p-2 rounded-lg bg-background border border-border text-center"
                      >
                        <div className="text-[11px] text-muted-foreground">{doseValue} mg</div>
                        <div className="text-base font-bold text-primary leading-tight">
                          {units.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">units · {volMl.toFixed(3)} mL</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Blend dosing table from protocol data */}
              {isBlend && blendData && blendData.dosingTable.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-foreground">
                    {blendData.shortName} Protocol Dosing Table
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 text-xs">Period</TableHead>
                        <TableHead className="h-8 text-xs">Daily Dose</TableHead>
                        <TableHead className="h-8 text-xs">{syringeType} Units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blendData.dosingTable.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="py-1.5 text-xs font-medium">{row.week}</TableCell>
                          <TableCell className="py-1.5 text-xs">{row.dailyDose}</TableCell>
                          <TableCell className="py-1.5 text-xs font-bold text-primary">{row.units}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Current dose */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Your current dose: {dose} {unit}
                </div>
                {peptideId && (
                  <RecommendedDoseDisplay
                    doseString={`${dose} ${unit}`}
                    peptideId={peptideId}
                    syringe={syringeType}
                    vialMg={activeTotalMg}
                    bacWaterMl={activeWaterMl}
                  />
                )}
                <div
                  className="p-3 rounded-md bg-background border border-border text-center"
                  aria-live="polite"
                  aria-label={`Draw ${drawUnits.toFixed(1)} units on a ${syringeType} syringe`}
                >

                  <div className="text-muted-foreground text-xs">{syringeType} Syringe</div>
                  <div className="text-2xl font-bold text-primary">{drawUnits.toFixed(1)}</div>
                  <div className="text-muted-foreground text-xs">units to draw</div>
                  <div className="text-muted-foreground text-[10px] mt-1">({volumeNeededMl.toFixed(3)} mL)</div>
                </div>
              </div>

              {/* Dynamic Calculator */}
              <ReconstitutionCalculator
                defaultTotalMg={activeTotalMg}
                defaultWaterMl={activeWaterMl}
                syringeType={syringeType}
                unitsPerMl={unitsPerMl}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
