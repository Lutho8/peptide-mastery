import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Calculator, Eraser, Info, Ruler, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MeasurementSyringeDiagram } from '@/components/dosage/MeasurementSyringeDiagram';
import { cn } from '@/lib/utils';
import { calculateMeasurement, type MeasurementAmountUnit, type MeasurementSyringeType } from '@/lib/measurementMath';
import { getActiveStack, getCalculatorSettings, saveCalculatorSettings, type ActiveStackItem } from '@/services/storage';
import { track } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { findPeptideOrBlend } from '@/data/blendAdapters';

function parsePositive(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatNumber(value: number, decimals = 3): string {
  return Number(value.toFixed(decimals)).toString();
}

function parseRecordedAmount(value: string): { value: string; unit: MeasurementAmountUnit } | null {
  const match = value.trim().match(/^([0-9]*\.?[0-9]+)\s*(mg|mcg)$/i);
  if (!match || Number(match[1]) <= 0) return null;
  return { value: match[1], unit: match[2].toLowerCase() as MeasurementAmountUnit };
}

export function MeasurementToolScreen() {
  const { user } = useAuth();
  const saved = useMemo(() => getCalculatorSettings(), []);
  const hasSavedValues = Boolean(saved.savedAt);
  const [vialAmount, setVialAmount] = useState(hasSavedValues ? saved.lastVialSize : '');
  const [diluentVolume, setDiluentVolume] = useState(hasSavedValues ? saved.lastBacWater : '');
  const [enteredAmount, setEnteredAmount] = useState(hasSavedValues ? saved.lastTargetDose : '');
  const [enteredUnit, setEnteredUnit] = useState<MeasurementAmountUnit>('mg');
  const [syringeType, setSyringeType] = useState<MeasurementSyringeType>(saved.syringeType === 'u100' ? 'U-100' : 'U-40');
  const [barrelCapacityMl, setBarrelCapacityMl] = useState('1');
  const [recordedItems, setRecordedItems] = useState<ActiveStackItem[]>(() => getActiveStack());
  const trackedForUser = useRef<string | null>(null);

  const result = useMemo(() => calculateMeasurement({
    vialAmountMg: parsePositive(vialAmount),
    diluentMl: parsePositive(diluentVolume),
    enteredAmount: parsePositive(enteredAmount),
    enteredUnit,
    syringeType,
    barrelCapacityMl: parsePositive(barrelCapacityMl),
  }), [barrelCapacityMl, diluentVolume, enteredAmount, enteredUnit, syringeType, vialAmount]);

  useEffect(() => {
    if (!user || trackedForUser.current === user.id) return;
    trackedForUser.current = user.id;
    track('measurement_tool_opened', { source: 'dashboard_tab' });
    void supabase.from('journey_events').insert({
      user_id: user.id,
      event_name: 'measurement_tool_opened',
      source: 'dashboard',
      context: { syringe_type: syringeType },
    }).then(({ error }) => {
      if (error) console.warn('[Journey] Measurement event was not recorded:', error.message);
    });
  }, [syringeType, user]);

  useEffect(() => {
    const refresh = () => setRecordedItems(getActiveStack());
    refresh();
    window.addEventListener('rtd:cloud-hydrated', refresh);
    window.addEventListener('rtd:stack-changed', refresh);
    return () => {
      window.removeEventListener('rtd:cloud-hydrated', refresh);
      window.removeEventListener('rtd:stack-changed', refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!result) return;
    saveCalculatorSettings({
      syringeType: syringeType === 'U-100' ? 'u100' : 'u40',
      lastVialSize: vialAmount,
      lastBacWater: diluentVolume,
      lastTargetDose: enteredAmount,
    });
  }, [diluentVolume, enteredAmount, result, syringeType, vialAmount]);

  const clear = () => {
    setVialAmount('');
    setDiluentVolume('');
    setEnteredAmount('');
  };

  const recordedAmountOptions = recordedItems.flatMap((item) => {
    const parsed = parseRecordedAmount(item.dose);
    if (!parsed) return [];
    const peptide = findPeptideOrBlend(item.peptideId);
    return [{ ...item, ...parsed, name: peptide?.name || item.peptideId }];
  });

  const loadRecordedAmount = (peptideId: string) => {
    const option = recordedAmountOptions.find((item) => item.peptideId === peptideId);
    if (!option) return;
    setEnteredAmount(option.value);
    setEnteredUnit(option.unit);
  };

  return (
    <div className="space-y-4 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Measurement Tool</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Convert the vial, diluent, amount and syringe scale you enter into mL and barrel units.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clear}><Eraser className="mr-2 h-4 w-4" />Clear</Button>
      </header>

      <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p><strong>You choose every input.</strong> This tool performs arithmetic only. It does not select a compound, amount, schedule, syringe or treatment. Confirm uncertain inputs with a qualified professional.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5 p-4 sm:p-5">
          {recordedAmountOptions.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <Label>Use an amount already recorded in your workspace (optional)</Label>
              <Select onValueChange={loadRecordedAmount}>
                <SelectTrigger aria-label="Recorded workspace amount"><SelectValue placeholder="Choose a saved record" /></SelectTrigger>
                <SelectContent>
                  {recordedAmountOptions.map((item) => (
                    <SelectItem key={item.peptideId} value={item.peptideId}>{item.name} — {item.dose}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This copies only the amount you previously entered. Vial, diluent and syringe values must still be confirmed separately.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vial-amount">Amount shown on vial or COA</Label>
              <div className="relative"><Input id="vial-amount" type="number" inputMode="decimal" min="0" step="any" placeholder="Enter value" value={vialAmount} onChange={(event) => setVialAmount(event.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mg</span></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diluent-volume">Diluent volume entered</Label>
              <div className="relative"><Input id="diluent-volume" type="number" inputMode="decimal" min="0" step="any" placeholder="Enter value" value={diluentVolume} onChange={(event) => setDiluentVolume(event.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mL</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount to convert</Label>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Input type="number" inputMode="decimal" min="0" step="any" placeholder="Enter your recorded amount" value={enteredAmount} onChange={(event) => setEnteredAmount(event.target.value)} aria-label="Amount to convert" />
              <Select value={enteredUnit} onValueChange={(value) => setEnteredUnit(value as MeasurementAmountUnit)}><SelectTrigger aria-label="Amount unit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mg">mg</SelectItem><SelectItem value="mcg">mcg</SelectItem></SelectContent></Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Syringe scale printed on the barrel</Label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Syringe scale">
              {(['U-40', 'U-100'] as const).map((type) => <button key={type} type="button" aria-pressed={syringeType === type} onClick={() => setSyringeType(type)} className={cn('min-h-12 rounded-xl border px-4 font-semibold transition', syringeType === type ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/40')}>{type}<span className="mt-0.5 block text-[10px] font-normal opacity-80">{type === 'U-40' ? '40 units = 1 mL' : '100 units = 1 mL'}</span></button>)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Barrel capacity</Label>
            <Select value={barrelCapacityMl} onValueChange={setBarrelCapacityMl}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0.3">0.3 mL</SelectItem><SelectItem value="0.5">0.5 mL</SelectItem><SelectItem value="1">1 mL</SelectItem></SelectContent></Select>
          </div>
        </Card>

        <Card className="p-4 sm:p-5" aria-live="polite">
          {!result ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <Ruler className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h2 className="font-semibold text-foreground">Enter all four values</h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">A result appears only after valid positive values are supplied. The entered amount cannot exceed the vial amount.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calculated from your inputs</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Volume to measure</p><p className="mt-1 text-2xl font-bold text-primary">{formatNumber(result.volumeMl)} mL</p></div>
                  <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">{syringeType} barrel marking</p><p className="mt-1 text-2xl font-bold text-primary">{formatNumber(result.syringeUnits, 2)} units</p></div>
                  <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Entered concentration</p><p className="mt-1 font-semibold">{formatNumber(result.concentrationMgPerMl)} mg/mL</p></div>
                  <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Converted amount</p><p className="mt-1 font-semibold">{formatNumber(result.targetAmountMg)} mg</p></div>
                </div>
              </div>

              <div className="space-y-2">
                <MeasurementSyringeDiagram
                  syringeType={syringeType}
                  barrelCapacityMl={parsePositive(barrelCapacityMl)}
                  units={result.syringeUnits}
                  volumeMl={result.volumeMl}
                  amountLabel={`${enteredAmount} ${enteredUnit}`}
                  fitsSelectedBarrel={result.fitsSelectedBarrel}
                />
                <div className="flex items-center gap-2 text-sm"><Syringe className="h-4 w-4 text-primary" />Selected: {syringeType}, {barrelCapacityMl} mL barrel</div>
              </div>

              {!result.fitsSelectedBarrel && (
                <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><p>The calculated volume is larger than the selected barrel. Re-check every entered value and the printed syringe scale; this tool will not choose a replacement.</p></div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
