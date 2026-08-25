import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradientCard } from '@/components/ui/GradientCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getDoseSchedules, 
  saveDoseSchedule,
  saveDoseLog,
  deleteDoseSchedule,
  DoseSchedule,
  DoseLog,
} from '@/services/storage';
import { 
  isNotificationEnabledForSchedule,
  enableNotificationForSchedule,
  disableNotificationForSchedule,
  scheduleNotification
} from '@/services/notifications';
import { peptides } from '@/data/peptides';
import { getAllSelectablePeptides } from '@/data/blendAdapters';
import { FlaskConical } from 'lucide-react';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { Plus, Check, X, ChevronLeft, ChevronRight, Clock, Calendar, Bell, BellOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DoseTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: '2x-week', label: '2x/week' },
  { value: '3x-week', label: '3x/week' },
  { value: 'custom', label: 'Custom' },
] as const;

type FrequencyValue = typeof frequencies[number]['value'];

export function DoseTrackerModal({ open, onOpenChange }: DoseTrackerModalProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [doses, setDoses] = useState<DoseSchedule[]>([]);
  // New schedule form state
  const [newPeptideId, setNewPeptideId] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newFrequency, setNewFrequency] = useState<FrequencyValue>('daily');
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDoses(getDoseSchedules());
    }
  }, [open]);

  const handleMarkTaken = (dose: DoseSchedule) => {
    const updatedDoses = doses.map(d => 
      d.id === dose.id ? { ...d, status: 'taken' as const } : d
    );
    setDoses(updatedDoses);

    const log: DoseLog = {
      id: `log-${Date.now()}`,
      scheduleId: dose.id,
      peptideId: dose.peptideId,
      peptideName: dose.peptideName,
      dose: dose.dose,
      scheduledTime: dose.time,
      actualTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'taken',
      date: new Date().toISOString().split('T')[0],
    };
    saveDoseLog(log);
    
    toast({
      title: "Dose logged",
      description: `${dose.peptideName} marked as taken.`,
    });
  };

  const handleMarkSkipped = (dose: DoseSchedule) => {
    const updatedDoses = doses.map(d => 
      d.id === dose.id ? { ...d, status: 'skipped' as const } : d
    );
    setDoses(updatedDoses);

    const log: DoseLog = {
      id: `log-${Date.now()}`,
      scheduleId: dose.id,
      peptideId: dose.peptideId,
      peptideName: dose.peptideName,
      dose: dose.dose,
      scheduledTime: dose.time,
      status: 'skipped',
      date: new Date().toISOString().split('T')[0],
    };
    saveDoseLog(log);
  };

  const handleToggleNotification = (dose: DoseSchedule) => {
    const isEnabled = isNotificationEnabledForSchedule(dose.id);
    if (isEnabled) {
      disableNotificationForSchedule(dose.id);
    } else {
      enableNotificationForSchedule(dose.id);
      scheduleNotification(dose.id, dose.peptideName, dose.dose, dose.time);
    }
    setDoses([...doses]);
  };

  const handleAddSchedule = () => {
    if (!newPeptideId || !newDose || !newTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const allSelectable = getAllSelectablePeptides();
    const match = allSelectable.find(p => p.id === newPeptideId);
    if (!match) return;

    const newSchedule: DoseSchedule = {
      id: `schedule-${Date.now()}`,
      peptideId: newPeptideId,
      peptideName: match.name,
      dose: newDose,
      frequency: newFrequency,
      time: newTime,
      status: 'pending',
    };

    saveDoseSchedule(newSchedule);
    setDoses([...doses, newSchedule]);
    
    // Reset form
    setNewPeptideId('');
    setNewDose('');
    setNewTime('09:00');
    setNewFrequency('daily');
    setShowAddSchedule(false);

    toast({
      title: "Schedule added",
      description: `${match.name} scheduled at ${newTime}.`,
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    deleteDoseSchedule(scheduleId);
    setDoses(doses.filter(d => d.id !== scheduleId));
    toast({
      title: "Schedule removed",
      description: "The dose schedule has been deleted.",
    });
  };

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Daily Dose Tracker</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Notification Settings Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Bell size={16} />
            {showSettings ? 'Hide' : 'Show'} Notification Settings
          </Button>

          {showSettings && <NotificationSettings />}

          {/* Weekly Calendar View */}
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft size={18} />
            </Button>
            <span className="font-medium text-foreground">This Week</span>
            <Button variant="ghost" size="icon">
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="flex gap-2">
            {weekDays.map((day, index) => {
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + index);
              const isToday = dayDate.toDateString() === today.toDateString();
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-center transition-all",
                    selectedDay === index
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-primary/20 text-primary"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  <p className="text-xs font-medium">{day}</p>
                  <p className="text-lg font-bold">{dayDate.getDate()}</p>
                </button>
              );
            })}
          </div>

          {/* Add Schedule Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowAddSchedule(!showAddSchedule)}
          >
            <Plus size={16} />
            Add New Schedule
          </Button>

          {/* Add Schedule Form */}
          {showAddSchedule && (
            <GradientCard className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Peptide Name *</Label>
                  <Select value={newPeptideId} onValueChange={setNewPeptideId}>
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Select peptide or blend..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const all = getAllSelectablePeptides();
                        return (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Peptides</div>
                            {all.filter(p => !p.isBlend).map((peptide) => (
                              <SelectItem key={peptide.id} value={peptide.id}>
                                {peptide.name} ({peptide.shortName})
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-1 pt-1.5">Blends & Stacks</div>
                            {all.filter(p => p.isBlend).map((peptide) => (
                              <SelectItem key={peptide.id} value={peptide.id}>
                                <span className="flex items-center gap-1.5">
                                  <FlaskConical className="w-3 h-3 text-purple-400" />
                                  {peptide.name}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dose Amount *</Label>
                  <Input 
                    placeholder="e.g., 500mcg" 
                    className="bg-muted"
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time *</Label>
                  <Input 
                    type="time" 
                    className="bg-muted"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Frequency</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {frequencies.map((freq) => (
                      <button
                        key={freq.value}
                        onClick={() => setNewFrequency(freq.value)}
                        className={cn(
                          "py-2 rounded-lg text-xs transition-all",
                          newFrequency === freq.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary/20"
                        )}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleAddSchedule}>
                Add Schedule
              </Button>
            </GradientCard>
          )}

          {/* Today's Doses */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Today's Schedule</h3>
            <div className="space-y-3">
              {doses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No doses scheduled. Add your first schedule above.
                </p>
              ) : (
                doses.map((dose) => {
                  const notificationEnabled = isNotificationEnabledForSchedule(dose.id);
                  return (
                    <GradientCard key={dose.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Clock size={18} className="text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{dose.peptideName}</h4>
                            <p className="text-xs text-muted-foreground">{dose.time} • {dose.dose}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleNotification(dose)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              notificationEnabled 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            )}
                            title={notificationEnabled ? "Notifications on" : "Notifications off"}
                          >
                            {notificationEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(dose.id)}
                            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                            title="Delete schedule"
                          >
                            <Trash2 size={14} />
                          </button>
                          <StatusBadge status={dose.status} />
                        </div>
                      </div>

                      {dose.status === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleMarkTaken(dose)}
                          >
                            <Check size={14} />
                            Mark Taken
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleMarkSkipped(dose)}
                          >
                            <X size={14} />
                            Skip
                          </Button>
                        </div>
                      )}
                    </GradientCard>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary */}
          <GradientCard variant="primary" className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span className="text-sm text-foreground">Daily Summary</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {doses.filter(d => d.status === 'taken').length}/{doses.length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </GradientCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
