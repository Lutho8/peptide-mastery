import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, X, AlertCircle, PackageX, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Cycle } from '@/services/storage';

type Reason = NonNullable<Cycle['pauseReason']>;

interface EditCyclePanelProps {
  cycle: Cycle;
  onSave: (updated: Cycle) => void;
  onCancel: () => void;
}

const REASONS: { id: Reason; label: string; icon: typeof Pause }[] = [
  { id: 'missed_doses', label: 'Missed several days', icon: CalendarOff },
  { id: 'out_of_stock', label: 'Ran out of peptides', icon: PackageX },
  { id: 'other', label: 'Other', icon: AlertCircle },
];

export function EditCyclePanel({ cycle, onSave, onCancel }: EditCyclePanelProps) {
  const [reason, setReason] = useState<Reason>(cycle.pauseReason ?? 'missed_doses');
  const [missedDays, setMissedDays] = useState<number>(cycle.missedDays ?? 0);
  const [dose, setDose] = useState(cycle.dose);
  const [frequency, setFrequency] = useState(cycle.frequency);
  const [startDate, setStartDate] = useState(cycle.startDate);
  const [plannedDuration, setPlannedDuration] = useState(cycle.plannedDuration);
  const [breakDuration, setBreakDuration] = useState(cycle.breakDuration);
  const [notes, setNotes] = useState(cycle.notes ?? '');

  const handleSave = () => {
    onSave({
      ...cycle,
      status: 'break',
      pauseReason: reason,
      pausedAt: new Date().toISOString().split('T')[0],
      missedDays: Number.isFinite(missedDays) ? missedDays : 0,
      dose,
      frequency,
      startDate,
      plannedDuration,
      breakDuration,
      notes: notes || undefined,
    });
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden mt-3 pt-3 border-t border-border/50"
      data-testid="edit-cycle-panel"
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Why are you pausing?</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {REASONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setReason(id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs touch-target transition-colors',
                  reason === id
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                )}
                aria-pressed={reason === id}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Missed days</Label>
            <Input
              type="number"
              min={0}
              className="bg-muted"
              value={missedDays}
              onChange={(e) => setMissedDays(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recorded amount</Label>
            <Input className="bg-muted" value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frequency</Label>
            <Input className="bg-muted" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Start date</Label>
            <Input
              type="date"
              className="bg-muted"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recorded length (days)</Label>
            <Input
              type="number"
              className="bg-muted"
              value={plannedDuration}
              onChange={(e) => setPlannedDuration(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recorded pause (days)</Label>
            <Input
              type="number"
              className="bg-muted"
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input
              className="bg-muted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context for your records…"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          These fields mirror your own existing plan. Updating them does not create clinical guidance.
        </p>

        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 flex-1" onClick={handleSave}>
            <Pause size={12} /> Save & pause
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onCancel}>
            <X size={12} /> Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
