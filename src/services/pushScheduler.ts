// IndexedDB-based push notification scheduler for service worker
import { getStoredData, STORAGE_KEYS } from './storage';

const DB_NAME = 'peptide-reminders-db';
const DB_VERSION = 2;
const STORE_NAME = 'scheduled-reminders';

export interface ScheduledReminder {
  id: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  time: string; // HH:MM
  days: string[];
  enabled: boolean;
  nextFireTime?: number; // Unix timestamp
  isSnooze?: boolean;
  /** 'weekly' (legacy time+days) or 'computed' (absolute next_fire_at, no auto-roll). */
  mode?: 'weekly' | 'computed';
  cycleId?: string;
  leadMinutes?: number;
  splitIndex?: number;
  /** Optional context for SW to use as notification body. */
  body?: string;
}

// Service worker registration reference
let swRegistration: ServiceWorkerRegistration | null = null;

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create reminders store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('nextFireTime', 'nextFireTime', { unique: false });
        store.createIndex('enabled', 'enabled', { unique: false });
      }
      
      // Create fired notifications store
      if (!db.objectStoreNames.contains('fired-notifications')) {
        const firedStore = db.createObjectStore('fired-notifications', { keyPath: 'id' });
        firedStore.createIndex('firedAt', 'firedAt', { unique: false });
      }
    };
  });
}

// Calculate next fire time for a reminder
function calculateNextFireTime(time: string, days: string[]): number {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(hours, minutes, 0, 0);
    
    // Skip if in the past (with 1 min buffer)
    if (checkDate.getTime() <= now.getTime() + 60000) continue;
    
    const dayName = dayNames[checkDate.getDay()];
    
    // If days is empty, every day is valid
    if (days.length === 0 || days.includes(dayName)) {
      return checkDate.getTime();
    }
  }
  
  // Fallback to next week same time
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(hours, minutes, 0, 0);
  return nextWeek.getTime();
}

// Save reminder to IndexedDB
export async function saveReminderToIndexedDB(reminder: ScheduledReminder): Promise<void> {
  const db = await openDB();

  // Computed mode trusts the provided nextFireTime (per-cycle absolute schedule).
  // Weekly mode (legacy) recalculates from time+days.
  const nextFireTime = !reminder.enabled
    ? undefined
    : reminder.mode === 'computed'
      ? reminder.nextFireTime
      : calculateNextFireTime(reminder.time, reminder.days);

  const reminderWithFireTime = { ...reminder, nextFireTime };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(reminderWithFireTime);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      notifyServiceWorker('SYNC_REMINDERS');
      resolve();
    };
  });
}

// Save multiple reminders at once
export async function bulkSaveReminders(reminders: ScheduledReminder[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const reminder of reminders) {
      const nextFireTime = !reminder.enabled
        ? undefined
        : reminder.mode === 'computed'
          ? reminder.nextFireTime
          : calculateNextFireTime(reminder.time, reminder.days);
      store.put({ ...reminder, nextFireTime });
    }

    transaction.oncomplete = () => {
      notifyServiceWorker('SYNC_REMINDERS');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Replace only the ordinary weekly reminder set for the active account.
// Cycle-aware reminders use computed mode and are intentionally preserved.
// This prevents reminders removed in the cloud (or owned by a previous
// session) from lingering in the shared service-worker database.
export async function replaceWeeklyRemindersInIndexedDB(reminders: ScheduledReminder[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const existing = cursor.value as ScheduledReminder;
        if (existing.mode !== 'computed' && !existing.cycleId) cursor.delete();
        cursor.continue();
        return;
      }

      for (const reminder of reminders) {
        const nextFireTime = reminder.enabled
          ? calculateNextFireTime(reminder.time, reminder.days)
          : undefined;
        store.put({ ...reminder, mode: 'weekly', nextFireTime });
      }
    };
    transaction.oncomplete = () => {
      notifyServiceWorker('SYNC_REMINDERS');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Delete reminder from IndexedDB
export async function deleteReminderFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      notifyServiceWorker('SYNC_REMINDERS');
      resolve();
    };
  });
}

