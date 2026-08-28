import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/services/storage';
import { enqueue as enqueueOffline } from '@/services/offlineQueue';

export interface DailyDoseEntry {
  id: string;
  date: string;
  peptide_id: string;
  peptide_name: string;
  dose: number;
  unit: 'mg' | 'IU' | 'units';
  time: string;
  notes?: string;
  user_id?: string;
}

function loadLocalDoses(): DailyDoseEntry[] {
  return getStoredData<DailyDoseEntry[]>(STORAGE_KEYS.DAILY_DOSES, []);
}

function saveLocalDoses(doses: DailyDoseEntry[]) {
  setStoredData(STORAGE_KEYS.DAILY_DOSES, doses);
}

export function useDailyDoses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doses, setDoses] = useState<DailyDoseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load doses from Supabase or localStorage
  const loadDoses = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const localBeforeCloud = loadLocalDoses();
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('daily_doses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const mappedDoses: DailyDoseEntry[] = (data || []).map(d => ({
          id: d.id,
          date: d.date,
          peptide_id: d.peptide_id,
          peptide_name: d.peptide_name,
          dose: Number(d.dose),
          unit: d.unit as 'mg' | 'IU' | 'units',
          time: String(d.time).slice(0, 5),
          notes: d.notes || undefined,
          user_id: d.user_id,
        }));

        // Preserve entries recorded locally while authentication or the network
        // was unavailable. Push only IDs not already present in the owner-scoped
        // cloud result, then keep one merged copy on this device.
        const cloudIds = new Set(mappedDoses.map((dose) => dose.id));
        const localOnly = localBeforeCloud.filter((dose) => !cloudIds.has(dose.id));
        if (localOnly.length > 0) {
          setIsSyncing(true);
          try {
            const { error: recoveryError } = await supabase.from('daily_doses').upsert(
              localOnly.map((dose) => ({
                id: dose.id,
                user_id: user.id,
                date: dose.date,
                peptide_id: dose.peptide_id,
                peptide_name: dose.peptide_name,
                dose: dose.dose,
                unit: dose.unit,
                time: dose.time,
                notes: dose.notes || null,
              })),
              { onConflict: 'id' },
            );
            if (recoveryError) throw recoveryError;
            toast({ title: 'Unsynced entries restored', description: `${localOnly.length} local ${localOnly.length === 1 ? 'entry is' : 'entries are'} now backed up.` });
          } finally {
            setIsSyncing(false);
          }
        }

        const merged = [...mappedDoses, ...localOnly]
          .filter((dose, index, all) => all.findIndex((item) => item.id === dose.id) === index);
        setDoses(merged);
        saveLocalDoses(merged);
      } else {
        // Use localStorage when not logged in (guest namespace)
        setDoses(loadLocalDoses());
      }
    } catch (error) {
      console.error('Error loading doses:', error);
      // Fallback to localStorage
      setDoses(loadLocalDoses());
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  // Reset in-memory state immediately when the user changes so a stale list
  // from a previous user never flashes on screen.
  useEffect(() => {
    setDoses([]);
    setIsLoading(true);
    loadDoses();
  }, [user?.id, loadDoses]);

  // Refresh immediately after the user accepts local-history recovery.
  useEffect(() => {
    const handleRecovered = () => { void loadDoses(); };
    window.addEventListener('rtd:local-history-recovered', handleRecovered);
    return () => window.removeEventListener('rtd:local-history-recovered', handleRecovered);
  }, [loadDoses]);

  // Cross-device changes appear without a manual refresh.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`daily-doses:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'tracker',
        table: 'daily_doses',
        filter: `user_id=eq.${user.id}`,
      }, () => { void loadDoses(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadDoses, user]);

  const addDose = useCallback(async (dose: Omit<DailyDoseEntry, 'id' | 'user_id'>) => {
    const newDose: DailyDoseEntry = {
      ...dose,
      id: crypto.randomUUID(),
    };

    try {
      if (user) {
        const row = {
          id: newDose.id,
          user_id: user.id,
          date: newDose.date,
          peptide_id: newDose.peptide_id,
          peptide_name: newDose.peptide_name,
          dose: newDose.dose,
          unit: newDose.unit,
          time: newDose.time,
          notes: newDose.notes || null,
        };
        try {
          const { error } = await supabase.from('daily_doses').insert(row);
          if (error) throw error;
        } catch (netErr) {
          const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
          if (!isOffline) throw netErr;
          console.warn('addDose offline — enqueuing');
          await enqueueOffline('daily_doses', 'insert', row);
        }
      }

      // Update local state and localStorage
      const updatedDoses = [...doses, newDose];
      setDoses(updatedDoses);
      saveLocalDoses(updatedDoses);

      // Notify cycle reminder scheduler to roll the next_fire_at forward.
      try {
        window.dispatchEvent(new CustomEvent('rtd:dose-logged', {
          detail: { peptideId: newDose.peptide_id, peptideName: newDose.peptide_name, date: newDose.date },
        }));
      } catch { /* noop */ }

      return newDose;
    } catch (error) {
      console.error('Error adding dose:', error);
      throw error;
    }
  }, [user, doses]);

  const updateDose = useCallback(async (doseId: string, updates: Partial<Pick<DailyDoseEntry, 'time' | 'notes' | 'dose' | 'unit'>>) => {
    try {
      if (user) {
        const patch = {
          ...(updates.time !== undefined && { time: updates.time }),
          ...(updates.notes !== undefined && { notes: updates.notes || null }),
          ...(updates.dose !== undefined && { dose: updates.dose }),
          ...(updates.unit !== undefined && { unit: updates.unit }),
        };
        try {
          const { error } = await supabase.from('daily_doses').update(patch).eq('id', doseId);
          if (error) throw error;
        } catch (netErr) {
          console.warn('updateDose offline — enqueuing', netErr);
          await enqueueOffline('daily_doses', 'update', patch, doseId);
        }
      }

      const updatedDoses = doses.map(d =>
        d.id === doseId ? { ...d, ...updates } : d
      );
      setDoses(updatedDoses);
      saveLocalDoses(updatedDoses);
    } catch (error) {
      console.error('Error updating dose:', error);
      throw error;
    }
  }, [user, doses]);

  const deleteDose = useCallback(async (doseId: string) => {
    try {
      if (user) {
        try {
          const { error } = await supabase.from('daily_doses').delete().eq('id', doseId);
          if (error) throw error;
        } catch (netErr) {
          console.warn('deleteDose offline — enqueuing', netErr);
          await enqueueOffline('daily_doses', 'delete', {}, doseId);
        }
      }

      const updatedDoses = doses.filter(d => d.id !== doseId);
      setDoses(updatedDoses);
      saveLocalDoses(updatedDoses);
    } catch (error) {
      console.error('Error deleting dose:', error);
      throw error;
    }
  }, [user, doses]);

  const getDosesForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return doses.filter(d => d.date === dateStr);
  }, [doses]);

  const getDosesForDateRange = useCallback((startDate: Date, endDate: Date) => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    return doses.filter(d => d.date >= startStr && d.date <= endStr);
  }, [doses]);

  return {
    doses,
    isLoading,
    isSyncing,
    isCloudEnabled: !!user,
    addDose,
    updateDose,
    deleteDose,
    getDosesForDate,
    getDosesForDateRange,
    refreshDoses: loadDoses,
  };
}
