// Peptide Tracker Service Worker - PWA + Background Notifications

const CACHE_NAME = 'peptide-tracker-v11-psa';

// Always-fresh assets: branding/manifest/shell files that must update for installed users
const NETWORK_FIRST_PATHS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-animated.png',
];
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-animated.png',
];

const DB_NAME = 'peptide-reminders-db';
const DB_VERSION = 2;
const STORE_NAME = 'scheduled-reminders';
const FIRED_STORE = 'fired-notifications';

// ─── Cache Management ───

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Some assets may fail, continue anyway
        console.log('Some static assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
      clients.claim(),
      checkDueNotifications(),
    ])
  );
});

// Allow page to trigger immediate activation of an updated SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Fetch Strategy: Network-first for API, Cache-first for static ───

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase/API calls
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/')) return;

  // Network-first for branding/manifest so installed users always get fresh icons & name
  const isBrandingAsset =
    NETWORK_FIRST_PATHS.includes(url.pathname) ||
    url.pathname.startsWith('/apple-touch-icon');
  if (url.origin === self.location.origin && isBrandingAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || new Response('', { status: 408 })))
    );
    return;
  }

  // For navigation requests - network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // For static assets - cache first, network fallback
  if (
    (event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    event.request.destination === 'style') &&
    !url.pathname.includes('node_modules')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }
});

// ─── IndexedDB for Notifications ───

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('nextFireTime', 'nextFireTime', { unique: false });
        store.createIndex('enabled', 'enabled', { unique: false });
      }
      if (!db.objectStoreNames.contains(FIRED_STORE)) {
        const firedStore = db.createObjectStore(FIRED_STORE, { keyPath: 'id' });
        firedStore.createIndex('firedAt', 'firedAt', { unique: false });
      }
    };
  });
}

async function getReminders() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function wasNotificationFired(notificationId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(FIRED_STORE, 'readonly');
      const store = transaction.objectStore(FIRED_STORE);
      const request = store.get(notificationId);
      request.onerror = () => resolve(false);
      request.onsuccess = () => resolve(!!request.result);
    });
  } catch {
    return false;
  }
}

async function markNotificationFired(notificationId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(FIRED_STORE, 'readwrite');
      const store = transaction.objectStore(FIRED_STORE);
      store.put({ id: notificationId, firedAt: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {}
}

async function cleanupFiredNotifications() {
  try {
    const db = await openDB();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return new Promise((resolve) => {
      const transaction = db.transaction(FIRED_STORE, 'readwrite');
      const store = transaction.objectStore(FIRED_STORE);
      const index = store.index('firedAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {}
}

async function updateReminderNextFireTime(reminderId, nextFireTime) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(reminderId);
      getRequest.onsuccess = () => {
        const reminder = getRequest.result;
        if (reminder) {
          reminder.nextFireTime = nextFireTime;
          store.put(reminder);
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {}
}

function calculateNextFireTime(time, days) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(hours, minutes, 0, 0);
    if (checkDate.getTime() <= now.getTime() + 60000) continue;
    const dayName = dayNames[checkDate.getDay()];
    if (!days || days.length === 0 || days.includes(dayName)) {
      return checkDate.getTime();
    }
  }
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(hours, minutes, 0, 0);
  return nextWeek.getTime();
}

async function checkDueNotifications() {
  try {
    const reminders = await getReminders();
    const now = Date.now();
    const notificationsToShow = [];
    for (const reminder of reminders) {
      if (!reminder.enabled || !reminder.nextFireTime) continue;
      const timeDiff = now - reminder.nextFireTime;
      if (timeDiff >= -30000 && timeDiff <= 60000) {
        const notificationId = `${reminder.id}-${reminder.nextFireTime}`;
        const alreadyFired = await wasNotificationFired(notificationId);
        if (alreadyFired) continue;
        notificationsToShow.push({ reminder, notificationId });
      }
    }
    for (const { reminder, notificationId } of notificationsToShow) {
      await markNotificationFired(notificationId);
      const title = reminder.mode === 'computed' && reminder.body
        ? `💉 ${reminder.peptideName}`
        : `💉 Time for ${reminder.peptideName}`;
      const body = reminder.body || `Scheduled dose: ${reminder.dose} at ${reminder.time}`;
      await self.registration.showNotification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: notificationId,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'taken', title: '✓ Taken' },
          { action: 'snooze', title: '⏰ Snooze 10min' },
        ],
        data: {
          reminderId: reminder.id,
          peptideName: reminder.peptideName,
          peptideId: reminder.peptideId,
          dose: reminder.dose,
          time: reminder.time,
          cycleId: reminder.cycleId,
        },
      });
      if (reminder.mode === 'computed') {
        // Don't auto-roll — page will recompute on next open or dose log.
        await updateReminderNextFireTime(reminder.id, null);
      } else {
        const nextFireTime = calculateNextFireTime(reminder.time, reminder.days);
        await updateReminderNextFireTime(reminder.id, nextFireTime);
      }
    }
    if (Math.random() < 0.1) {
      await cleanupFiredNotifications();
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

async function scheduleSnooze(data, minutes = 10) {
  const snoozeTime = Date.now() + minutes * 60 * 1000;
  try {
    const db = await openDB();
    const snoozeReminder = {
      id: `snooze-${data.reminderId}-${snoozeTime}`,
      peptideId: data.peptideId,
      peptideName: data.peptideName,
      dose: data.dose,
      time: data.time,
      days: [],
      enabled: true,
      nextFireTime: snoozeTime,
      isSnooze: true,
    };
    await new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(snoozeReminder);
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error('Error scheduling snooze:', error);
  }
}

// ─── Push & Notification Events ───

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || '💉 Dose Reminder', {
        body: data.body || 'Time for your scheduled dose',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: data.tag || 'dose-reminder',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'taken', title: '✓ Taken' },
          { action: 'snooze', title: '⏰ Snooze' },
        ],
        data: data.payload || {},
      })
    );
  } catch (error) {
    console.error('Push event error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  event.waitUntil(
    (async () => {
      if (action === 'snooze') {
        await scheduleSnooze(data, 10);
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({ type: 'NOTIFICATION_ACTION', action: 'snooze', data });
        }
        return;
      }
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({ type: 'NOTIFICATION_ACTION', action: action || 'click', data });
          return;
        }
      }
      if (clients.openWindow) {
        const newClient = await clients.openWindow('/');
        setTimeout(() => {
          newClient?.postMessage({ type: 'NOTIFICATION_ACTION', action: action || 'click', data });
        }, 2000);
      }
    })()
  );
});

// ─── Message Handling ───

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  switch (type) {
    case 'CHECK_REMINDERS':
      checkDueNotifications();
      break;
    case 'START_CHECKING':
      startPeriodicChecks();
      break;
    case 'SYNC_REMINDERS':
      checkDueNotifications();
      break;
    case 'SCHEDULE_SNOOZE':
      scheduleSnooze(data.reminderData, data.minutes);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// ─── Periodic Checks ───

let checkInterval = null;

function startPeriodicChecks() {
  if (checkInterval) return;
  checkInterval = setInterval(() => {
    checkDueNotifications();
  }, 30000);
  checkDueNotifications();
}

startPeriodicChecks();

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkDueNotifications());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(checkDueNotifications());
  }
});

function scheduleNextCheck() {
  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    checkDueNotifications();
    scheduleNextCheck();
  }, msUntilNextMinute);
}

scheduleNextCheck();
