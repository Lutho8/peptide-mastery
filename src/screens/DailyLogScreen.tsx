import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays } from 'date-fns';
import { peptides } from '@/data/peptides';
import { findPeptideOrBlend, getAllSelectablePeptides } from '@/data/blendAdapters';
import { GradientCard } from '@/components/ui/GradientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Syringe, Trash2, Calendar, Cloud, CloudOff, Loader2, BarChart3, Pencil, ArrowUpDown, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDailyDoses } from '@/hooks/useDailyDoses';
import { useSwipeNav } from '@/hooks/useSwipeNav';
import { DoseSummary } from '@/components/doses/DoseSummary';
import { QuickAddReminderButton } from '@/components/doses/QuickAddReminderButton';
import { UnitToggle } from '@/components/doses/UnitToggle';
import { DoseLoggedAnimation } from '@/components/doses/DoseLoggedAnimation';
import { EditDoseModal } from '@/components/doses/EditDoseModal';
import { LastDoseRecall } from '@/components/doses/LastDoseRecall';
import type { DailyDoseEntry } from '@/hooks/useDailyDoses';
import { logAudit } from '@/lib/auditLog';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';

const doseEntrySchema = z.object({
  peptideId: z.string().min(1, 'Please select a peptide'),
  dose: z.number().min(0.001, 'Dose must be greater than 0').max(10000, 'Dose seems too high'),
  unit: z.enum(['mg', 'IU', 'units']),
  time: z.string().min(1, 'Please enter a time'),
  notes: z.string().max(200, 'Notes must be less than 200 characters').optional(),
});

type SortOrder = 'asc' | 'desc';

interface DailyLogScreenProps {
  onOpenMeasurement?: () => void;
}

