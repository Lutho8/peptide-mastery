import { useRef, useState, useCallback } from 'react';
import { Upload, FileCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const GOALS = [
  'Longevity',
  'Performance',
  'Cardiovascular Health',
  'Hormone Optimization',
  'Weight Loss',
  'Cognitive Enhancement',
  'Muscle Building',
  'Recovery',
] as const;

export type Goal = typeof GOALS[number];
export type Sex = 'male' | 'female' | 'na';
export type ReportCountry = 'ZA' | 'DE';
export type ReportLanguage = 'auto' | 'en' | 'de';

export interface ScanFormState {
  file: File | null;
  age: string;
  sex: Sex;
  goals: Goal[];
  peptideHistoryUsed: boolean | null;
  peptideHistoryNotes: string;
  reportCountry: ReportCountry;
  languageHint: ReportLanguage;
}

interface Props {
  state: ScanFormState;
  onChange: (next: ScanFormState) => void;
  disabled?: boolean;
}

export function ScanForm({ state, onChange, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const setFile = useCallback((file: File | null) => onChange({ ...state, file }), [state, onChange]);
  const toggleGoal = useCallback(
    (g: Goal) =>
      onChange({
        ...state,
        goals: state.goals.includes(g) ? state.goals.filter((x) => x !== g) : [...state.goals, g],
      }),
    [state, onChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className={cn('space-y-8', disabled && 'opacity-60 pointer-events-none')}>
      {/* 01 — FILE */}
      <Section num="01" title="Bloodwork file">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'group cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            drag ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/60 hover:bg-card/30'
          )}
          role="button"
          tabIndex={0}
        >
          {state.file ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck size={18} className="text-primary shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{state.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{(state.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={20} className="mx-auto text-muted-foreground group-hover:text-primary mb-2" />
              <p className="text-sm text-foreground">
                Drag & drop, or <span className="text-primary underline">click to upload</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">PDF or image · up to 10MB · English or German</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>
      </Section>

      {/* 02 — PATIENT INFO */}
      <Section num="02" title="Patient info">
        <div className="grid grid-cols-2 gap-4">
          <UnderlineField label="Age">
            <Input
              type="number"
              min={1}
              max={120}
              placeholder="—"
              value={state.age}
              onChange={(e) => onChange({ ...state, age: e.target.value })}
              className="border-0 border-b border-border/60 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
            />
          </UnderlineField>
          <UnderlineField label="Sex">
            <select
              value={state.sex}
              onChange={(e) => onChange({ ...state, sex: e.target.value as Sex })}
              className="w-full bg-transparent border-0 border-b border-border/60 rounded-none px-0 py-2 text-base text-foreground focus:outline-none focus:border-primary"
            >
              <option value="na">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </UnderlineField>
        </div>
      </Section>

      {/* 03 — GOALS */}
      <Section num="03" title="Goals — select at least one">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const active = state.goals.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card/40 text-muted-foreground border-border/60 hover:border-primary/60 hover:text-foreground'
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 04 — PEPTIDE HISTORY */}
      <Section num="04" title="Peptide history — have you used peptides before?">
        <div className="flex gap-2">
          {(['Yes', 'No'] as const).map((opt) => {
            const v = opt === 'Yes';
            const active = state.peptideHistoryUsed === v;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ ...state, peptideHistoryUsed: v })}
                className={cn(
                  'flex-1 max-w-[120px] py-2 rounded-lg text-sm font-medium border transition-all',
                  active
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card/40 border-border/60 text-muted-foreground hover:border-primary/60'
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {state.peptideHistoryUsed === true && (
          <Textarea
            value={state.peptideHistoryNotes}
            onChange={(e) => onChange({ ...state, peptideHistoryNotes: e.target.value })}
            placeholder="Which peptides, doses, and how long? e.g. Retatrutide 4mg/wk for 2 months, BPC-157 250mcg/day for 6 weeks."
            className="mt-3 min-h-[90px] bg-card/40"
            maxLength={1000}
          />
        )}
      </Section>

      <p className="text-[11px] text-muted-foreground italic pt-2 border-t border-border/40">
        For informational purposes only — not medical advice.
      </p>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{num} —</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function UnderlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export function isFormReady(s: ScanFormState): boolean {
  return !!s.file && s.goals.length > 0;
}
