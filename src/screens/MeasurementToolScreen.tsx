import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  Eraser,
  Info,
  Ruler,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MeasurementSyringeDiagram } from '@/components/dosage/MeasurementSyringeDiagram';
import { CompanionNav, type CompanionSection } from '@/components/companion/CompanionNav';
import { cn } from '@/lib/utils';
import {
  calculateMeasurement,
  type MeasurementAmountUnit,
  type MeasurementSyringeType,
} from '@/lib/measurementMath';
import {
  formatMeasurementSchedule,
  inferMeasurementSchedule,
  MEASUREMENT_GUIDANCE,
  MEASUREMENT_SCHEDULES,
  parseRecordedMeasurementAmount,
  type MeasurementGuidanceMode,
  type MeasurementScheduleMode,
} from '@/lib/measurementPlan';
import {
  deleteDosagePreset,
  getActiveStack,
  getCalculatorSettings,
  getDosagePresets,
  saveCalculatorSettings,
  saveDosagePreset,
  type ActiveStackItem,
  type DosagePreset,
} from '@/services/storage';
import { track } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { findPeptideOrBlend, getAllSelectablePeptides } from '@/data/blendAdapters';
import { createJournalEntry, recordCompanionEvent } from '@/services/researchCompanion';

const EvidenceAskPanel = lazy(() => import('@/components/companion/EvidenceAskPanel').then((module) => ({ default: module.EvidenceAskPanel })));
const ResearchJournalPanel = lazy(() => import('@/components/companion/ResearchJournalPanel').then((module) => ({ default: module.ResearchJournalPanel })));
const ConfessionsPanel = lazy(() => import('@/components/companion/ConfessionsPanel').then((module) => ({ default: module.ConfessionsPanel })));

function initialCompanionSection(): CompanionSection {
  if (typeof window === 'undefined') return 'measure';
  const section = new URLSearchParams(window.location.search).get('tool');
  return section === 'ask' || section === 'journal' || section === 'confessions' ? section : 'measure';
}

