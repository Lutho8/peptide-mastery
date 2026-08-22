// Local Storage Keys
const STORAGE_KEYS = {
  BODY_COMPOSITION: 'peptide_app_body_composition',
  DOSE_LOGS: 'peptide_app_dose_logs',
  DOSE_SCHEDULES: 'peptide_app_dose_schedules',
  CYCLES: 'peptide_app_cycles',
  NOTIFICATION_SETTINGS: 'peptide_app_notifications',
  USER_PROFILE: 'peptide_app_user_profile',
  CALCULATOR_SETTINGS: 'peptide_app_calculator_settings',
  SCHEDULED_REMINDERS: 'peptide_app_scheduled_reminders',
  ACTIVE_STACK: 'peptide_app_active_stack',
  DAILY_DOSES: 'peptide-daily-doses',
  DOSAGE_PRESETS: 'peptide_app_dosage_presets',
} as const;

// ===== Per-user namespacing =====
let activeUserId: string | null = null;

export function setActiveUserId(userId: string | null): void {
  activeUserId = userId;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

function namespacedKey(baseKey: string): string {
  const scope = activeUserId ?? 'guest';
  return `${baseKey}::${scope}`;
}

// Generic storage functions (auto-namespaced)
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(namespacedKey(key));
    if (stored) {
      return JSON.parse(stored) as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(namespacedKey(key), JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

export function removeStoredData(key: string): void {
  try {
    localStorage.removeItem(namespacedKey(key));
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

// Wipe all user-scoped storage entries (used on sign-out).
// Removes both the current user's namespace and any guest namespace,
// so the next user starts with a clean slate.
export function clearAllUserScopedStorage(): void {
  try {
    const baseKeys = Object.values(STORAGE_KEYS);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Match any "<base>::<anyId>" key for our app keys
      if (baseKeys.some(base => k.startsWith(`${base}::`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error('Error clearing user-scoped storage:', error);
  }
}

// One-time idempotent migration: remove legacy un-namespaced global keys
// so leftover data from before per-user namespacing can't leak.
export function clearLegacyGlobalKeys(): void {
  try {
    const baseKeys = Object.values(STORAGE_KEYS);
    baseKeys.forEach(base => {
      // Only remove the bare key (no "::userId" suffix)
      if (localStorage.getItem(base) !== null) {
        localStorage.removeItem(base);
      }
    });
  } catch (error) {
    console.error('Error clearing legacy global keys:', error);
  }
}

// Body Composition Storage
import { BodyComposition as BodyCompType, bodyCompositionHistory as defaultBodyComp, DoseSchedule as DoseScheduleType, Cycle as CycleType, todaysDoses as defaultDoses, activeCycles as defaultCycles, UserProfile as UserProfileType, userProfile as defaultUserProfile, activeStack as defaultActiveStack } from '@/data/userData';

export interface BodyComposition extends Omit<BodyCompType, 'source'> {
  // Widened to allow scale brand strings (renpho, xiaomi, eufy, yunmai, withings, fitbit, generic, bluetooth)
  source?: string;
}
export type DoseSchedule = DoseScheduleType;
export type Cycle = CycleType;
export type UserProfile = UserProfileType;

// User Profile Storage
export function getUserProfile(): UserProfile {
  return getStoredData(STORAGE_KEYS.USER_PROFILE, defaultUserProfile);
}

export function saveUserProfile(profile: UserProfile): void {
  setStoredData(STORAGE_KEYS.USER_PROFILE, profile);
}

export function getBodyCompositionHistory(): BodyComposition[] {
  return getStoredData(STORAGE_KEYS.BODY_COMPOSITION, defaultBodyComp);
}

export function saveBodyCompositionEntry(entry: BodyComposition): void {
  const history = getBodyCompositionHistory();
  // Insert at beginning (newest first)
  history.unshift(entry);
  setStoredData(STORAGE_KEYS.BODY_COMPOSITION, history);
}

export function updateBodyCompositionHistory(history: BodyComposition[]): void {
  setStoredData(STORAGE_KEYS.BODY_COMPOSITION, history);
}

// Dose Logs Storage
export interface DoseLog {
  id: string;
  scheduleId: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'taken' | 'skipped' | 'missed';
  date: string;
  notes?: string;
}

export function getDoseLogs(): DoseLog[] {
  return getStoredData(STORAGE_KEYS.DOSE_LOGS, []);
}

export function saveDoseLog(log: DoseLog): void {
  const logs = getDoseLogs();
  logs.unshift(log);
  setStoredData(STORAGE_KEYS.DOSE_LOGS, logs);
}

export function getDoseLogsForDate(date: string): DoseLog[] {
  const logs = getDoseLogs();
  return logs.filter(log => log.date === date);
}

// Dose Schedules Storage

export function getDoseSchedules(): DoseSchedule[] {
  return getStoredData(STORAGE_KEYS.DOSE_SCHEDULES, defaultDoses);
}

export function saveDoseSchedule(schedule: DoseSchedule): void {
  const schedules = getDoseSchedules();
  schedules.push(schedule);
  setStoredData(STORAGE_KEYS.DOSE_SCHEDULES, schedules);
}

export function updateDoseSchedule(schedule: DoseSchedule): void {
  const schedules = getDoseSchedules();
  const index = schedules.findIndex(s => s.id === schedule.id);
  if (index !== -1) {
    schedules[index] = schedule;
    setStoredData(STORAGE_KEYS.DOSE_SCHEDULES, schedules);
  }
}

export function deleteDoseSchedule(scheduleId: string): void {
  const schedules = getDoseSchedules();
  const filtered = schedules.filter(s => s.id !== scheduleId);
  setStoredData(STORAGE_KEYS.DOSE_SCHEDULES, filtered);
}

// Cycles Storage

let _cyclesLoggedOnce = false;
export function getCycles(): Cycle[] {
  const cycles = getStoredData(STORAGE_KEYS.CYCLES, defaultCycles);
  if (!_cyclesLoggedOnce && typeof console !== 'undefined') {
    _cyclesLoggedOnce = true;
    // One-shot breadcrumb to catch accidental cycle-history resets in the field.
    console.info(`[cycles] loaded ${cycles.length} from local store`);
  }
  return cycles;
}

// Fire-and-forget audit hook. Dynamic import avoids pulling supabase into any
// caller that might be running in a non-browser context (SSR/tests).
function auditFireAndForget(action: string, metadata: Record<string, unknown>) {
  import('@/lib/auditLog')
    .then(({ logAudit }) => logAudit({ action, entityType: 'cycle', metadata }))
    .catch(() => { /* audit must never break dose writes */ });
}

export function saveCycle(cycle: Cycle): void {
  const cycles = getCycles();
  cycles.push(cycle);
  setStoredData(STORAGE_KEYS.CYCLES, cycles);
  auditFireAndForget('dose.cycle.create', {
    cycleId: cycle.id,
    peptideId: (cycle as any).peptideId,
    peptideName: (cycle as any).peptideName,
    doseMg: (cycle as any).doseMg ?? (cycle as any).dose,
    frequency: (cycle as any).frequency,
    status: (cycle as any).status,
  });
}

export function updateCycle(cycle: Cycle): void {
  const cycles = getCycles();
  const index = cycles.findIndex(c => c.id === cycle.id);
  if (index !== -1) {
    const before = cycles[index] as any;
    cycles[index] = cycle;
    setStoredData(STORAGE_KEYS.CYCLES, cycles);
    const after = cycle as any;
    const diff: Record<string, { before: unknown; after: unknown }> = {};
    for (const k of ['doseMg', 'dose', 'frequency', 'status', 'startDate', 'endDate']) {
      if (before?.[k] !== after?.[k]) diff[k] = { before: before?.[k], after: after?.[k] };
    }
    auditFireAndForget('dose.cycle.update', {
      cycleId: cycle.id,
      peptideId: after.peptideId,
      diff,
    });
    if (before?.status !== after?.status) {
      auditFireAndForget('dose.cycle.status_change', {
        cycleId: cycle.id,
        peptideId: after.peptideId,
        from: before?.status,
        to: after?.status,
      });
    }
  }
}

export function deleteCycle(cycleId: string): void {
  const cycles = getCycles();
  const target = cycles.find(c => c.id === cycleId) as any;
  const filtered = cycles.filter(c => c.id !== cycleId);
  setStoredData(STORAGE_KEYS.CYCLES, filtered);
  auditFireAndForget('dose.cycle.delete', {
    cycleId,
    peptideId: target?.peptideId,
    peptideName: target?.peptideName,
  });
}

// Notification Settings Storage
export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  reminderMinutesBefore: number;
  scheduleIds: string[]; // Which schedules have notifications enabled
}

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  soundEnabled: true,
  reminderMinutesBefore: 5,
  scheduleIds: [],
};

export function getNotificationSettings(): NotificationSettings {
  return getStoredData(STORAGE_KEYS.NOTIFICATION_SETTINGS, defaultNotificationSettings);
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  setStoredData(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
}

// Calculator Settings Storage
export interface CalculatorSettings {
  syringeType: 'u100' | 'u40' | 'u50';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'athlete';
  lastVialSize: string;
  lastBacWater: string;
  lastTargetDose: string;
  lastSelectedPeptide: string;
  savedAt: string;
}

const defaultCalculatorSettings: CalculatorSettings = {
  syringeType: 'u40',
  experienceLevel: 'beginner',
  lastVialSize: '5',
  lastBacWater: '2',
  lastTargetDose: '0.25',
  lastSelectedPeptide: '',
  savedAt: '',
};

export function getCalculatorSettings(): CalculatorSettings {
  return getStoredData(STORAGE_KEYS.CALCULATOR_SETTINGS, defaultCalculatorSettings);
}

export function saveCalculatorSettings(settings: Partial<CalculatorSettings>): void {
  const current = getCalculatorSettings();
  setStoredData(STORAGE_KEYS.CALCULATOR_SETTINGS, {
    ...current,
    ...settings,
    savedAt: new Date().toISOString(),
  });
}

// Scheduled Reminders Storage
export interface ScheduledReminder {
  id: string;
  peptideId: string;
  peptideName: string;
  dose: string;
  time: string;
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  enabled: boolean;
  createdAt: string;
}

export function getScheduledReminders(): ScheduledReminder[] {
  return getStoredData(STORAGE_KEYS.SCHEDULED_REMINDERS, []);
}

export function saveScheduledReminder(reminder: ScheduledReminder): void {
  const reminders = getScheduledReminders();
  const existingIndex = reminders.findIndex(r => r.id === reminder.id);
  if (existingIndex >= 0) {
    reminders[existingIndex] = reminder;
  } else {
    reminders.push(reminder);
  }
  setStoredData(STORAGE_KEYS.SCHEDULED_REMINDERS, reminders);
}

export function deleteScheduledReminder(reminderId: string): void {
  const reminders = getScheduledReminders();
  setStoredData(STORAGE_KEYS.SCHEDULED_REMINDERS, reminders.filter(r => r.id !== reminderId));
}

export function toggleReminderEnabled(reminderId: string): void {
  const reminders = getScheduledReminders();
  const reminder = reminders.find(r => r.id === reminderId);
  if (reminder) {
    reminder.enabled = !reminder.enabled;
    setStoredData(STORAGE_KEYS.SCHEDULED_REMINDERS, reminders);
  }
}

// Initialize storage with defaults if empty (per current user's namespace)
export function initializeStorage(): void {
  if (localStorage.getItem(namespacedKey(STORAGE_KEYS.BODY_COMPOSITION)) === null) {
    setStoredData(STORAGE_KEYS.BODY_COMPOSITION, defaultBodyComp);
  }
  if (localStorage.getItem(namespacedKey(STORAGE_KEYS.DOSE_SCHEDULES)) === null) {
    setStoredData(STORAGE_KEYS.DOSE_SCHEDULES, defaultDoses);
  }
  if (localStorage.getItem(namespacedKey(STORAGE_KEYS.CYCLES)) === null) {
    setStoredData(STORAGE_KEYS.CYCLES, defaultCycles);
  }
  if (localStorage.getItem(namespacedKey(STORAGE_KEYS.ACTIVE_STACK)) === null) {
    setStoredData(STORAGE_KEYS.ACTIVE_STACK, defaultActiveStack);
  }
}

// Active Stack Storage
export interface ActiveStackItem {
  peptideId: string;
  dose: string;
  frequency: string;
  /** Number of sub-doses that together make one complete dose (e.g. AM+PM = 2). */
  splitParts?: number;
  /** Per-administration amount that user injects (one entry, repeated across doseTimes). */
  perAdministration?: { amount: number; unit: 'mg' | 'IU' | 'units' };
  /** Total complete doses per week. */
  dosesPerWeek?: number;
  /** Experience level used to seed dosing. */
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'athlete';
  /** Preferred administration times in HH:MM. Length should equal splitParts for split doses. */
  doseTimes?: string[];
  /** Whether push reminders are enabled for this peptide. */
  reminderEnabled?: boolean;
  /** Lead-time in minutes before the scheduled dose to fire the reminder. */
  reminderLeadMinutes?: number;
}

export function getActiveStack(): ActiveStackItem[] {
  return getStoredData(STORAGE_KEYS.ACTIVE_STACK, defaultActiveStack);
}

export function saveActiveStack(stack: ActiveStackItem[]): void {
  const prev = getActiveStack();
  setStoredData(STORAGE_KEYS.ACTIVE_STACK, stack);
  const prevIds = new Set(prev.map((p: any) => p.peptideId ?? p.id));
  const nextIds = new Set(stack.map((p: any) => p.peptideId ?? p.id));
  const addedIds = [...nextIds].filter((id) => !prevIds.has(id));
  const removedIds = [...prevIds].filter((id) => !nextIds.has(id));
  import('@/lib/auditLog')
    .then(({ logAudit }) => logAudit({
      action: 'dose.stack.update',
      entityType: 'active_stack',
      metadata: { addedIds, removedIds, size: stack.length },
    }))
    .catch(() => { /* ignore */ });
}

// Dosage Presets Storage
export type VialUnitType = 'mg' | 'IU' | 'units';

export interface DosagePreset {
  id: string;
  name: string;
  peptideId?: string;
  blendId?: string;
  /** Total vial amount in `vialUnitType`. Stored in `vialSize` for back-compat. */
  vialSize: string;
  bacWater: string;
  targetDose: string;
  syringeType: 'u100' | 'u40' | 'u50';
  /** Unit type for the vial amount (and target dose). Defaults to 'mg'. */
  vialUnitType?: VialUnitType;
  createdAt: string;
}

export function getDosagePresets(): DosagePreset[] {
  return getStoredData(STORAGE_KEYS.DOSAGE_PRESETS, [] as DosagePreset[]);
}

export function saveDosagePreset(preset: DosagePreset): void {
  const presets = getDosagePresets();
  const idx = presets.findIndex(p => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.unshift(preset);
  setStoredData(STORAGE_KEYS.DOSAGE_PRESETS, presets);
}

export function deleteDosagePreset(id: string): void {
  setStoredData(STORAGE_KEYS.DOSAGE_PRESETS, getDosagePresets().filter(p => p.id !== id));
}

// Most recent saved preset for a peptide, if any.
export function getDosagePresetForPeptide(peptideId: string | undefined): DosagePreset | undefined {
  if (!peptideId) return undefined;
  const presets = getDosagePresets().filter(p => p.peptideId === peptideId);
  if (presets.length === 0) return undefined;
  return [...presets].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0];
}

export { STORAGE_KEYS };