// Get all reminders from IndexedDB
export async function getAllRemindersFromIndexedDB(): Promise<ScheduledReminder[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Clear all reminders from IndexedDB (useful for re-sync)
export async function clearAllRemindersFromIndexedDB(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Clear the fired-notifications de-dup store
async function clearFiredNotificationsStore(): Promise<void> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains('fired-notifications')) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('fired-notifications', 'readwrite');
      const store = tx.objectStore('fired-notifications');
      const req = store.clear();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to clear fired-notifications store:', err);
  }
}

// Clear all scheduled reminders, fired-notification history,
// and any currently displayed OS notifications. Used on sign-out.
export async function clearAllScheduledNotifications(): Promise<void> {
  try {
    await clearAllRemindersFromIndexedDB();
  } catch (err) {
    console.warn('Failed to clear scheduled reminders:', err);
  }

  await clearFiredNotificationsStore();

  // Close any currently displayed OS notification banners
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const notifications = await registration.getNotifications();
        notifications.forEach((n) => {
          try { n.close(); } catch { /* noop */ }
        });
      }
    }
  } catch (err) {
    console.warn('Failed to close active notifications:', err);
  }

  // Notify the SW so it re-reads the now-empty store and stops scheduling
  notifyServiceWorker('SYNC_REMINDERS');
}

// Sync reminders from localStorage to IndexedDB
export async function syncRemindersToIndexedDB(): Promise<void> {
  try {
    const reminders = getStoredData<Array<{
      id: string;
      peptide_id: string;
      peptide_name: string;
      dose: string;
      time: string;
      days: string[];
      enabled: boolean;
    }>>(STORAGE_KEYS.SCHEDULED_REMINDERS, []);
    
    // Map to ScheduledReminder format
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
    console.log(`Synced ${scheduledReminders.length} reminders to IndexedDB`);
  } catch (error) {
    console.error('Error syncing reminders to IndexedDB:', error);
  }
}

// Notify service worker of changes
function notifyServiceWorker(type: string, data?: unknown): void {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type, data });
  }
}

// One-shot guard so controllerchange can't trigger an update loop
let reloadOnControllerChange = false;
let controllerChangeBound = false;

function setupAutoUpdate(registration: ServiceWorkerRegistration): void {
  // Only auto-reload when there's already a controlling SW (i.e. returning user).
  // Fresh installs have no controller, so we skip the reload to avoid flicker.
  if (!controllerChangeBound) {
    controllerChangeBound = true;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloadOnControllerChange) return;
      reloadOnControllerChange = false;
      window.location.reload();
    });
  }

  const promote = (worker: ServiceWorker | null) => {
    if (!worker) return;
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      reloadOnControllerChange = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          reloadOnControllerChange = true;
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };

  // A SW may already be waiting when the page loads
  promote(registration.waiting);

  registration.addEventListener('updatefound', () => {
    promote(registration.installing);
  });
}

