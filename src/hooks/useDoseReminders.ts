import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  scheduleNotification, 
  cancelNotification, 
  getNotificationPermission,
  isNotificationSupported 
} from '@/services/notifications';
import { getNotificationSettings, getStoredData, setStoredData, STORAGE_KEYS } from '@/services/storage';
import {
  replaceWeeklyRemindersInIndexedDB,
  deleteReminderFromIndexedDB,
  saveReminderToIndexedDB,
  forceSyncAndCheck,
  registerServiceWorker,
  requestPushPermission,
  type ScheduledReminder 
} from '@/services/pushScheduler';

export interface DoseReminder {
  id: string;
  peptide_id: string;
  peptide_name: string;
  dose: string;
  time: string;
  days: string[];
  enabled: boolean;
  user_id?: string;
  email_notification_enabled?: boolean;
}

function loadLocalReminders(): DoseReminder[] {
  return getStoredData<DoseReminder[]>(STORAGE_KEYS.SCHEDULED_REMINDERS, []);
}

function saveLocalReminders(reminders: DoseReminder[]) {
  setStoredData(STORAGE_KEYS.SCHEDULED_REMINDERS, reminders);
  
  // Also sync to IndexedDB for service worker
  syncToIndexedDB(reminders);
}

// Sync reminders to IndexedDB for service worker background notifications
async function syncToIndexedDB(reminders: DoseReminder[]) {
  try {
    const scheduledReminders: ScheduledReminder[] = reminders.map(r => ({
      id: r.id,
      peptideId: r.peptide_id,
      peptideName: r.peptide_name,
      dose: r.dose,
      time: r.time,
      days: r.days || [],
      enabled: r.enabled,
    }));
    
    await replaceWeeklyRemindersInIndexedDB(scheduledReminders);
  } catch (error) {
    console.error('Error syncing to IndexedDB:', error);
  }
}