function parsePositive(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatNumber(value: number, decimals = 3): string {
  return Number(value.toFixed(decimals)).toString();
}

function createPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `measure-${crypto.randomUUID()}`;
  }
  return `measure-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function savedGuidanceMode(experienceLevel: string): MeasurementGuidanceMode {
  if (experienceLevel === 'athlete') return 'athlete';
  if (experienceLevel === 'beginner') return 'beginner';
  return 'intermediate';
}

function modeIcon(mode: MeasurementGuidanceMode) {
  if (mode === 'beginner') return ClipboardCheck;
  if (mode === 'athlete') return Dumbbell;
  return ShieldCheck;
}

export function MeasurementToolScreen() {
  const { user } = useAuth();
  const saved = useMemo(() => getCalculatorSettings(), []);
  const selectableCompounds = useMemo(() => getAllSelectablePeptides(), []);
  const [selectedCompoundId, setSelectedCompoundId] = useState(saved.lastSelectedPeptide || '');
  const [guidanceMode, setGuidanceMode] = useState<MeasurementGuidanceMode>(savedGuidanceMode(saved.experienceLevel));
  const [vialAmount, setVialAmount] = useState(saved.savedAt ? saved.lastVialSize : '');
  const [diluentVolume, setDiluentVolume] = useState(saved.savedAt ? saved.lastBacWater : '');
  const [enteredAmount, setEnteredAmount] = useState(saved.savedAt ? saved.lastTargetDose : '');
  const [enteredUnit, setEnteredUnit] = useState<MeasurementAmountUnit>('mg');
  const [syringeType, setSyringeType] = useState<MeasurementSyringeType | ''>(() => {
    if (!saved.savedAt || saved.syringeType === 'u50') return '';
    return saved.syringeType === 'u100' ? 'U-100' : 'U-40';
  });
  const [barrelCapacityMl, setBarrelCapacityMl] = useState('');
  const [scheduleMode, setScheduleMode] = useState<MeasurementScheduleMode>('not-recorded');
  const [scheduleDetails, setScheduleDetails] = useState('');
  const [recordedItems, setRecordedItems] = useState<ActiveStackItem[]>(() => getActiveStack());
  const [presets, setPresets] = useState<DosagePreset[]>(() => getDosagePresets());
  const [presetName, setPresetName] = useState('');
  const [companionSection, setCompanionSection] = useState<CompanionSection>(initialCompanionSection);
  const trackedForUser = useRef<string | null>(null);

  const recordedPlans = useMemo(() => recordedItems.flatMap((item, index) => {
    const parsed = parseRecordedMeasurementAmount(item.dose);
    if (!parsed) return [];
    const peptide = findPeptideOrBlend(item.peptideId);
    return [{
      item,
      index,
      name: peptide?.name || item.peptideId,
      amount: parsed,
      schedule: inferMeasurementSchedule(item.frequency),
    }];
  }), [recordedItems]);

  const selectedCompound = useMemo(
    () => selectableCompounds.find((compound) => compound.id === selectedCompoundId),
    [selectableCompounds, selectedCompoundId],
  );

  const relevantPresets = useMemo(
    () => presets.filter((preset) => {
      const presetCompoundId = preset.peptideId || preset.blendId || '';
      return selectedCompoundId ? presetCompoundId === selectedCompoundId : !presetCompoundId;
    }),
    [presets, selectedCompoundId],
  );

  const result = useMemo(() => {
    if (!syringeType) return null;
    return calculateMeasurement({
      vialAmountMg: parsePositive(vialAmount),
      diluentMl: parsePositive(diluentVolume),
      enteredAmount: parsePositive(enteredAmount),
      enteredUnit,
      syringeType,
      barrelCapacityMl: parsePositive(barrelCapacityMl),
    });
  }, [barrelCapacityMl, diluentVolume, enteredAmount, enteredUnit, syringeType, vialAmount]);

  useEffect(() => {
    if (!user || trackedForUser.current === user.id) return;
    trackedForUser.current = user.id;
    track('measurement_tool_opened', { source: 'dashboard_tab' });
    void supabase.from('journey_events').insert({
      user_id: user.id,
      event_name: 'measurement_tool_opened',
      source: 'dashboard',
      context: { guidance_mode: guidanceMode },
    }).then(({ error }) => {
      if (error) console.warn('[Journey] Measurement event was not recorded:', error.message);
    });
  }, [guidanceMode, user]);

  useEffect(() => {
    const refresh = () => {
      setRecordedItems(getActiveStack());
      setPresets(getDosagePresets());
    };
    refresh();
    window.addEventListener('rtd:cloud-hydrated', refresh);
    window.addEventListener('rtd:stack-changed', refresh);
    return () => {
      window.removeEventListener('rtd:cloud-hydrated', refresh);
      window.removeEventListener('rtd:stack-changed', refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!result || !syringeType) return;
    saveCalculatorSettings({
      syringeType: syringeType === 'U-100' ? 'u100' : 'u40',
      experienceLevel: guidanceMode === 'athlete' ? 'athlete' : guidanceMode,
      lastVialSize: vialAmount,
      lastBacWater: diluentVolume,
      lastTargetDose: enteredAmount,
      lastSelectedPeptide: selectedCompoundId,
    });
  }, [diluentVolume, enteredAmount, guidanceMode, result, selectedCompoundId, syringeType, vialAmount]);

  const clearMeasurement = () => {
    setVialAmount('');
    setDiluentVolume('');
    setEnteredAmount('');
    setEnteredUnit('mg');
    setSyringeType('');
    setBarrelCapacityMl('');
    setScheduleMode('not-recorded');
    setScheduleDetails('');
    setPresetName('');
  };

  const selectSetupSource = (value: string) => {
    if (value === 'custom') {
      setSelectedCompoundId('');
      clearMeasurement();
      return;
    }
    if (value.startsWith('plan:')) {
      const plan = recordedPlans.find((candidate) => candidate.index === Number(value.slice(5)));
      if (!plan) return;
      setSelectedCompoundId(plan.item.peptideId);
      setEnteredAmount(plan.amount.value);
      setEnteredUnit(plan.amount.unit);
      setScheduleMode(plan.schedule.mode);
      setScheduleDetails(plan.schedule.details);
      setVialAmount('');
      setDiluentVolume('');
      setSyringeType('');
      setBarrelCapacityMl('');
      toast.info('Recorded amount and schedule loaded. Confirm the vial and physical syringe separately.');
      return;
    }
    setSelectedCompoundId(value.replace(/^compound:/, ''));
    clearMeasurement();
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    setSelectedCompoundId(preset.peptideId || preset.blendId || '');
    setVialAmount(preset.vialSize);
    setDiluentVolume(preset.bacWater);
    setEnteredAmount(preset.targetDose);
    setEnteredUnit(preset.targetUnit || 'mg');
    setScheduleMode(preset.scheduleMode || 'not-recorded');
    setScheduleDetails(preset.scheduleDetails || '');
    setBarrelCapacityMl(preset.barrelCapacityMl || '');
    setGuidanceMode(preset.guidanceMode || 'intermediate');
    setSyringeType(preset.syringeType === 'u100' ? 'U-100' : preset.syringeType === 'u40' ? 'U-40' : '');
    toast.success(`Loaded ${preset.name}`);
  };

  const savePreset = () => {
    if (!result || !syringeType) {
      toast.error('Complete and verify the measurement before saving it.');
      return;
    }
    const name = presetName.trim() || `${selectedCompound?.shortName || 'Custom'} setup`;
    saveDosagePreset({
      id: createPresetId(),
      name,
      peptideId: selectedCompoundId || undefined,
      vialSize: vialAmount,
      bacWater: diluentVolume,
      targetDose: enteredAmount,
      targetUnit: enteredUnit,
      syringeType: syringeType === 'U-100' ? 'u100' : 'u40',
      vialUnitType: 'mg',
      scheduleMode,
      scheduleDetails,
      barrelCapacityMl,
      guidanceMode,
      createdAt: new Date().toISOString(),
    });
    setPresets(getDosagePresets());
    setPresetName('');
    toast.success(`Saved ${name}`);
  };

  const removePreset = (preset: DosagePreset) => {
    deleteDosagePreset(preset.id);
    setPresets(getDosagePresets());
    toast.info(`Removed ${preset.name}`);
  };

  const saveMeasurementToJournal = async () => {
    if (!user || !result || !syringeType) return;
    const compoundName = selectedCompound?.name || 'Custom measurement';
    const equation = `${formatNumber(result.targetAmountMg)} mg ÷ ${formatNumber(result.concentrationMgPerMl)} mg/mL = ${formatNumber(result.volumeMl)} mL × ${result.syringeUnitsPerMl} units/mL = ${formatNumber(result.syringeUnits, 2)} units`;
    try {
      await createJournalEntry({
        user_id: user.id,
        entry_type: 'measurement',
        peptide_id: selectedCompoundId || null,
        title: `${compoundName} measurement`,
        body: `${equation}\n\nRecorded schedule: ${scheduleLabel}\nPhysical syringe: ${syringeType} · ${barrelCapacityMl} mL\n\nSaved from deterministic calculator values; this is not a dosing recommendation.`,
      });
      void recordCompanionEvent(user.id, 'journal_entry_created', { entry_type: 'measurement' });
      toast.success('Measurement saved to your private journal.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Measurement could not be saved.');
    }
  };

  const guidance = MEASUREMENT_GUIDANCE.find((option) => option.id === guidanceMode)!;
  const usesPerVial = result ? Math.floor(parsePositive(vialAmount) / result.targetAmountMg) : 0;
  const scheduleLabel = formatMeasurementSchedule(scheduleMode, scheduleDetails);
  const measurementAskContext = useMemo(() => ({
    vialAmountMg: parsePositive(vialAmount) || undefined,
    diluentMl: parsePositive(diluentVolume) || undefined,
    recordedAmount: enteredAmount ? `${enteredAmount} ${enteredUnit}` : undefined,
    schedule: scheduleLabel === 'Schedule not recorded' ? undefined : scheduleLabel,
    syringe: syringeType && barrelCapacityMl ? `${syringeType} · ${barrelCapacityMl} mL` : syringeType || undefined,
    calculatedUnits: result?.syringeUnits,
    calculatedVolumeMl: result?.volumeMl,
  }), [barrelCapacityMl, diluentVolume, enteredAmount, enteredUnit, result, scheduleLabel, syringeType, vialAmount]);

  const changeCompanionSection = (section: CompanionSection) => {
    setCompanionSection(section);
    try {
      const url = new URL(window.location.href);
      if (section === 'measure') url.searchParams.delete('tool');
      else url.searchParams.set('tool', section);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* Deep-link persistence is optional. */ }
  };

  return (
    <div className="space-y-5 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Measurement & Evidence</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Measure a recorded plan, ask the evidence, keep a private journal and learn from moderated community experiences.</p>
        </div>
        {companionSection === 'measure' && <Button type="button" variant="outline" size="sm" onClick={clearMeasurement}><Eraser className="mr-2 h-4 w-4" />Clear measurement</Button>}
      </header>

      <CompanionNav active={companionSection} onChange={changeCompanionSection} />

      {companionSection === 'measure' ? <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Choose how much explanation you want</p>
            <p className="mt-1 text-sm text-muted-foreground">These modes change the checklist and coaching language only. They never choose a compound, treatment, amount, schedule or syringe.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Measurement guidance level">
          {MEASUREMENT_GUIDANCE.map((option) => {
            const Icon = modeIcon(option.id);
            const active = guidanceMode === option.id;
            return (
              <button key={option.id} type="button" aria-pressed={active} onClick={() => setGuidanceMode(option.id)} className={cn('rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background hover:border-primary/50')}>
                <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{option.shortLabel}</span>
                <span className={cn('mt-1 block text-xs leading-relaxed', active ? 'text-primary-foreground/85' : 'text-muted-foreground')}>{option.description}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-4">
          <Card className="space-y-5 p-4 sm:p-5">
            <SectionHeading number="1" title="Select a compound or recorded plan" subtitle="Selection adds context; it does not prefill a dose." />
            <Select value={selectedCompoundId ? `compound:${selectedCompoundId}` : 'custom'} onValueChange={selectSetupSource}>
              <SelectTrigger aria-label="Compound or recorded plan"><SelectValue placeholder="Choose a source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom / label-only setup</SelectItem>
                {recordedPlans.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>My recorded plans</SelectLabel>
                    {recordedPlans.map((plan) => <SelectItem key={`plan-${plan.index}`} value={`plan:${plan.index}`}>{plan.name} — {plan.item.dose} · {plan.item.frequency || 'schedule not recorded'}</SelectItem>)}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>Compounds, blends & stacks</SelectLabel>
                  {selectableCompounds.map((compound) => <SelectItem key={compound.id} value={`compound:${compound.id}`}>{compound.name}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{selectedCompound ? `${selectedCompound.name} selected. Enter the exact values from its vial/COA and your established plan.` : 'Use custom when the item is not in the library.'}</p>

            {relevantPresets.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <Label>Saved verified setups</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relevantPresets.map((preset) => (
                    <div key={preset.id} className="inline-flex overflow-hidden rounded-lg border border-border bg-background">
                      <button type="button" className="px-3 py-2 text-xs font-medium hover:bg-muted" onClick={() => loadPreset(preset.id)}>{preset.name}</button>
                      <button type="button" aria-label={`Delete ${preset.name}`} className="border-l border-border px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removePreset(preset)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-5 p-4 sm:p-5">
            <SectionHeading number="2" title="Enter the recorded measurement" subtitle="Use the vial label or COA and the amount already established for you." />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWithSuffix id="vial-amount" label="Amount shown on vial or COA" suffix="mg" value={vialAmount} onChange={setVialAmount} />
              <FieldWithSuffix id="diluent-volume" label="Diluent volume actually added" suffix="mL" value={diluentVolume} onChange={setDiluentVolume} />
            </div>
            <div className="space-y-2">
              <Label>Amount from your recorded plan</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                <Input type="number" inputMode="decimal" min="0" step="any" placeholder="Enter amount" value={enteredAmount} onChange={(event) => setEnteredAmount(event.target.value)} aria-label="Amount from recorded plan" />
                <Select value={enteredUnit} onValueChange={(value) => setEnteredUnit(value as MeasurementAmountUnit)}><SelectTrigger aria-label="Amount unit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mg">mg</SelectItem><SelectItem value="mcg">mcg</SelectItem></SelectContent></Select>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-4 sm:p-5">
            <SectionHeading number="3" title="Record the schedule" subtitle="Keep measurement and timing context together; schedule does not change the calculation." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={scheduleMode} onValueChange={(value) => setScheduleMode(value as MeasurementScheduleMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MEASUREMENT_SCHEDULES.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label htmlFor="schedule-details">Timing / plan note (optional)</Label><Input id="schedule-details" placeholder="e.g. Mon & Thu, as recorded" value={scheduleDetails} onChange={(event) => setScheduleDetails(event.target.value)} /></div>
            </div>
          </Card>

          <Card className="space-y-5 p-4 sm:p-5">
            <SectionHeading number="4" title="Match the physical syringe" subtitle="Read the scale printed on the barrel. Capacity and calibration are separate choices." />
            <div className="space-y-2">
              <Label>Syringe scale</Label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Syringe scale">
                {(['U-40', 'U-100'] as const).map((type) => <button key={type} type="button" aria-pressed={syringeType === type} onClick={() => setSyringeType(type)} className={cn('min-h-14 rounded-xl border px-4 font-semibold transition', syringeType === type ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/50')}>{type}<span className="mt-0.5 block text-[10px] font-normal opacity-80">{type === 'U-40' ? '40 units = 1 mL' : '100 units = 1 mL'}</span></button>)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Barrel capacity</Label>
              <Select value={barrelCapacityMl} onValueChange={setBarrelCapacityMl}><SelectTrigger><SelectValue placeholder="Select printed capacity" /></SelectTrigger><SelectContent><SelectItem value="0.3">0.3 mL</SelectItem><SelectItem value="0.5">0.5 mL</SelectItem><SelectItem value="1">1 mL</SelectItem></SelectContent></Select>
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="overflow-hidden" aria-live="polite">
            <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verified measurement</p><p className="mt-1 text-sm font-medium text-foreground">{selectedCompound?.name || 'Custom setup'} · {scheduleLabel}</p></div>
            <div className="p-4 sm:p-5">
              {!result || !syringeType ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center"><Ruler className="mb-3 h-10 w-10 text-muted-foreground/40" /><h2 className="font-semibold text-foreground">Complete the measurement</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Enter positive vial, diluent and amount values, then select the exact syringe scale and barrel capacity in your hand.</p></div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <ResultTile label={`${syringeType} barrel marking`} value={`${formatNumber(result.syringeUnits, 2)} units`} primary />
                    <ResultTile label="Volume to measure" value={`${formatNumber(result.volumeMl)} mL`} primary />
                    <ResultTile label="Entered concentration" value={`${formatNumber(result.concentrationMgPerMl)} mg/mL`} />
                    <ResultTile label="Approx. measures per vial" value={String(usesPerVial)} />
                  </div>
                  <MeasurementSyringeDiagram syringeType={syringeType} barrelCapacityMl={parsePositive(barrelCapacityMl)} units={result.syringeUnits} volumeMl={result.volumeMl} amountLabel={`${enteredAmount} ${enteredUnit}`} fitsSelectedBarrel={result.fitsSelectedBarrel} />
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm"><p className="font-semibold text-foreground">Check the arithmetic</p><p className="mt-1 leading-relaxed text-muted-foreground">{formatNumber(result.targetAmountMg)} mg ÷ {formatNumber(result.concentrationMgPerMl)} mg/mL = {formatNumber(result.volumeMl)} mL × {result.syringeUnitsPerMl} units/mL = <strong className="text-foreground">{formatNumber(result.syringeUnits, 2)} units</strong>.</p></div>
                  {!result.fitsSelectedBarrel && <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><p>The result exceeds the selected barrel. Re-check the label, diluent, recorded amount, printed scale and capacity. The app will not choose a replacement.</p></div>}
                  <div className="space-y-3 border-t border-border pt-4"><Label htmlFor="preset-name">Save this verified setup</Label><div className="flex gap-2"><Input id="preset-name" placeholder={`${selectedCompound?.shortName || 'Custom'} setup`} value={presetName} onChange={(event) => setPresetName(event.target.value)} /><Button type="button" onClick={savePreset}><Save className="mr-2 h-4 w-4" />Save</Button></div><Button type="button" variant="outline" className="w-full" onClick={() => void saveMeasurementToJournal()}><Save className="mr-2 h-4 w-4" />Save measurement to private journal</Button></div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-3"><ModeIcon mode={guidanceMode} /><div><p className="font-semibold text-foreground">{guidance.label}</p><p className="mt-1 text-sm text-muted-foreground">{guidance.description}</p></div></div>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              {guidanceMode === 'beginner' && <><ChecklistItem>Match the compound and vial amount to the label or COA.</ChecklistItem><ChecklistItem>Confirm how much diluent was actually added—not a remembered default.</ChecklistItem><ChecklistItem>Match both U-scale and barrel capacity to the syringe in your hand.</ChecklistItem></>}
              {guidanceMode === 'intermediate' && <><ChecklistItem>Review the concentration, mL and units equation before measuring.</ChecklistItem><ChecklistItem>Save one verified setup per vial preparation to prevent stale assumptions.</ChecklistItem><ChecklistItem>Keep timing context with the setup for consistent logging.</ChecklistItem></>}
              {guidanceMode === 'athlete' && <><ChecklistItem>Use repeatable naming for each compound, preparation and schedule.</ChecklistItem><ChecklistItem>Log timing, administration details and responses consistently in Daily Log.</ChecklistItem><ChecklistItem>Performance goals never alter the amount or syringe position.</ChecklistItem></>}
            </ul>
          </Card>

          <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p><strong>Measurement boundary:</strong> this app does not diagnose, prescribe, choose a treatment, or recommend amounts for entry-level, intermediate or athlete users. It explains and checks values supplied by the user or an established professional plan.</p></div>
        </div>
      </div>
      </> : companionSection === 'ask' ? (
        <Suspense fallback={<CompanionLoading />}>
          <EvidenceAskPanel
            compounds={selectableCompounds}
            selectedCompoundId={selectedCompoundId}
            onSelectCompound={setSelectedCompoundId}
            measurementContext={measurementAskContext}
            onOpenMeasure={() => changeCompanionSection('measure')}
          />
        </Suspense>
      ) : companionSection === 'journal' ? (
        <Suspense fallback={<CompanionLoading />}>
          <ResearchJournalPanel compounds={selectableCompounds} selectedCompoundId={selectedCompoundId} />
        </Suspense>
      ) : (
        <Suspense fallback={<CompanionLoading />}>
          <ConfessionsPanel compounds={selectableCompounds} selectedCompoundId={selectedCompoundId} />
        </Suspense>
      )}
    </div>
  );
}

function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</span><div><h2 className="font-semibold text-foreground">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p></div></div>;
}

function FieldWithSuffix({ id, label, suffix, value, onChange }: { id: string; label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative"><Input id={id} type="number" inputMode="decimal" min="0" step="any" placeholder="Enter value" value={value} onChange={(event) => onChange(event.target.value)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span></div></div>;
}

function ResultTile({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return <div className={cn('rounded-xl p-3', primary ? 'bg-primary/10' : 'bg-muted/60')}><p className="text-xs text-muted-foreground">{label}</p><p className={cn('mt-1 font-bold', primary ? 'text-xl text-primary' : 'text-base text-foreground')}>{value}</p></div>;
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{children}</span></li>;
}

function ModeIcon({ mode }: { mode: MeasurementGuidanceMode }) {
  const Icon = modeIcon(mode);
  return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />;
}

function CompanionLoading() {
  return <Card className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Loading companion…</Card>;
}
