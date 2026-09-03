import { useState, useEffect } from 'react';
import { GradientCard } from '@/components/ui/GradientCard';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { userProfile } from '@/data/userData';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSync, useSyncPhase } from '@/hooks/useCloudSync';
import { findPeptideOrBlend, findBlendData } from '@/data/blendAdapters';
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, Edit2, FlaskConical, Play, Square, Target, Calendar as CalendarIcon, Undo2, Pause, Pencil, Info } from 'lucide-react';
import { getGoalLabels } from '@/data/goalMap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EditStackModal, StackItem } from '@/components/modals/EditStackModal';
import { getActiveStack, saveActiveStack, getUserProfile, type Cycle } from '@/services/storage';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { recordStackChange, popLastChange, canUndo as canUndoStack } from '@/services/stackHistory';
import { StackSyncBadge } from '@/components/sync/StackSyncBadge';
import { Badge } from '@/components/ui/badge';
import { EditCyclePanel } from '@/components/doses/EditCyclePanel';
import { AnimatePresence } from 'framer-motion';
import { useDailyDoses, type DailyDoseEntry } from '@/hooks/useDailyDoses';
import { getCycleProgress as computeCycleProgress, cycleStatusLabel, validateBackdate } from '@/lib/cycleProgress';
import { WidgetHint } from '@/components/onboarding/WidgetHint';
import { useTrackingPeriods } from '@/hooks/useTrackingPeriods';
import { SavedResearchPlanCard } from '@/components/research/SavedResearchPlanCard';

// --- Stack Item Card ---
interface StackItemProps {
  peptide: ReturnType<typeof findPeptideOrBlend>;
  dose: string;
  frequency: string;
  peptideId: string;
  cycle?: Cycle;
  doses?: DailyDoseEntry[];
  isEditing?: boolean;
  onStartCycle?: (peptideId: string, peptideName: string, dose: string, frequency: string) => void;
  onEndCycle?: (cycle: Cycle) => void;
  onTogglePauseEdit?: (cycle: Cycle) => void;
  onSavePauseEdit?: (cycle: Cycle) => void;
  onResume?: (cycle: Cycle) => void;
}

