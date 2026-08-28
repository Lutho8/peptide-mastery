import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCycles, replaceCycles, type Cycle } from '@/services/storage';
import { track } from '@/lib/analytics';

type TrackingPeriodRow = {
  id: string;
  user_id: string;
  peptide_id: string;
  peptide_name: string;
  recorded_amount: string;
  recorded_frequency: string;
  start_date: string;
  planned_duration_days: number;
  recorded_pause_days: number;
  status: string;
  notes: string | null;
  pause_reason: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  missed_days: number | null;
  split_parts: number | null;
  dose_times: string[];
  reminder_enabled: boolean;
  reminder_lead_minutes: number | null;
  updated_at: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeLocalCycle(cycle: Cycle): Cycle {
  return {
    ...cycle,
    id: UUID_PATTERN.test(cycle.id) ? cycle.id : crypto.randomUUID(),
    updatedAt: cycle.updatedAt || new Date().toISOString(),
  };
}

function rowToCycle(row: TrackingPeriodRow): Cycle {
  return {
    id: row.id,
    peptideId: row.peptide_id,
    peptideName: row.peptide_name,
    dose: row.recorded_amount,
    frequency: row.recorded_frequency,
    startDate: row.start_date,
    plannedDuration: row.planned_duration_days,
    breakDuration: row.recorded_pause_days,
    status: row.status as Cycle['status'],
    notes: row.notes || undefined,
    pauseReason: (row.pause_reason || undefined) as Cycle['pauseReason'],
    pausedAt: row.paused_at || undefined,
    resumedAt: row.resumed_at || undefined,
    missedDays: row.missed_days ?? undefined,
    splitParts: row.split_parts ?? undefined,
    doseTimes: row.dose_times || [],
    reminderEnabled: row.reminder_enabled,
    reminderLeadMinutes: row.reminder_lead_minutes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function cycleToRow(cycle: Cycle, userId: string) {
  return {
    id: cycle.id,
    user_id: userId,
    peptide_id: cycle.peptideId,
    peptide_name: cycle.peptideName,
    recorded_amount: cycle.dose,
    recorded_frequency: cycle.frequency,
    start_date: cycle.startDate,
    planned_duration_days: cycle.plannedDuration,
    recorded_pause_days: cycle.breakDuration,
    status: cycle.status,
    notes: cycle.notes || null,
    pause_reason: cycle.pauseReason || null,
    paused_at: cycle.pausedAt || null,
    resumed_at: cycle.resumedAt || null,
    missed_days: cycle.missedDays ?? null,
    split_parts: cycle.splitParts ?? null,
    dose_times: cycle.doseTimes || [],
    reminder_enabled: cycle.reminderEnabled ?? false,
    reminder_lead_minutes: cycle.reminderLeadMinutes ?? null,
    updated_at: cycle.updatedAt || new Date().toISOString(),
  };
}

function newest(a: Cycle, b: Cycle): Cycle {
  const aTime = new Date(a.updatedAt || 0).getTime();
  const bTime = new Date(b.updatedAt || 0).getTime();
  return aTime >= bTime ? a : b;
}

export function useTrackingPeriods() {
  const { user } = useAuth();
  const userId = user?.id;
  const [periods, setPeriods] = useState<Cycle[]>(() => getCycles().map(normalizeLocalCycle));
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const local = getCycles().map(normalizeLocalCycle);
    if (!userId) {
      replaceCycles(local);
      setPeriods(local);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: readError } = await supabase
        .from('tracking_periods')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      if (readError) throw readError;

      const cloud = ((data || []) as TrackingPeriodRow[]).map(rowToCycle);
      const merged = new Map<string, Cycle>();
      cloud.forEach((period) => merged.set(period.id, period));
      local.forEach((period) => merged.set(period.id, merged.has(period.id) ? newest(period, merged.get(period.id)!) : period));
      const combined = [...merged.values()].sort((a, b) => b.startDate.localeCompare(a.startDate));

      const cloudById = new Map(cloud.map((period) => [period.id, period]));
      const localChanges = combined.filter((period) => {
        const cloudPeriod = cloudById.get(period.id);
        if (!cloudPeriod) return true;
        return new Date(period.updatedAt || 0).getTime() > new Date(cloudPeriod.updatedAt || 0).getTime();
      });
      if (localChanges.length > 0) {
        setIsSyncing(true);
        const { error: writeError } = await supabase
          .from('tracking_periods')
          .upsert(localChanges.map((period) => cycleToRow(period, userId)), { onConflict: 'id' });
        if (writeError) throw writeError;
        if (cloud.length === 0 && local.length > 0) {
          track('tracking_periods_cloud_recovered', { count: local.length });
        }
      }

      replaceCycles(combined);
      setPeriods(combined);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Tracking periods could not be synced';
      setError(message);
      replaceCycles(local);
      setPeriods(local);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`tracking-periods:${userId}:${crypto.randomUUID()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'tracker',
        table: 'tracking_periods',
        filter: `user_id=eq.${userId}`,
      }, () => { void refresh(); })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn(`[Tracking periods] Realtime ${status.toLowerCase()}`);
      });
    return () => { void supabase.removeChannel(channel).catch(() => undefined); };
  }, [refresh, userId]);

  const createPeriod = useCallback(async (period: Omit<Cycle, 'id' | 'updatedAt'>) => {
    const next: Cycle = { ...period, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    const updated = [next, ...periods];
    replaceCycles(updated);
    setPeriods(updated);
    if (userId) {
      setIsSyncing(true);
      const { error: writeError } = await supabase.from('tracking_periods').insert(cycleToRow(next, userId));
      setIsSyncing(false);
      if (writeError) {
        setError(writeError.message);
        throw writeError;
      }
    }
    return next;
  }, [periods, userId]);

  const updatePeriod = useCallback(async (period: Cycle) => {
    const next = { ...period, updatedAt: new Date().toISOString() };
    const updated = periods.map((item) => item.id === next.id ? next : item);
    replaceCycles(updated);
    setPeriods(updated);
    if (userId) {
      setIsSyncing(true);
      const { error: writeError } = await supabase
        .from('tracking_periods')
        .upsert(cycleToRow(next, userId), { onConflict: 'id' });
      setIsSyncing(false);
      if (writeError) {
        setError(writeError.message);
        throw writeError;
      }
    }
    return next;
  }, [periods, userId]);

  return { periods, isLoading, isSyncing, error, refresh, createPeriod, updatePeriod };
}