export function DailyLogScreen({ onOpenMeasurement }: DailyLogScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { doses, isLoading, isSyncing, isCloudEnabled, addDose, updateDose, deleteDose, getDosesForDate } = useDailyDoses();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDoseLoggedAnimation, setShowDoseLoggedAnimation] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingDose, setEditingDose] = useState<typeof doses[0] | null>(null);
  const [formData, setFormData] = useState({
    peptideId: '',
    dose: '',
    unit: 'mg' as 'mg' | 'IU' | 'units',
    time: format(new Date(), 'HH:mm'),
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [highlightedDoseId, setHighlightedDoseId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const viewTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || viewTrackedRef.current === user.id) return;
    viewTrackedRef.current = user.id;
    track('dose_history_viewed', { source: 'dashboard_tab' });
    void supabase.from('journey_events').insert({
      user_id: user.id,
      event_name: 'dose_history_viewed',
      source: 'dashboard',
      context: {},
    }).then(({ error }) => {
      if (error) console.warn('[Journey] Dose-history event was not recorded:', error.message);
    });
  }, [user]);

  // Deep-link support: `?date=YYYY-MM-DD&doseId=...` from the MyStack backdate
  // conflict list → jump to that day and flash the matching log row.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dateStr = params.get('date');
      const doseId = params.get('doseId');
      if (dateStr) {
        const parsed = new Date(dateStr + 'T00:00:00');
        if (!isNaN(parsed.getTime())) {
          setSelectedDate(parsed);
          setCurrentMonth(parsed);
        }
      }
      if (doseId) {
        setHighlightedDoseId(doseId);
        if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = window.setTimeout(() => setHighlightedDoseId(null), 4000);
      }
    } catch { /* noop */ }
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const handleDoseAnimationComplete = useCallback(() => setShowDoseLoggedAnimation(false), []);

  const swipeBind = useSwipeNav({
    onSwipeLeft: () => setSelectedDate((d) => addDays(d, 1)),
    onSwipeRight: () => setSelectedDate((d) => subDays(d, 1)),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);
  const selectablePeptides = useMemo(() => getAllSelectablePeptides(), []);
  const individualPeptides = useMemo(
    () => selectablePeptides.filter((peptide) => !peptide.isBlend),
    [selectablePeptides]
  );
  const blendOptions = useMemo(
    () => selectablePeptides.filter((peptide) => peptide.isBlend),
    [selectablePeptides]
  );
  const selectedPeptide = useMemo(
    () => selectablePeptides.find((peptide) => peptide.id === formData.peptideId) ?? null,
    [formData.peptideId, selectablePeptides]
  );

  const selectedDateDoses = useMemo(() => {
    const dayDoses = getDosesForDate(selectedDate);
    return [...dayDoses].sort((a, b) => {
      const cmp = a.time.localeCompare(b.time);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [selectedDate, getDosesForDate, sortOrder]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleAddDose = async () => {
    setFormErrors({});
    
    const peptide = findPeptideOrBlend(formData.peptideId);
    const doseNumber = parseFloat(formData.dose);

    const result = doseEntrySchema.safeParse({
      peptideId: formData.peptideId,
      dose: isNaN(doseNumber) ? 0 : doseNumber,
      unit: formData.unit,
      time: formData.time,
      notes: formData.notes || undefined,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    try {
      await addDose({
        date: format(selectedDate, 'yyyy-MM-dd'),
        peptide_id: formData.peptideId,
        peptide_name: peptide?.shortName || formData.peptideId,
        dose: doseNumber,
        unit: formData.unit,
        time: formData.time,
        notes: formData.notes || undefined,
      });

      void logAudit({
        action: 'dose.create',
        entityType: 'daily_dose',
        entityId: formData.peptideId,
        metadata: {
          peptide_id: formData.peptideId,
          peptide_name: peptide?.shortName,
          dose: doseNumber,
          unit: formData.unit,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: formData.time,
        },
      });

      // Trigger haptic + animation
      setShowDoseLoggedAnimation(true);
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }

      toast({
        title: 'Dose logged',
        description: `${peptide?.shortName} ${doseNumber}${formData.unit} added for ${format(selectedDate, 'MMM d')}`,
      });

      setIsAddModalOpen(false);
      setFormData({
        peptideId: '',
        dose: '',
        unit: 'mg',
        time: format(new Date(), 'HH:mm'),
        notes: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save dose',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDose = async (doseId: string) => {
    try {
      await deleteDose(doseId);
      void logAudit({ action: 'dose.delete', entityType: 'daily_dose', entityId: doseId });
      toast({
        title: 'Dose deleted',
        description: 'Entry removed from your log',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete dose',
        variant: 'destructive',
      });
    }
  };

  const handleEditSave = async (doseId: string, updates: { time?: string; notes?: string; dose?: number; unit?: 'mg' | 'IU' | 'units' }) => {
    try {
      await updateDose(doseId, updates);
      void logAudit({
        action: 'dose.update',
        entityType: 'daily_dose',
        entityId: doseId,
        metadata: updates as Record<string, unknown>,
      });
      toast({
        title: 'Dose updated',
        description: 'Changes saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update dose',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getCategoryColor = (peptideId: string) => {
    const peptide = findPeptideOrBlend(peptideId);
    if (!peptide) return 'bg-muted';
    const colors: Record<string, string> = {
      'immune': 'bg-indigo-500',
      'longevity': 'bg-emerald-500',
      'cognitive': 'bg-cyan-500',
      'metabolic': 'bg-red-500',
      'healing': 'bg-orange-500',
      'gh-secretagogue': 'bg-violet-500',
      'weight-loss': 'bg-pink-500',
      'anti-aging': 'bg-lime-500',
      'skin-hair': 'bg-rose-500',
      'hormonal': 'bg-amber-500',
      'bioregulators': 'bg-sky-500',
    };
    return colors[peptide.category] || 'bg-muted';
  };

  const getDosesForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return doses.filter(d => d.date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground mt-3">Loading your doses...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-foreground">Daily Dose Log</h1>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : isCloudEnabled ? (
            <Cloud size={16} className="text-primary" />
          ) : (
            <CloudOff size={16} className="text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {isCloudEnabled ? 'Synced' : 'Local'}
          </span>
        </div>
      </div>

      {/* Last dose recall — quick "when did I last take X" reminder */}
      <LastDoseRecall
        doses={doses}
        onRepeat={(d: DailyDoseEntry) => {
          setFormData({
            peptideId: d.peptide_id,
            dose: String(d.dose),
            unit: d.unit,
            time: format(new Date(), 'HH:mm'),
            notes: d.notes ?? '',
          });
          setSelectedDate(new Date());
          setIsAddModalOpen(true);
        }}
      />

      {/* View Toggle */}
      <div className="flex gap-2">

        <Button
          variant={showSummary ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowSummary(false)}
          className="flex-1"
        >
          <Calendar size={16} className="mr-1" />
          Calendar
        </Button>
        <Button
          variant={showSummary ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowSummary(true)}
          className="flex-1"
        >
          <BarChart3 size={16} className="mr-1" />
          Summary
        </Button>
      </div>

      {showSummary ? (
        <DoseSummary doses={doses} currentDate={selectedDate} />
      ) : (
        <>
          {/* Month Navigation */}
          <GradientCard className="p-3">
            <div {...swipeBind}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} className="text-muted-foreground" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="h-12 sm:h-14" />
              ))}
              {daysInMonth.map((day) => {
                const dayDoses = getDosesForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const hasDoses = dayDoses.length > 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
                      isSelected && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                      !isSelected && isToday(day) && "bg-primary/20 text-primary",
                      !isSelected && !isToday(day) && "hover:bg-muted text-foreground",
                    )}
                  >
                    <span className={cn("font-medium", isSelected && "font-bold")}>
                      {format(day, 'd')}
                    </span>
                    {hasDoses && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayDoses.slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              isSelected ? "bg-primary-foreground" : "bg-primary"
                            )}
                          />
                        ))}
                        {dayDoses.length > 3 && (
                          <span className="text-[8px]">+</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            </div>
          </GradientCard>

          {/* Selected Date Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="flex items-center gap-2">
                {selectedDateDoses.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown size={14} />
                    {sortOrder === 'asc' ? 'Earliest' : 'Latest'}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="gap-1"
                >
                  <Plus size={16} />
                  Add Dose
                </Button>
              </div>
            </div>

            {selectedDateDoses.length === 0 ? (
              <GradientCard className="text-center py-8">
                <Syringe size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No doses logged for this day</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Log your first dose
                </Button>
              </GradientCard>
            ) : (
              <div className="space-y-2">
                {selectedDateDoses.map((dose) => (
                  <div
                    key={dose.id}
                    id={`dose-${dose.id}`}
                    ref={(el) => {
                      if (el && highlightedDoseId === dose.id) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className={cn(
                      'rounded-2xl transition-all',
                      highlightedDoseId === dose.id && 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20 animate-pulse',
                    )}
                  >
                  <GradientCard className="flex items-center gap-3">
                    <div className={cn("w-2 h-10 rounded-full", getCategoryColor(dose.peptide_id))} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{dose.peptide_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {dose.dose} {dose.unit}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dose.time}
                        {dose.notes && <span className="ml-2">• {dose.notes}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingDose(dose)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      title="Edit dose"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDose(dose.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </GradientCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Dose Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Log Dose for {format(selectedDate, 'MMM d, yyyy')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="space-y-2">
              <Label>Peptide</Label>
              <Select
                value={formData.peptideId}
                onValueChange={(val) => setFormData(prev => ({ ...prev, peptideId: val }))}
              >
                  <SelectTrigger className={cn(formErrors.peptideId && "border-destructive")}>
                    <SelectValue placeholder="Select peptide or blend..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                    <SelectGroup>
                      <SelectLabel>Individual Peptides</SelectLabel>
                      {individualPeptides.map((peptide) => (
                        <SelectItem key={peptide.id} value={peptide.id}>
                          {peptide.shortName} - {peptide.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {blendOptions.length > 0 && (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Blends & Stacks</SelectLabel>
                          {blendOptions.map((peptide) => (
                            <SelectItem key={peptide.id} value={peptide.id}>
                              <span className="flex items-center gap-2">
                                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                                <span>{peptide.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}
                </SelectContent>
              </Select>
              {formErrors.peptideId && (
                <p className="text-xs text-destructive">{formErrors.peptideId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 250"
                  value={formData.dose}
                  onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                  className={cn(formErrors.dose && "border-destructive")}
                />
                {formErrors.dose && (
                  <p className="text-xs text-destructive">{formErrors.dose}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <UnitToggle
                  value={formData.unit}
                  onChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className={cn(formErrors.time && "border-destructive")}
              />
              {formErrors.time && (
                <p className="text-xs text-destructive">{formErrors.time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. Pre-workout, fasted, etc."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                maxLength={200}
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              This form records the amount you enter; it does not select an amount for you.
              {onOpenMeasurement && (
                <button type="button" className="ml-1 font-semibold text-primary hover:underline" onClick={() => { setIsAddModalOpen(false); onOpenMeasurement(); }}>
                  Open the U-40/U-100 Measurement Tool
                </button>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0 border-t pt-4">
            <div className="flex-1">
              {formData.peptideId && formData.dose && formData.time && (
                <QuickAddReminderButton
                  peptideId={formData.peptideId}
                  peptideName={selectedPeptide?.shortName || formData.peptideId}
                  dose={formData.dose}
                  unit={formData.unit}
                  time={formData.time}
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDose}>
                <Plus size={16} className="mr-1" />
                Add Dose
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dose Modal */}
      <EditDoseModal
        dose={editingDose}
        open={!!editingDose}
        onOpenChange={(open) => { if (!open) setEditingDose(null); }}
        onSave={handleEditSave}
      />

      {/* Success Animation Overlay */}
      <DoseLoggedAnimation
        show={showDoseLoggedAnimation}
        onComplete={handleDoseAnimationComplete}
      />
    </div>
  );
}
