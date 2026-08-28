import { CheckCircle2, Circle, ClipboardList, Package, Bell, CalendarCheck2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { track } from '@/lib/analytics';

interface TrackerReadinessCardProps {
  recordedItems: number;
  entryCount: number;
  enabledReminders: number;
  inventoryItems: number;
  onWorkspace: () => void;
  onDailyLog: () => void;
  onReminders: () => void;
  onInventory: () => void;
}

export function TrackerReadinessCard({
  recordedItems,
  entryCount,
  enabledReminders,
  inventoryItems,
  onWorkspace,
  onDailyLog,
  onReminders,
  onInventory,
}: TrackerReadinessCardProps) {
  const steps = [
    { id: 'workspace', label: 'Record an existing plan', detail: 'Amounts and timing stay under your control.', done: recordedItems > 0, icon: ClipboardList, action: onWorkspace },
    { id: 'daily_log', label: 'Save your first entry', detail: 'Creates your account-backed history.', done: entryCount > 0, icon: CalendarCheck2, action: onDailyLog },
    { id: 'reminders', label: 'Enable a useful reminder', detail: 'Optional and editable at any time.', done: enabledReminders > 0, icon: Bell, action: onReminders },
    { id: 'inventory', label: 'Add inventory details', detail: 'Track only stock you actually hold.', done: inventoryItems > 0, icon: Package, action: onInventory },
  ];
  const completed = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">First-week setup</p>
            <CardTitle className="mt-1 text-lg">Make the tracker useful on every device</CardTitle>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary">{completed}/{steps.length}</span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  track('tracker_readiness_action', { action: step.id, completed: step.done });
                  step.action();
                }}
                className="flex min-h-16 items-start gap-3 rounded-xl border border-border bg-background/70 p-3 text-left transition hover:border-primary/30 active:scale-[0.99]"
              >
                <span className="relative mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                  {step.done ? <CheckCircle2 className="absolute -bottom-2 -right-2 h-3.5 w-3.5 fill-background text-emerald-500" /> : <Circle className="absolute -bottom-2 -right-2 h-3.5 w-3.5 fill-background text-muted-foreground" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{step.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{step.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
        {next ? (
          <Button className="min-h-11 w-full justify-between sm:w-auto" onClick={() => {
            track('tracker_readiness_next', { action: next.id });
            next.action();
          }}>
            Continue setup: {next.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Your core tracker is ready. Keep logging only when it is useful to you.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