function StackItemCard({ peptide, dose, frequency, peptideId, cycle, doses, isEditing, onStartCycle, onEndCycle, onTogglePauseEdit, onSavePauseEdit, onResume }: StackItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const blendData = findBlendData(peptideId);

  if (!peptide) return null;

  const cycleInfo = cycle ? computeCycleProgress(cycle, doses || []) : null;
  const pauseLabel = cycle?.pauseReason === 'out_of_stock'
    ? 'Paused — out of peptides'
    : cycle?.pauseReason === 'missed_doses'
      ? 'Paused — catching up'
      : cycle?.pauseReason === 'other'
        ? 'Paused'
        : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <GradientCard className="mb-3">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {blendData ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                </div>
              ) : (
                <CategoryBadge category={peptide.category} showCount={false} size="sm" />
              )}
              <div className="text-left">
                <h4 className="font-semibold text-foreground">{peptide.name}</h4>
                <p className="text-sm text-muted-foreground">{dose} • {frequency}</p>
                {(pauseLabel || (cycle?.missedDays && cycle.missedDays > 0)) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pauseLabel && cycle?.status === 'break' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-[10px]">
                        <Pause size={9} /> {pauseLabel}
                      </span>
                    )}
                    {cycle?.missedDays && cycle.missedDays > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-300 px-2 py-0.5 text-[10px]">
                        {cycle.missedDays}d missed
                      </span>
                    )}
                  </div>
                )}
                {blendData && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {blendData.components.slice(0, 3).map((c, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0">{c}</Badge>
                    ))}
                    {blendData.components.length > 3 && (
                      <Badge variant="outline" className="text-[10px] py-0">+{blendData.components.length - 3}</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp size={20} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={20} className="text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        {/* Start Cycle button when no active cycle */}
        {!cycle && onStartCycle && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onStartCycle(peptideId, peptide.name, dose, frequency);
              }}
            >
              <Play size={12} />
              Start tracking period
            </Button>
          </div>
        )}

        {/* Inline cycle progress bar */}
        {cycle && cycleInfo && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Dose {cycleInfo.dosesLogged}/{cycleInfo.dosesPlanned} logged
                {cycleInfo.dosesBehind > 0 && cycle.status === 'active' && (
                  <span className="ml-1 text-amber-400">· {cycleInfo.dosesBehind} behind</span>
                )}
              </span>
              <Badge
                variant={cycleInfo.isOverdue ? "destructive" : cycleInfo.isNearing ? "secondary" : "outline"}
                className="text-[10px]"
              >
                {cycleStatusLabel(cycleInfo, cycle.status)}
              </Badge>
            </div>
            <div className="w-full h-2 rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  cycleInfo.isOverdue ? "bg-destructive" : cycleInfo.isNearing ? "bg-yellow-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(cycleInfo.progress, 100)}%` }}
              />
            </div>
            {cycle.breakDuration > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Recorded pause after this period: {cycle.breakDuration} days
              </p>
            )}
            {/* Inline cycle action buttons */}
            <div className="flex flex-wrap gap-2">
              {cycle.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-7 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePauseEdit?.(cycle);
                    }}
                  >
                    <Pencil size={10} />
                    {isEditing ? 'Close editor' : 'Edit & pause'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEndCycle?.(cycle);
                    }}
                  >
                    <Square size={10} />
                    End Cycle
                  </Button>
                </>
              )}
              {cycle.status === 'break' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResume?.(cycle);
                    }}
                  >
                    <Play size={10} />
                    Resume
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePauseEdit?.(cycle);
                    }}
                  >
                    <Pencil size={10} />
                    {isEditing ? 'Close editor' : 'Edit'}
                  </Button>
                </>
              )}
            </div>

            {/* Inline edit/pause panel */}
            <AnimatePresence>
              {isEditing && cycle && onSavePauseEdit && (
                <EditCyclePanel
                  cycle={cycle}
                  onSave={onSavePauseEdit}
                  onCancel={() => onTogglePauseEdit?.(cycle)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
            {blendData ? (
              <>
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-2">Research overview</h5>
                  <p className="text-xs text-muted-foreground">{blendData.howItWorks.slice(0, 200)}...</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-1">Research topics</h5>
                  <p className="mb-2 text-[10px] text-muted-foreground">Catalogue topics only; not promised outcomes or recommendations.</p>
                  <ul className="space-y-1">
                    {blendData.benefits.slice(0, 4).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    Watch For
                  </h5>
                  <ul className="space-y-1">
                    {blendData.sideEffects.slice(0, 3).map((effect, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-yellow-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
                {blendData.references.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2">References</h5>
                    <div className="space-y-1">
                      {blendData.references.slice(0, 3).map((ref, i) => (
                        <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                           className="block text-[10px] text-primary/80 hover:text-primary truncate">
                          {ref.source}: {ref.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-1">Athlete-focused research topics</h5>
                  <p className="mb-2 text-[10px] text-muted-foreground">These labels organise source material and are not performance claims.</p>
                  <ul className="space-y-1">
                    {peptide.athleteBenefits.slice(0, 3).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    Watch For
                  </h5>
                  <ul className="space-y-1">
                    {peptide.risks.slice(0, 2).map((risk, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-yellow-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </GradientCard>
    </Collapsible>
  );
}

// --- Main Screen ---
export function MyStackScreen() {
  const { user } = useAuth();
  const { syncActiveStack } = useCloudSync();
  const { phase, lastSyncAt } = useSyncPhase();
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [activeStack, setActiveStack] = useState<StackItem[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(userProfile);
  const {
    periods: cycles,
    isSyncing: periodsSyncing,
    error: periodsSyncError,
    createPeriod,
    updatePeriod,
  } = useTrackingPeriods();
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const { doses } = useDailyDoses();

  // Start-cycle date picker dialog state
  const [startCycleDialogOpen, setStartCycleDialogOpen] = useState(false);
  const [pendingCycle, setPendingCycle] = useState<{ peptideId: string; peptideName: string; dose: string; frequency: string } | null>(null);
  const [pendingStartDate, setPendingStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pendingDuration, setPendingDuration] = useState('');
  const [pendingBreakDuration, setPendingBreakDuration] = useState('');

  const refreshFromStorage = () => {
    setActiveStack(getActiveStack());
    setProfile(getUserProfile());
  };

  useEffect(() => {
    refreshFromStorage();
  }, [user?.id]);

  // When cloud sync finishes hydrating local storage, refresh the screen
  useEffect(() => {
    const handler = () => {
      refreshFromStorage();
      setUndoAvailable(canUndoStack());
    };
    handler();
    window.addEventListener('rtd:cloud-hydrated', handler);
    window.addEventListener('rtd:stack-changed', handler);
    return () => {
      window.removeEventListener('rtd:cloud-hydrated', handler);
      window.removeEventListener('rtd:stack-changed', handler);
    };
  }, []);

  // Resolve display name: stored profile → auth metadata → email → fallback.
  const displayName =
    (profile.name && profile.name.trim()) ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Welcome';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasProfileDetails = profile.age > 0 && profile.height > 0 && profile.weight > 0;

  const handleSaveStack = (newStack: StackItem[], reason: 'edit' | 'undo' = 'edit') => {
    const prev = getActiveStack();
    setActiveStack(newStack);
    saveActiveStack(newStack);
    if (reason !== 'undo') {
      const changeReason = newStack.length === 0 && prev.length > 0 ? 'clear' : 'edit';
      recordStackChange(prev, newStack, changeReason);
      // Offer undo
      sonnerToast('Workspace updated', {
        description: changeReason === 'clear' ? 'All recorded items removed.' : 'Your recorded workspace has been saved.',
        action: {
          label: 'Undo',
          onClick: () => handleUndo(),
        },
      });
    }
    try {
      window.dispatchEvent(new CustomEvent('rtd:stack-changed'));
    } catch { /* noop */ }
    if (user) {
      void syncActiveStack().catch(() => { /* noop */ });
    }
  };

  const handleUndo = () => {
    const last = popLastChange();
    if (!last) {
      sonnerToast.error('Nothing to undo');
      return;
    }
    handleSaveStack(last.prev, 'undo');
    sonnerToast.success('Reverted to previous workspace');
  };

  const openStartCycleDialog = (peptideId: string, peptideName: string, dose: string, frequency: string) => {
    setPendingCycle({ peptideId, peptideName, dose, frequency });
    setPendingStartDate(new Date().toISOString().split('T')[0]);
    setPendingDuration('');
    setPendingBreakDuration('');
    setStartCycleDialogOpen(true);
  };

  const handleStartCycle = async (peptideId: string, peptideName: string, dose: string, frequency: string, cycleDuration: number, breakDuration: number, startDateOverride?: string) => {
    const newCycle: Omit<Cycle, 'id' | 'updatedAt'> = {
      peptideId,
      peptideName,
      dose,
      frequency,
      startDate: startDateOverride || new Date().toISOString().split('T')[0],
      plannedDuration: cycleDuration,
      breakDuration,
      status: 'active',
    };
    await createPeriod(newCycle);
    toast({
      title: 'Tracking period started',
      description: `${peptideName} — recorded from ${newCycle.startDate} for ${cycleDuration} days and synced across your account.`,
    });
  };

  const confirmStartCycle = async () => {
    if (!pendingCycle) return;
    const duration = Number.parseInt(pendingDuration, 10);
    const breakDuration = pendingBreakDuration ? Number.parseInt(pendingBreakDuration, 10) : 0;
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(breakDuration) || breakDuration < 0) {
      toast({ title: 'Enter your recorded plan length', description: 'Use values from your existing plan. The app does not provide them.', variant: 'destructive' });
      return;
    }
    try {
      await handleStartCycle(pendingCycle.peptideId, pendingCycle.peptideName, pendingCycle.dose, pendingCycle.frequency, duration, breakDuration, pendingStartDate);
      setStartCycleDialogOpen(false);
      setPendingCycle(null);
    } catch {
      toast({ title: 'Tracking period saved on this device', description: 'Cloud sync will retry when your connection is available.', variant: 'destructive' });
    }
  };

  const handleEndCycle = (cycle: Cycle) => {
    const updated: Cycle = { ...cycle, status: 'completed' };
    void updatePeriod(updated).then(() => {
      toast({ title: 'Tracking period ended', description: `${cycle.peptideName} has been moved to your history.` });
    }).catch(() => {
      toast({ title: 'Saved on this device', description: 'Cloud sync will retry when available.', variant: 'destructive' });
    });
  };

  const getCycleForPeptide = (peptideId: string): Cycle | undefined => {
    return cycles.find(c => c.peptideId === peptideId && (c.status === 'active' || c.status === 'break'));
  };

  const handleTogglePauseEdit = (cycle: Cycle) => {
    setEditingCycleId(prev => (prev === cycle.id ? null : cycle.id));
  };

  const handleSavePauseEdit = (updated: Cycle) => {
    setEditingCycleId(null);
    void updatePeriod(updated).then(() => {
      toast({ title: 'Tracking period paused', description: `${updated.peptideName} is paused in your records.` });
    }).catch(() => {
      toast({ title: 'Saved on this device', description: 'Cloud sync will retry when available.', variant: 'destructive' });
    });
  };

  const handleResumeCycle = (cycle: Cycle) => {
    const today = new Date().toISOString().split('T')[0];
    const updated: Cycle = {
      ...cycle,
      status: 'active',
      resumedAt: today,
      pauseReason: undefined,
    };
    void updatePeriod(updated).then(() => {
      toast({ title: 'Tracking period resumed', description: `${cycle.peptideName} is active in your records again.` });
    }).catch(() => {
      toast({ title: 'Saved on this device', description: 'Cloud sync will retry when available.', variant: 'destructive' });
    });
  };

  return (
    <div className="pb-24 space-y-6 fade-in">
      <WidgetHint
        id="mystack-intro"
        title="Keep one accurate record of your existing plan"
        body="Record only information you already have. The dashboard uses this workspace for logging and progress views; it does not choose products, amounts, frequencies or durations."
        steps={[
          'Tap "Edit" to add or remove recorded items.',
          'Enter amounts and frequencies from your existing plan.',
          'Start, pause or end a tracking period when your real-world record changes.',
        ]}
      />

      <SavedResearchPlanCard />

      {(periodsSyncing || periodsSyncError) && (
        <div className={cn('rounded-xl border px-3 py-2 text-xs', periodsSyncError ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-primary/20 bg-primary/5 text-muted-foreground')}>
          {periodsSyncError ? 'Tracking periods are saved locally and will sync when the account connection recovers.' : 'Syncing tracking periods across your devices…'}
        </div>
      )}

      {/* User Profile Header */}

      <GradientCard className="relative overflow-hidden premium-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-accent/50 to-primary/80 flex items-center justify-center text-background font-bold text-xl shadow-lg shadow-accent/20 luxury-shimmer">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            {hasProfileDetails ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {profile.age} years • {profile.height}cm • {profile.weight}kg
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
                    {profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1)}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {profile.experience.charAt(0).toUpperCase() + profile.experience.slice(1)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Add profile details in Settings to keep your records organised.
              </p>
            )}
          </div>
        </div>

        {/* Saved interests are organisational labels, not recommendations. */}
        {(() => {
          const goalLabelList = getGoalLabels(profile.goals);
          if (goalLabelList.length > 0) {
            return (
              <div className="relative mt-4 flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5">Your saved interests:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {goalLabelList.map(g => (
                      <Badge key={g} variant="secondary" className="text-[10px] py-0 h-5">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <a
              href="/?screen=settings"
              className="relative mt-4 flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
            >
              <Target size={14} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Add interests in <span className="text-primary font-medium">Settings → Profile</span> to organise your workspace.
              </p>
            </a>
          );
        })()}
      </GradientCard>

      {/* Active Stack Overview */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Recorded Workspace</h3>
            <StackSyncBadge
              status={
                !user
                  ? 'offline'
                  : phase === 'hydrating' || phase === 'idle'
                    ? 'hydrating'
                    : phase === 'syncing'
                      ? 'syncing'
                      : phase === 'error'
                        ? 'error'
                        : 'ready'
              }
              lastSyncAt={lastSyncAt}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary font-medium">{activeStack.length} items</span>
            {undoAvailable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="gap-1"
                title="Undo last stack change"
              >
                <Undo2 size={14} />
                Undo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="gap-1"
            >
              <Edit2 size={14} />
              Edit
            </Button>
          </div>
        </div>

        {activeStack.length === 0 ? (
          <GradientCard className="text-center py-8">
            <p className="text-muted-foreground mb-3">No items have been recorded yet.</p>
            <Button onClick={() => setEditModalOpen(true)}>
              Add a recorded item
            </Button>
          </GradientCard>
        ) : (
          activeStack.map((item) => {
            const peptide = findPeptideOrBlend(item.peptideId);
            if (!peptide) return null;
            return (
              <StackItemCard
                key={item.peptideId}
                peptide={peptide}
                peptideId={item.peptideId}
                dose={item.dose}
                frequency={item.frequency}
                cycle={getCycleForPeptide(item.peptideId)}
                doses={doses}
                isEditing={editingCycleId === getCycleForPeptide(item.peptideId)?.id}
                onStartCycle={openStartCycleDialog}
                onEndCycle={handleEndCycle}
                onTogglePauseEdit={handleTogglePauseEdit}
                onSavePauseEdit={handleSavePauseEdit}
                onResume={handleResumeCycle}
              />
            );
          })
        )}
      </div>

      {/* Active Cycles Summary */}
      {cycles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Recorded tracking periods</h3>
          <div className="space-y-2">
            {cycles.filter(c => c.status === 'active' || c.status === 'break').map((cycle) => {
              const info = computeCycleProgress(cycle, doses);
              return (
                <GradientCard key={cycle.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{cycle.peptideName}</h4>
                      <p className="text-xs text-muted-foreground">{cycle.dose} • {cycle.frequency}</p>
                    </div>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        info.isOverdue ? "bg-destructive" : info.isNearing ? "bg-yellow-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(info.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {info.dosesLogged}/{info.dosesPlanned} entries logged · day {info.calendarDays + 1}
                    {cycle.breakDuration > 0 ? ` · ${cycle.breakDuration}d recorded pause` : ''}
                  </p>
                </GradientCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Research Disclaimer */}
      <div className="p-4 rounded-xl border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Medical disclaimer:</strong> This workspace stores information
          you enter and provides educational context. It does not diagnose, prescribe, select products or
          supply dosages. Clinical decisions belong with a qualified healthcare professional.
        </p>
      </div>

      {/* Edit Stack Modal */}
      <EditStackModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        currentStack={activeStack}
        onSave={handleSaveStack}
      />

      {/* Start Cycle dialog — lets users backdate when they actually started */}
      <Dialog open={startCycleDialogOpen} onOpenChange={setStartCycleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-primary" />
              Start tracking period{pendingCycle ? ` — ${pendingCycle.peptideName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cycle-start-date" className="text-sm">
              When did you actually start this peptide?
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Today', days: 0 },
                { label: '1 week ago', days: 7 },
                { label: '2 weeks ago', days: 14 },
                { label: '4 weeks ago', days: 28 },
              ].map(({ label, days }) => {
                const d = new Date();
                d.setDate(d.getDate() - days);
                const iso = d.toISOString().split('T')[0];
                const selected = pendingStartDate === iso;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPendingStartDate(iso)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      selected
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Input
              id="cycle-start-date"
              type="date"
              value={pendingStartDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPendingStartDate(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cycle-duration" className="text-xs text-muted-foreground">Recorded length (days)</Label>
                <Input
                  id="cycle-duration"
                  inputMode="numeric"
                  min="1"
                  type="number"
                  value={pendingDuration}
                  onChange={(e) => setPendingDuration(e.target.value)}
                  placeholder="From your plan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cycle-break-duration" className="text-xs text-muted-foreground">Recorded pause (optional)</Label>
                <Input
                  id="cycle-break-duration"
                  inputMode="numeric"
                  min="0"
                  type="number"
                  value={pendingBreakDuration}
                  onChange={(e) => setPendingBreakDuration(e.target.value)}
                  placeholder="From your plan"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter only values from your existing plan or research record. The app records these
              values and does not choose a length, pause or frequency for you.
            </p>
            {pendingCycle && (() => {
              const v = validateBackdate(
                pendingCycle.peptideId,
                pendingCycle.peptideName,
                pendingStartDate,
                pendingCycle.frequency,
                doses,
              );
              const tone = v.severity === 'warning'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-border bg-muted/30 text-muted-foreground';
              const Icon = v.severity === 'warning' ? AlertTriangle : Info;
              const reasonChip = (reason: string) => {
                if (reason === 'before_start') return 'before start';
                if (reason === 'over_frequency_for_week') return 'over-cadence';
                return 'past planned window';
              };
              return (
                <div className={cn('rounded-lg border p-2.5 text-[11px] leading-relaxed', tone)}>
                  <div className="flex items-start gap-2">
                    <Icon size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{v.message}</span>
                  </div>
                  {v.conflicts.length > 0 && (
                    <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                      {v.conflicts.map((c) => (
                        <li
                          key={c.doseId}
                          className="flex items-start justify-between gap-2 rounded border border-amber-500/20 bg-amber-500/5 p-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] text-amber-100">{c.date}{c.time ? ` ${c.time}` : ''}</span>
                              <span className="text-[10px] text-amber-200/90">{c.dose} {c.unit}</span>
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-amber-100">
                                {reasonChip(c.reason)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-amber-200/70">{c.detail}</p>
                          </div>
                          <a
                            href={`/?screen=daily-log&date=${c.date}&doseId=${c.doseId}`}
                            className="flex-shrink-0 self-center rounded border border-amber-400/40 px-1.5 py-0.5 text-[10px] text-amber-100 hover:bg-amber-500/15 active:scale-[0.97]"
                          >
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStartCycleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { void confirmStartCycle(); }} className="gap-2" disabled={periodsSyncing}>
              <Play size={14} /> Start tracking period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
