import { useEffect, useState } from 'react';
import { GradientCard } from '@/components/ui/GradientCard';
import { Badge } from '@/components/ui/badge';
import { getActiveStack, getCycles, type ActiveStackItem, type Cycle } from '@/services/storage';
import { peptides } from '@/data/peptides';
import { findPeptideOrBlend } from '@/data/blendAdapters';
import { Layers, ChevronRight, Plus, Pause, AlertCircle, Info, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncPhase } from '@/hooks/useCloudSync';
import { useAuth } from '@/contexts/AuthContext';
import { StackSyncBadge, type SyncStatus } from '@/components/sync/StackSyncBadge';
import { StackPreviewSkeleton } from './StackPreviewSkeleton';
import { useDailyDoses } from '@/hooks/useDailyDoses';
import { getCycleProgress, cycleStatusLabel, getCyclePhase, getNextDose, getLoggedDoseDates } from '@/lib/cycleProgress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StackReminderBell } from './StackReminderBell';

interface ActiveStackPreviewProps {
  onViewStack: () => void;
}

export function ActiveStackPreview({ onViewStack }: ActiveStackPreviewProps) {
  const [userStack, setUserStack] = useState<ActiveStackItem[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const { user } = useAuth();
  const { phase, lastSyncAt } = useSyncPhase();
  const { doses } = useDailyDoses();

  useEffect(() => {
    const refresh = () => {
      setUserStack(getActiveStack());
      setCycles(getCycles());
    };
    refresh();
    window.addEventListener('rtd:cloud-hydrated', refresh);
    window.addEventListener('rtd:stack-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('rtd:cloud-hydrated', refresh);
      window.removeEventListener('rtd:stack-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const isHydrating = !!user && (phase === 'hydrating' || phase === 'idle');
  if (isHydrating && userStack.length === 0) {
    return <StackPreviewSkeleton />;
  }

  const status: SyncStatus = !user
    ? 'offline'
    : phase === 'hydrating' || phase === 'idle'
      ? 'hydrating'
      : phase === 'syncing'
        ? 'syncing'
        : phase === 'error'
          ? 'error'
          : 'ready';

  // Empty state
  if (userStack.length === 0) {
    return (
      <GradientCard hover onClick={onViewStack} className="border-dashed border-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Plus size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Build Your Stack</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your first peptide to start tracking
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-primary" />
        </div>
      </GradientCard>
    );
  }

  // Build per-peptide rows with live cycle progress
  const rows = userStack.map((item) => {
    const peptide = findPeptideOrBlend(item.peptideId) || peptides.find(p => p.id === item.peptideId);
    const cycle = cycles.find(c => c.peptideId === item.peptideId && (c.status === 'active' || c.status === 'break'));
    const info = cycle ? getCycleProgress(cycle, doses) : null;
    return { item, peptide, cycle, info };
  });

  // Top summary
  const activeCount = rows.filter(r => r.cycle?.status === 'active').length;
  const pausedCount = rows.filter(r => r.cycle?.status === 'break').length;
  const noCycleCount = rows.filter(r => !r.cycle).length;
  const dosesBehindToday = rows.reduce((sum, r) => sum + (r.info?.dosesBehind ?? 0), 0);

  const summaryParts: string[] = [];
  if (activeCount) summaryParts.push(`${activeCount} active`);
  if (pausedCount) summaryParts.push(`${pausedCount} paused`);
  if (noCycleCount) summaryParts.push(`${noCycleCount} not started`);
  const summaryLine = summaryParts.join(' · ');

  return (
    <GradientCard hover onClick={onViewStack}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Layers size={20} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">Active Protocol</h3>
            <p className="text-xs text-muted-foreground truncate">
              {summaryLine || `${userStack.length} peptides`}
              {dosesBehindToday > 0 && (
                <span className="text-amber-400"> · {dosesBehindToday} dose{dosesBehindToday === 1 ? '' : 's'} behind</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StackSyncBadge status={status} lastSyncAt={lastSyncAt} compact />
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.slice(0, 5).map(({ item, peptide, cycle, info }) => {
          if (!peptide) return null;
          const name = peptide.name;

          const phaseInfo = cycle && info ? getCyclePhase(cycle, info) : null;
          const nextDose = cycle && info && cycle.status === 'active' ? getNextDose(cycle, doses) : null;

          let primaryText: string | null = null;
          if (cycle && info && phaseInfo) {
            primaryText = `Week ${phaseInfo.weekNow}/${phaseInfo.weeksTotal} · ${phaseInfo.label}`;
          }

          let secondaryText: string | null = null;
          if (cycle && info) {
            const parts = [`${info.dosesLogged}/${info.dosesPlanned} doses`];
            if (nextDose) parts.push(`next ${nextDose.label}`);
            else if (phaseInfo?.phase === 'complete') parts.push(`pause ${cycle.breakDuration}d`);
            secondaryText = parts.join(' · ');
          }

          const statusLabel = info ? cycleStatusLabel(info, cycle?.status) : 'Not started';
          const badgeTone =
            cycle?.status === 'break'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : info?.isOverdue
                ? 'bg-destructive/15 text-destructive border-destructive/30'
                : info && info.dosesBehind >= 2
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : info?.isNearing
                    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                    : info
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground border-border';

          const splitParts = Math.max(1, item.splitParts ?? cycle?.splitParts ?? 1);
          const doseTimes = (cycle?.doseTimes && cycle.doseTimes.length > 0)
            ? cycle.doseTimes.slice(0, splitParts)
            : (item.doseTimes && item.doseTimes.length > 0)
              ? item.doseTimes.slice(0, splitParts)
              : splitParts === 2 ? ['08:00', '20:00'] : splitParts === 3 ? ['08:00', '14:00', '20:00'] : ['09:00'];
          const loggedDates = cycle ? getLoggedDoseDates(cycle, doses) : new Set<string>();
          const todayIso = new Date().toISOString().split('T')[0];
          const todaysLogs = doses.filter(
            d => d.date === todayIso && (d.peptide_id === item.peptideId || d.peptide_name === peptide.name)
          );
          const todaySubdoseCount = todaysLogs.length;
          // Convert HH:MM to minutes for tolerant matching.
          const toMin = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
          };
          const loggedSlotMins = todaysLogs
            .map(l => (l.time ? toMin(l.time) : null))
            .filter((v): v is number => v !== null);
          const expandable = !!cycle;

          return (
            <Collapsible
              key={item.peptideId}
              className="rounded-lg bg-muted/30 px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  {cycle?.status === 'break' ? (
                    <p className="text-[11px] text-amber-400/90 truncate">
                      <span className="inline-flex items-center gap-1">
                        <Pause size={9} /> Paused{cycle.pauseReason === 'out_of_stock' ? ' — out of stock' : cycle.pauseReason === 'missed_doses' ? ' — catching up' : ''}
                      </span>
                    </p>
                  ) : primaryText ? (
                    <>
                      <p className="text-[11px] text-muted-foreground truncate">{primaryText}</p>
                      {secondaryText && (
                        <p className="text-[10px] text-muted-foreground/80 truncate flex items-center gap-1">
                          <Clock size={9} /> {secondaryText}
                          {splitParts > 1 && (
                            <span className="ml-1 px-1 rounded bg-primary/10 text-primary text-[9px]">
                              {todaySubdoseCount % splitParts}/{splitParts} sub today
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground truncate">
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle size={9} /> No cycle yet · tap to start
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="outline" className={cn('text-[10px]', badgeTone)}>
                    {statusLabel}
                  </Badge>
                  {cycle && <StackReminderBell cycle={cycle} doses={doses} />}
                  {expandable && (
                    <CollapsibleTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted/60 text-muted-foreground data-[state=open]:rotate-180 transition-transform"
                      aria-label="Show dose breakdown"
                    >
                      <ChevronDown size={13} />
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>

              {cycle && (
                <CollapsibleContent onClick={(e) => e.stopPropagation()}>
                  <div className="mt-2 rounded-md bg-background/40 border border-border/40 p-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wide">
                      Today · {splitParts > 1 ? `${splitParts} sub-doses = 1 complete dose` : '1 administration = 1 complete dose'}
                    </p>
                    {doseTimes.map((t, i) => {
                      const slotMin = toMin(t);
                      // Match a logged dose within ±90 min of this slot. Fall back
                      // to positional count only when no logs have a timestamp.
                      const subLogged = loggedSlotMins.length > 0
                        ? loggedSlotMins.some(m => Math.abs(m - slotMin) <= 90)
                        : todaySubdoseCount > i;
                      return (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-foreground">
                            {t} — {item.dose}
                            {splitParts === 2 && (
                              <span className="text-muted-foreground"> ({i === 0 ? 'AM' : 'PM'})</span>
                            )}
                            {splitParts >= 3 && (
                              <span className="text-muted-foreground"> (#{i + 1})</span>
                            )}
                          </span>
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[9px] border',
                            subLogged
                              ? 'bg-primary/15 text-primary border-primary/30'
                              : 'bg-muted/40 text-muted-foreground border-border/50',
                          )}>
                            {subLogged ? 'Logged' : 'Upcoming'}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/30">
                      Progress counts <strong>complete</strong> doses · {info?.dosesLogged ?? 0}/{info?.dosesPlanned ?? 0}
                    </p>
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          );
        })}
        {rows.length > 5 && (
          <p className="text-[11px] text-muted-foreground pl-2.5">+{rows.length - 5} more in My Stack</p>
        )}
      </div>

      {/* How this is computed — inline explainer */}
      <Collapsible>
        <CollapsibleTrigger
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          <Info size={10} /> How is this calculated?
        </CollapsibleTrigger>
        <CollapsibleContent onClick={(e) => e.stopPropagation()}>
          <div className="mt-2 rounded-lg bg-muted/20 border border-border/40 p-2.5 text-[10px] text-muted-foreground leading-relaxed space-y-1">
            <p><strong className="text-foreground">Week N / Total</strong> = calendar days since cycle start ÷ 7, capped at planned duration.</p>
            <p><strong className="text-foreground">Doses logged / planned</strong> = entries in Daily Log for this peptide vs. (frequency × cycle weeks). Multiple same-day logs count once for daily cadences.</p>
            <p><strong className="text-foreground">Next dose</strong> = last logged dose + interval from your frequency (e.g. 2× weekly → every 3.5 days).</p>
            <p><strong className="text-foreground">Paused</strong> appears when you explicitly pause, or when Recalculate Cycle detects 14+ days with no logs.</p>
            <p className="text-muted-foreground/70 pt-1">Edit start date or run "Recalculate cycle" in My Stack if anything looks off.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GradientCard>
  );
}
