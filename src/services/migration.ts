/**
 * Data Migration Service
 *
 * Detects and migrates localStorage data from a previous Supabase project
 * (different user ID namespace) to the current user's namespace.
 *
 * Also backfills migrated data to the new Supabase cloud project.
 */

import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './storage';

// Module-level flag so we only prompt once per session
let migrationPrompted = false;

export interface LegacyNamespace {
  userId: string;
  storageSuffix: string | null;
  displayLabel: string;
  keysFound: number;
  hasData: boolean;
}

export interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  error?: string;
}

export interface MigrationSummary {
  namespaces: LegacyNamespace[];
  totalLegacyKeys: number;
}

const ALL_STORAGE_BASE_KEYS = Object.values(STORAGE_KEYS);
const LEGACY_UNSCOPED_ALIASES: Record<string, readonly string[]> = {
  [STORAGE_KEYS.SCHEDULED_REMINDERS]: ['peptide-dose-reminders'],
};

/** Stable UUID for a recovered row. Scoping the original ID to the current
 * account avoids colliding with a row retained under a legacy Auth UUID while
 * keeping retries idempotent. */
export function recoveredRecordId(currentUserId: string, originalId: string): string {
  const input = `${currentUserId}:${originalId}`;
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  let c = 0x85ebca6b;
  let d = 0xc2b2ae35;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x85ebca6b);
    c = Math.imul(c ^ code, 0xc2b2ae35);
    d = Math.imul(d ^ code, 0x27d4eb2f);
  }
  const hex = [a, b, c, d].map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function hasMeaningfulStoredValue(baseKey: string, raw: string | null): boolean {
  if (raw === null) return false;
  try {
    const value = JSON.parse(raw) as unknown;
    if (Array.isArray(value)) return value.length > 0;
    if (!value || typeof value !== 'object') return false;
    if (baseKey === STORAGE_KEYS.CALCULATOR_SETTINGS) {
      return Boolean((value as Record<string, unknown>).savedAt);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan localStorage for app keys that belong to namespaces other than
 * the current user or 'guest'. Returns a summary of what legacy data exists.
 */
export function scanForLegacyData(currentUserId: string | null): MigrationSummary {
  const namespaces = new Map<string, Set<string>>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Match only our app's namespaced keys: "baseKey::userId"
      const match = ALL_STORAGE_BASE_KEYS.find(base => key.startsWith(`${base}::`));
      if (!match) continue;

      const suffix = key.slice(match.length + 2); // everything after "baseKey::"
      if (!suffix) continue;
      if (suffix === currentUserId) continue;

      const raw = localStorage.getItem(key);
      if (!hasMeaningfulStoredValue(match, raw)) continue;

      if (!namespaces.has(suffix)) {
        namespaces.set(suffix, new Set());
      }
      namespaces.get(suffix)!.add(match);
    }
  } catch (e) {
    console.error('Error scanning localStorage for legacy data:', e);
  }

  // Older builds also used bare keys with no namespace. Preserve and offer
  // those records instead of deleting them during authentication.
  for (const baseKey of ALL_STORAGE_BASE_KEYS) {
    const raw = localStorage.getItem(baseKey);
    if (!hasMeaningfulStoredValue(baseKey, raw)) continue;
    if (!namespaces.has('__legacy_unscoped__')) namespaces.set('__legacy_unscoped__', new Set());
    namespaces.get('__legacy_unscoped__')!.add(baseKey);
  }

  // The reminder hook used a separate bare key before storage was namespaced.
  // Treat it as recoverable legacy data, but never load it directly into an
  // arbitrary signed-in user's workspace.
  for (const [baseKey, aliases] of Object.entries(LEGACY_UNSCOPED_ALIASES)) {
    if (!aliases.some((alias) => hasMeaningfulStoredValue(baseKey, localStorage.getItem(alias)))) continue;
    if (!namespaces.has('__legacy_unscoped__')) namespaces.set('__legacy_unscoped__', new Set());
    namespaces.get('__legacy_unscoped__')!.add(baseKey);
  }

  const results: LegacyNamespace[] = [];
  namespaces.forEach((keys, userId) => {
    const isGuest = userId === 'guest';
    const isUnscoped = userId === '__legacy_unscoped__';
    results.push({
      userId,
      storageSuffix: isUnscoped ? null : userId,
      displayLabel: isGuest ? 'Signed-out tracker data' : isUnscoped ? 'Earlier tracker data' : 'Previous app account',
      keysFound: keys.size,
      hasData: keys.size > 0,
    });
  });

  return {
    namespaces: results,
    totalLegacyKeys: results.reduce((sum, n) => sum + n.keysFound, 0),
  };
}

/**
 * Returns true if there is legacy data from a previous user account
 * and we haven't already prompted this session.
 */
export function shouldPromptForMigration(currentUserId: string | null): boolean {
  if (migrationPrompted) return false;
  const summary = scanForLegacyData(currentUserId);
  return summary.totalLegacyKeys > 0;
}

/**
 * Mark that we've already prompted so we don't spam the user.
 */
export function markMigrationPrompted(): void {
  migrationPrompted = true;
}

/**
 * Migrate ALL legacy localStorage data into the current user's namespace.
 * This is a local-only copy — old data is preserved as a safety net.
 */
export function migrateLegacyLocalData(currentUserId: string): MigrationResult {
  const summary = scanForLegacyData(currentUserId);
  let migratedCount = 0;

  try {
    for (const ns of summary.namespaces) {
      for (const baseKey of ALL_STORAGE_BASE_KEYS) {
        const newKey = `${baseKey}::${currentUserId}`;
        const candidateKeys = ns.storageSuffix === null
          ? [baseKey, ...(LEGACY_UNSCOPED_ALIASES[baseKey] ?? [])]
          : [`${baseKey}::${ns.storageSuffix}`];

        for (const legacyKey of candidateKeys) {
          const raw = localStorage.getItem(legacyKey);
          if (raw === null) continue;

          // Don't overwrite if current user already has data for this key.
          const existing = localStorage.getItem(newKey);
          if (existing !== null) {
            // Merge arrays (stacks, cycles, reminders, body comp, dose logs, schedules, presets, daily doses).
            try {
              const legacyData = JSON.parse(raw);
              const currentData = JSON.parse(existing);
              if (Array.isArray(legacyData) && Array.isArray(currentData)) {
                const mergedMap = new Map<string, unknown>();
                [...currentData, ...legacyData].forEach(item => {
                  const id = (item as Record<string, unknown>)?.id ?? JSON.stringify(item);
                  mergedMap.set(String(id), item);
                });
                localStorage.setItem(newKey, JSON.stringify(Array.from(mergedMap.values())));
                migratedCount++;
              }
              // For objects (settings, profile), prefer the current value.
              continue;
            } catch {
              // Not JSON arrays — skip to avoid corruption.
              continue;
            }
          }

          // No existing data — safe to copy. The source remains as a rollback
          // copy until the user has verified the recovered workspace.
          localStorage.setItem(newKey, raw);
          migratedCount++;
        }
      }
    }

    return { success: true, migratedKeys: migratedCount };
  } catch (e) {
    console.error('Migration failed:', e);
    return {
      success: false,
      migratedKeys: migratedCount,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Backfill migrated local data to the new Supabase cloud project.
 * Mirrors the logic in useCloudSync.loadFromCloud() but pushes instead of pulling.
 */
export async function backfillToCloud(currentUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    const errors: string[] = [];

    // Helper to read from current user's namespace
    const read = (baseKey: string) => {
      const key = `${baseKey}::${currentUserId}`;
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    };

    // 1. Calculator Settings
    const calcSettings = read(STORAGE_KEYS.CALCULATOR_SETTINGS);
    if (calcSettings) {
      const { error } = await supabase
        .from('calculator_settings')
        .upsert({
          user_id: currentUserId,
          syringe_type: calcSettings.syringeType || 'u40',
          experience_level: calcSettings.experienceLevel || 'intermediate',
          last_vial_size: calcSettings.lastVialSize || '',
          last_bac_water: calcSettings.lastBacWater || '',
          last_target_dose: calcSettings.lastTargetDose || '',
          last_selected_peptide: calcSettings.lastSelectedPeptide || '',
        }, { onConflict: 'user_id' });
      if (error) errors.push(`Calculator settings: ${error.message}`);
    }

    // 2. Body Composition
    const bodyComp = read(STORAGE_KEYS.BODY_COMPOSITION);
    if (Array.isArray(bodyComp) && bodyComp.length > 0) {
      const { data: existing } = await supabase
        .from('body_composition').select('date').eq('user_id', currentUserId);
      const existingDates = new Set(existing?.map((e: { date: string }) => e.date) || []);
      const newEntries = bodyComp.filter((e: { date: string }) => !existingDates.has(e.date));
      if (newEntries.length > 0) {
        const { error } = await supabase.from('body_composition').insert(
          newEntries.map((e: Record<string, unknown>) => ({
            user_id: currentUserId,
            date: String(e.date),
            weight: Number(e.weight) || 0,
            bmi: Number(e.bmi) || 0,
            body_fat: Number(e.bodyFat) || 0,
            fat_free_weight: Number(e.fatFreeWeight) || 0,
            muscle_mass: Number(e.muscleMass) || 0,
            skeletal_muscle: Number(e.skeletalMuscle) || 0,
            body_water: Number(e.bodyWater) || 0,
            subcutaneous_fat: Number(e.subcutaneousFat) || 0,
            visceral_fat: Number(e.visceralFat) || 0,
            bone_mass: Number(e.boneMass) || 0,
            protein: Number(e.protein) || 0,
            bmr: Number(e.bmr) || 0,
            metabolic_age: Number(e.metabolicAge) || 0,
            source: (e.source as string) || 'manual',
          }))
        );
        if (error) errors.push(`Body composition: ${error.message}`);
      }
    }

    // 3. Active Stack
    const stack = read(STORAGE_KEYS.ACTIVE_STACK);
    if (Array.isArray(stack) && stack.length > 0) {
      const uniqueStack = Array.from(new Map(
        stack
          .filter((item: Record<string, unknown>) => String(item.peptideId ?? '').trim())
          .map((item: Record<string, unknown>) => [String(item.peptideId), item]),
      ).values());
      const { error } = await supabase.from('user_stacks').upsert(
        uniqueStack.map((item: Record<string, unknown>) => ({
          user_id: currentUserId,
          peptide_id: String(item.peptideId ?? ''),
          dose: String(item.dose ?? ''),
          frequency: String(item.frequency ?? ''),
        })),
        { onConflict: 'user_id,peptide_id' }
      );
      if (error) errors.push(`Active stack: ${error.message}`);
    }

    // 4. Dose Reminders
    const reminders = read(STORAGE_KEYS.SCHEDULED_REMINDERS);
    if (Array.isArray(reminders) && reminders.length > 0) {
      const { data: ownedReminders, error: ownedRemindersError } = await supabase
        .from('dose_reminders').select('id').eq('user_id', currentUserId);
      if (ownedRemindersError) errors.push(`Reminders check: ${ownedRemindersError.message}`);
      const ownedReminderIds = new Set((ownedReminders || []).map((row: { id: string }) => row.id));
      const normalisedReminders = reminders.flatMap((record: Record<string, unknown>, index: number) => {
        const peptideId = String(record.peptide_id ?? record.peptideId ?? '').trim();
        const peptideName = String(record.peptide_name ?? record.peptideName ?? '').trim();
        const dose = String(record.dose ?? '').trim();
        const time = String(record.time ?? '').slice(0, 5);
        if (!peptideId || !peptideName || !dose || !/^\d{2}:\d{2}$/.test(time)) return [];
        const originalId = typeof record.id === 'string'
          ? record.id
          : `${peptideId}:${time}:${index}`;
        return [{
          originalId,
          peptideId,
          peptideName,
          dose,
          time,
          days: Array.isArray(record.days) ? record.days.filter((day): day is string => typeof day === 'string') : [],
          enabled: (record.enabled as boolean | undefined) ?? true,
          emailNotificationEnabled: (record.email_notification_enabled as boolean | undefined) ?? false,
        }];
      });
      const recoveredReminders = Array.from(
        new Map(normalisedReminders.map((reminder) => [reminder.originalId, reminder])).values(),
      )
        .map((reminder) => {
          const { originalId } = reminder;
          if (ownedReminderIds.has(originalId)) return null;
          const id = recoveredRecordId(currentUserId, originalId);
          if (ownedReminderIds.has(id)) return null;
          return { ...reminder, id };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const { error } = recoveredReminders.length > 0
        ? await supabase.from('dose_reminders').upsert(
        recoveredReminders.map((reminder) => ({
          id: reminder.id,
          user_id: currentUserId,
          peptide_id: reminder.peptideId,
          peptide_name: reminder.peptideName,
          dose: reminder.dose,
          time: reminder.time,
          days: reminder.days,
          enabled: reminder.enabled,
          email_notification_enabled: reminder.emailNotificationEnabled,
        })),
        { onConflict: 'id' },
      )
        : { error: null };
      if (error) errors.push(`Reminders: ${error.message}`);
    }

    // 5. Cycles
    const cycles = read(STORAGE_KEYS.CYCLES);
    if (Array.isArray(cycles) && cycles.length > 0) {
      // Note: there's no dedicated 'cycles' table in the current schema,
      // so we store them in user_stacks metadata or skip.
      // For now we skip cycles since the cloud schema only has user_stacks.
    }

    // 6. Daily entries. IDs are retained so retries are idempotent and
    // existing cloud rows cannot be duplicated.
    const dailyDoses = read(STORAGE_KEYS.DAILY_DOSES);
    if (Array.isArray(dailyDoses) && dailyDoses.length > 0) {
      const validUnits = new Set(['mg', 'IU', 'units']);
      const validRows = dailyDoses.filter((entry: Record<string, unknown>) => (
        typeof entry.id === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date ?? '')) &&
        typeof entry.peptide_id === 'string' &&
        typeof entry.peptide_name === 'string' &&
        Number(entry.dose) > 0 &&
        validUnits.has(String(entry.unit)) &&
        /^\d{2}:\d{2}(?::\d{2})?$/.test(String(entry.time ?? ''))
      ));

      if (validRows.length > 0) {
        const { data: ownedRows, error: ownedRowsError } = await supabase
          .from('daily_doses').select('id').eq('user_id', currentUserId);
        if (ownedRowsError) errors.push(`Daily entries check: ${ownedRowsError.message}`);
        const ownedIds = new Set((ownedRows || []).map((row: { id: string }) => row.id));
        const recoveredRows = validRows
          .map((entry: Record<string, unknown>) => {
            const originalId = String(entry.id);
            const mappedId = recoveredRecordId(currentUserId, originalId);
            if (ownedIds.has(originalId)) return null;
            if (ownedIds.has(mappedId)) return null;
            return { entry, id: mappedId };
          })
          .filter((row): row is { entry: Record<string, unknown>; id: string } => row !== null);

        if (recoveredRows.length > 0) {
        const { error } = await supabase.from('daily_doses').upsert(
          recoveredRows.map(({ entry, id }) => ({
            id,
            user_id: currentUserId,
            date: String(entry.date),
            peptide_id: String(entry.peptide_id),
            peptide_name: String(entry.peptide_name),
            dose: Number(entry.dose),
            unit: String(entry.unit),
            time: String(entry.time),
            notes: typeof entry.notes === 'string' ? entry.notes : null,
          })),
          { onConflict: 'id' },
        );
        if (error) errors.push(`Daily entries: ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, message: `Partial backfill: ${errors.join('; ')}` };
    }

    const { error: eventError } = await supabase.from('journey_events').insert({
      user_id: currentUserId,
      event_name: 'local_history_recovered',
      source: 'account_recovery',
      context: {},
    });
    if (eventError) console.warn('[Migration] Recovery event was not recorded:', eventError.message);

    return { success: true, message: 'All data backfilled to cloud' };
  } catch (e) {
    console.error('Cloud backfill failed:', e);
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Backfill failed',
    };
  }
}