export function useDoseReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<DoseReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reminders from Supabase or localStorage
  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('dose_reminders')
          .select('*')
          .order('time', { ascending: true });

        if (error) throw error;

        const mappedReminders: DoseReminder[] = (data || []).map(r => ({
          id: r.id,
          peptide_id: r.peptide_id,
          peptide_name: r.peptide_name,
          dose: r.dose,
          time: r.time,
          days: r.days || [],
          enabled: r.enabled,
          user_id: r.user_id,
          email_notification_enabled: r.email_notification_enabled ?? false,
        }));

        setReminders(mappedReminders);
        saveLocalReminders(mappedReminders);
      } else {
        setReminders(loadLocalReminders());
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders(loadLocalReminders());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Schedule notifications for today based on reminders
  const scheduleRemindersForToday = useCallback(() => {
    if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
      return;
    }

    const settings = getNotificationSettings();
    if (!settings.enabled) return;

    const today = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[today.getDay()];

    reminders.forEach(reminder => {
      if (!reminder.enabled) return;
      
      // Check if today is one of the scheduled days (empty means every day)
      if (reminder.days.length > 0 && !reminder.days.includes(currentDay)) {
        return;
      }

      scheduleNotification(
        reminder.id,
        reminder.peptide_name,
        reminder.dose,
        reminder.time
      );
    });
  }, [reminders]);

  // Re-schedule when reminders change
  useEffect(() => {
    scheduleRemindersForToday();
  }, [scheduleRemindersForToday]);

  // Ensure browser notification permission has been requested and the SW is
  // registered, so reminders saved here actually fire later. Returns true if
  // notifications can be delivered.
  const ensureNotificationsReady = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      await registerServiceWorker();
    } catch {
      // ignore — sw may already be registered
    }
    if (Notification.permission === 'default') {
      const granted = await requestPushPermission();
      if (!granted) {
        toast.error('Enable notifications in your browser to receive dose reminders');
        return false;
      }
    } else if (Notification.permission === 'denied') {
      toast.error('Notifications blocked. Enable them in your browser settings.');
      return false;
    }
    return true;
  }, []);

  const addReminder = useCallback(async (reminder: Omit<DoseReminder, 'id' | 'user_id'>) => {
    const newReminder: DoseReminder = {
      ...reminder,
      id: crypto.randomUUID(),
    };

    try {
      if (user) {
        const { error } = await supabase.from('dose_reminders').insert({
          id: newReminder.id,
          user_id: user.id,
          peptide_id: newReminder.peptide_id,
          peptide_name: newReminder.peptide_name,
          dose: newReminder.dose,
          time: newReminder.time,
          days: newReminder.days,
          enabled: newReminder.enabled,
        });

        if (error) throw error;
      }

      const updated = [...reminders, newReminder];
      setReminders(updated);
      saveLocalReminders(updated);

      // Make sure the SW is ready and immediately schedule this reminder.
      await ensureNotificationsReady();
      await saveReminderToIndexedDB({
        id: newReminder.id,
        peptideId: newReminder.peptide_id,
        peptideName: newReminder.peptide_name,
        dose: newReminder.dose,
        time: newReminder.time,
        days: newReminder.days || [],
        enabled: newReminder.enabled,
      });
      await forceSyncAndCheck();

      toast.success('Reminder created');
      return newReminder;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }, [user, reminders, ensureNotificationsReady]);

  // Bulk add reminders (for cycle import)
  const bulkAddReminders = useCallback(async (newReminders: Omit<DoseReminder, 'id' | 'user_id'>[]) => {
    const remindersWithIds: DoseReminder[] = newReminders.map(r => ({
      ...r,
      id: crypto.randomUUID(),
    }));

    try {
      if (user) {
        const insertData = remindersWithIds.map(r => ({
          id: r.id,
          user_id: user.id,
          peptide_id: r.peptide_id,
          peptide_name: r.peptide_name,
          dose: r.dose,
          time: r.time,
          days: r.days,
          enabled: r.enabled,
        }));

        const { error } = await supabase.from('dose_reminders').insert(insertData);
        if (error) throw error;
      }

      const updated = [...reminders, ...remindersWithIds];
      setReminders(updated);
      saveLocalReminders(updated);

      toast.success(`${remindersWithIds.length} reminder${remindersWithIds.length > 1 ? 's' : ''} created`);

      await ensureNotificationsReady();
      await forceSyncAndCheck();

      return remindersWithIds;
    } catch (error) {
      console.error('Error bulk adding reminders:', error);
      throw error;
    }
  }, [user, reminders, ensureNotificationsReady]);

  const updateReminder = useCallback(async (id: string, updates: Partial<DoseReminder>) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('dose_reminders')
          .update({
            peptide_id: updates.peptide_id,
            peptide_name: updates.peptide_name,
            dose: updates.dose,
            time: updates.time,
            days: updates.days,
            enabled: updates.enabled,
            email_notification_enabled: updates.email_notification_enabled,
          })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = reminders.map(r => 
        r.id === id ? { ...r, ...updates } : r
      );
      setReminders(updated);
      saveLocalReminders(updated);

      const updatedReminder = updated.find(r => r.id === id);
      if (updatedReminder) {
        await saveReminderToIndexedDB({
          id: updatedReminder.id,
          peptideId: updatedReminder.peptide_id,
          peptideName: updatedReminder.peptide_name,
          dose: updatedReminder.dose,
          time: updatedReminder.time,
          days: updatedReminder.days || [],
          enabled: updatedReminder.enabled,
        });
      }
      await forceSyncAndCheck();
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }, [user, reminders]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newEnabled = !reminder.enabled;

    try {
      if (user) {
        const { error } = await supabase
          .from('dose_reminders')
          .update({ enabled: newEnabled })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = reminders.map(r => 
        r.id === id ? { ...r, enabled: newEnabled } : r
      );
      setReminders(updated);
      saveLocalReminders(updated);

      // Push the new enabled state into IDB so the SW reschedules immediately.
      await saveReminderToIndexedDB({
        id: reminder.id,
        peptideId: reminder.peptide_id,
        peptideName: reminder.peptide_name,
        dose: reminder.dose,
        time: reminder.time,
        days: reminder.days || [],
        enabled: newEnabled,
      });

      if (newEnabled) {
        await ensureNotificationsReady();
      } else {
        const today = new Date();
        const notificationId = `${id}-${reminder.time}-${today.toDateString()}`;
        cancelNotification(notificationId);
      }
      await forceSyncAndCheck();
    } catch (error) {
      console.error('Error toggling reminder:', error);
      throw error;
    }
  }, [user, reminders, ensureNotificationsReady]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('dose_reminders')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // Cancel any scheduled notification
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        const today = new Date();
        const notificationId = `${id}-${reminder.time}-${today.toDateString()}`;
        cancelNotification(notificationId);
      }

      // Also delete from IndexedDB for service worker
      await deleteReminderFromIndexedDB(id);

      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      saveLocalReminders(updated);

      toast.success('Reminder deleted');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }, [user, reminders]);

  return {
    reminders,
    isLoading,
    isCloudEnabled: !!user,
    addReminder,
    bulkAddReminders,
    updateReminder,
    toggleReminder,
    deleteReminder,
    refreshReminders: loadReminders,
    scheduleRemindersForToday,
  };
}
