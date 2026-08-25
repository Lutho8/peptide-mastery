import { useEffect, useState } from 'react';
import { ChevronRight, Layers, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GradientCard } from '@/components/ui/GradientCard';
import { findPeptideOrBlend } from '@/data/blendAdapters';
import { peptides } from '@/data/peptides';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyDoses } from '@/hooks/useDailyDoses';
import { useSyncPhase } from '@/hooks/useCloudSync';
import { cycleStatusLabel, getCycleProgress } from '@/lib/cycleProgress';
import { cn } from '@/lib/utils';
import { getActiveStack, getCycles, type ActiveStackItem, type Cycle } from '@/services/storage';
import { StackSyncBadge, type SyncStatus } from '@/components/sync/StackSyncBadge';
import { StackPreviewSkeleton } from './StackPreviewSkeleton';

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

  if (user && (phase === 'hydrating' || phase === 'idle') && userStack.length === 0) {
    return <StackPreviewSkeleton />;
  }

  const syncStatus: SyncStatus = !user
    ? 'offline'
    : phase === 'hydrating' || phase === 'idle'
      ? 'hydrating'
      : phase === 'syncing'
        ? 'syncing'
        : phase === 'error'
          ? 'error'
          : 'ready';

  if (userStack.length === 0) {
    return (
      <GradientCard hover onClick={onViewStack} className="border-dashed border-primary/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Plus size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Record an existing plan</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add only the product and instructions you already have
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="flex-shrink-0 text-primary" />
        </div>
      </GradientCard>
    );
  }

  const rows = userStack.map((item) => {
    const peptide = findPeptideOrBlend(item.peptideId) || peptides.find(candidate => candidate.id === item.peptideId);
    const cycle = cycles.find(candidate => candidate.peptideId === item.peptideId && (candidate.status === 'active' || candidate.status === 'break'));
    const progress = cycle ? getCycleProgress(cycle, doses) : null;
    return { item, peptide, cycle, progress };
  });

  const activeCount = rows.filter(row => row.cycle?.status === 'active').length;
  const pausedCount = rows.filter(row => row.cycle?.status === 'break').length;
  const summary = [
    `${userStack.length} recorded item${userStack.length === 1 ? '' : 's'}`,
    activeCount ? `${activeCount} tracking` : null,
    pausedCount ? `${pausedCount} paused` : null,
  ].filter(Boolean).join(' · ');

  return (
    <GradientCard hover onClick={onViewStack}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
            <Layers size={20} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">Recorded workspace</h3>
            <p className="truncate text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StackSyncBadge status={syncStatus} lastSyncAt={lastSyncAt} compact />
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.slice(0, 5).map(({ item, peptide, cycle, progress }) => {
          if (!peptide) return null;
          const statusLabel = progress ? cycleStatusLabel(progress, cycle?.status) : 'Not tracking';
          const badgeTone = cycle?.status === 'break'
            ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
            : progress?.isOverdue
              ? 'border-primary/30 bg-primary/15 text-primary'
              : 'border-border bg-muted text-muted-foreground';

          return (
            <div key={item.peptideId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-2.5 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{peptide.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.dose} · {item.frequency}
                  {progress ? ` · ${progress.dosesLogged}/${progress.dosesPlanned} entries` : ''}
                </p>
              </div>
              <Badge variant="outline" className={cn('flex-shrink-0 text-[10px]', badgeTone)}>
                {statusLabel}
              </Badge>
            </div>
          );
        })}
        {rows.length > 5 && (
          <p className="pl-2.5 text-[11px] text-muted-foreground">+{rows.length - 5} more recorded items</p>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/80">
        This view reflects your entries. It does not create or change a clinical plan.
      </p>
    </GradientCard>
  );
}
