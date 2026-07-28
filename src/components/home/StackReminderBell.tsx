import { useMemo, useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Cycle } from '@/data/userData';
import type { DailyDoseEntry } from '@/hooks/useDailyDoses';
import { updateCycle } from '@/services/storage';
import { getNextDose, getCycleProgress } from '@/lib/cycleProgress';
import {
  scheduleCycleReminders,
  requestPushPermission,
  registerServiceWorker,
} from '@/services/pushScheduler';

interface StackReminderBellProps {
  cycle: Cycle;
  doses: DailyDoseEntry[];
}

const LEAD_OPTIONS = [
  { value: '0', label: 'At dose time' },
  { value: '5', label: '5 min before' },
  { value: '15', label: '15 min before' },
  { value: '30', label: '30 min before' },
  { value: '60', label: '1 hr before' },
  { value: '120', label: '2 hrs before' },
];

export function StackReminderBell({ cycle, doses }: StackReminderBellProps) {
  const splitParts = Math.max(1, cycle.splitParts ?? 1);

  const initialTimes = useMemo(() => {
    if (cycle.doseTimes && cycle.doseTimes.length > 0) return cycle.doseTimes.slice(0, splitParts);
    return splitParts === 2 ? ['08:00', '20:00'] : splitParts === 3 ? ['08:00', '14:00', '20:00'] : ['09:00'];
  }, [cycle.doseTimes, splitParts]);

  const [enabled, setEnabled] = useState<boolean>(!!cycle.reminderEnabled);
  const [lead, setLead] = useState<string>(String(cycle.reminderLeadMinutes ?? 0));
  const [times, setTimes] = useState<string[]>(initialTimes);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const next = useMemo(() => getNextDose(cycle, doses, new Date(), times), [cycle, doses, times]);
  const progress = useMemo(() => getCycleProgress(cycle, doses), [cycle, doses]);

  const stateLabel =
    cycle.status === 'break' ? 'Paused — reminders off'
    : progress.isOverdue ? 'Cycle complete'
    : progress.dosesBehind >= 2 ? `Behind ${progress.dosesBehind} — catch-up reminder`
    : next?.label
      ? `Next: ${next.label}`
      : 'Schedule a dose to start';

  const updateTime = (i: number, value: string) => {
    const out = [...times];
    out[i] = value;
    setTimes(out);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Persist to cycle storage
      const updated: Cycle = {
        ...cycle,
        reminderEnabled: enabled,
        reminderLeadMinutes: Number(lead) || 0,
        doseTimes: times.slice(0, splitParts),
      };
      updateCycle(updated);

      if (enabled) {
        // Ensure SW + permission
        await registerServiceWorker();
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          const ok = await requestPushPermission();
          if (!ok) {
            toast.error('Enable notifications in your browser to receive reminders');
            setSaving(false);
            return;
          }
        }
      }

      await scheduleCycleReminders(updated, doses);

      window.dispatchEvent(new CustomEvent('rtd:stack-changed'));
      toast.success(enabled ? 'Reminders updated' : 'Reminders turned off');
      setOpen(false);
    } catch (err) {
      console.error('save reminder failed', err);
      toast.error('Could not save reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Configure dose reminders"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full border border-border/50 active:scale-[0.92] transition-transform',
            enabled ? 'bg-primary/15 text-primary border-primary/40' : 'bg-muted/40 text-muted-foreground',
          )}
        >
          {enabled ? <Bell size={13} /> : <BellOff size={13} />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-3 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{cycle.peptideName}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock size={11} /> {stateLabel}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-2">
          <Label htmlFor={`bell-${cycle.id}`} className="text-xs">Remind me</Label>
          <Switch id={`bell-${cycle.id}`} checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Lead time</Label>
          <Select value={lead} onValueChange={setLead}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">
            {splitParts > 1 ? `Administration times (${splitParts} sub-doses = 1 complete dose)` : 'Dose time'}
          </Label>
          {Array.from({ length: splitParts }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/80 w-10 flex-shrink-0">
                {splitParts === 2 ? (i === 0 ? 'AM' : 'PM') : `#${i + 1}`}
              </span>
              <Input
                type="time"
                value={times[i] || '09:00'}
                onChange={(e) => updateTime(i, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>

        <Button size="sm" className="w-full h-8 text-xs" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save reminder'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