// Register service worker and set up periodic checks
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    
    swRegistration = registration;

    // Auto-update flow: when a new SW takes over (only on already-installed clients),
    // reload once so users see the new icon/name without manual reinstall.
    setupAutoUpdate(registration);

    // Force an update check on every app load
    registration.update().catch(() => {});

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Sync reminders to IndexedDB
    await syncRemindersToIndexedDB();
    
    // Tell service worker to start checking
    notifyServiceWorker('START_CHECKING');
    
    // Try to register for periodic background sync (if supported)
    if ('periodicSync' in registration) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        });
        
        if (status.state === 'granted') {
          await (registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } })
            .periodicSync.register('check-reminders', {
              minInterval: 60 * 1000, // 1 minute minimum
            });
          console.log('Periodic background sync registered');
        }
      } catch (error) {
        console.log('Periodic background sync not available:', error);
      }
    }
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_ACTION') {
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('swNotificationAction', {
          detail: event.data
        }));
      }
    });
    
    console.log('Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Request notification permission
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Check if push is supported and enabled
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get service worker registration status
export async function getServiceWorkerStatus(): Promise<'active' | 'installing' | 'waiting' | 'none'> {
  if (!('serviceWorker' in navigator)) return 'none';
  
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return 'none';
  if (registration.active) return 'active';
  if (registration.installing) return 'installing';
  if (registration.waiting) return 'waiting';
  return 'none';
}

// Force sync reminders and trigger check
export async function forceSyncAndCheck(): Promise<void> {
  await syncRemindersToIndexedDB();
  notifyServiceWorker('CHECK_REMINDERS');
}

// Schedule a snooze notification
export function scheduleSnooze(reminderData: {
  reminderId: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  time: string;
}, minutes: number = 10): void {
  notifyServiceWorker('SCHEDULE_SNOOZE', { reminderData, minutes });
}

// Get the current service worker registration
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

// ───────────────────────────── Cycle-aware reminders ─────────────────────────────
//
// One ScheduledReminder per (cycleId, splitIndex) using absolute nextFireTime.
// Reminders are scheduled only when the user explicitly enabled them and
// explicitly recorded one or more times. The scheduler never creates a
// catch-up instruction, a break instruction or a default administration time.
//
// Caller imports from '@/services/pushScheduler' and calls
// scheduleCycleReminders(cycle, doses).

import type { Cycle } from '@/data/userData';
import type { DailyDoseEntry } from '@/hooks/useDailyDoses';
import { computeNextFireAt } from '@/lib/cycleProgress';

function cycleReminderId(cycleId: string, splitIndex: number): string {
  return `cycle:${cycleId}:${splitIndex}`;
}

async function removeCycleReminders(cycleId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      const value = cursor.value as ScheduledReminder;
      if (value.cycleId === cycleId && (value.mode === 'computed' || value.id.startsWith(`cycle:${cycleId}:`))) {
        cursor.delete();
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
  });
}

export async function scheduleCycleReminders(cycle: Cycle, doses: DailyDoseEntry[]): Promise<void> {
  await removeCycleReminders(cycle.id);

  if (!cycle.reminderEnabled) {
    notifyServiceWorker('SYNC_REMINDERS');
    return;
  }

  const lead = Math.max(0, cycle.reminderLeadMinutes ?? 0);
  const splitParts = Math.max(1, cycle.splitParts ?? 1);
  const doseTimes = cycle.doseTimes ?? [];

  if (doseTimes.length === 0) {
    notifyServiceWorker('SYNC_REMINDERS');
    return;
  }

  // Cycle paused → record disabled placeholders so popover can read state.
  if (cycle.status === 'break') {
    notifyServiceWorker('SYNC_REMINDERS');
    return;
  }

  // Schedule one reminder per explicitly recorded time.
  for (let i = 0; i < Math.min(doseTimes.length, splitParts); i++) {
    const time = doseTimes[i];
    const fireAt = computeNextFireAt(cycle, doses, time, lead);
    if (!fireAt) continue;
    await saveReminderToIndexedDB({
      id: cycleReminderId(cycle.id, i),
      cycleId: cycle.id,
      mode: 'computed',
      peptideId: cycle.peptideId,
      peptideName: cycle.peptideName,
      dose: cycle.dose,
      time,
      days: [],
      enabled: true,
      nextFireTime: fireAt,
      leadMinutes: lead,
      splitIndex: i,
      body: splitParts > 1
        ? `Sub-dose ${i + 1}/${splitParts} · ${cycle.dose}`
        : `Time for ${cycle.dose}`,
    });
  }
}

export async function scheduleAllCycleReminders(cycles: Cycle[], doses: DailyDoseEntry[]): Promise<void> {
  for (const c of cycles) {
    if (c.status === 'completed') continue;
    try {
      await scheduleCycleReminders(c, doses);
    } catch (err) {
      console.warn('scheduleCycleReminders failed for', c.id, err);
    }
  }
}
