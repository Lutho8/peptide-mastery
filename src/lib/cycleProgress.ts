// Cycle progress driven by actual daily-log entries.
// A cycle no longer auto-advances by wall-clock time — it advances only when
// the user logs a dose for that peptide. This means a weekly peptide stays at
// "1 / N" until the next dose is logged, and a daily peptide pauses on days
// without a log.

import type { Cycle } from '@/services/storage';
import type { DailyDoseEntry } from '@/hooks/useDailyDoses';

export interface CycleProgress {
  /** Distinct dose occurrences logged for this cycle's peptide since startDate */
  dosesLogged: number;
  /** Doses the schedule expects by today (frequency × elapsed time, capped at planned) */
  dosesExpected: number;
  /** Total planned doses for the whole cycle */
  dosesPlanned: number;
  /** % complete based on logged / planned */
  progress: number;
  /** Approaching end of cycle (>=85% of planned doses logged) */
  isNearing: boolean;
  /** Logged >= planned */
  isOverdue: boolean;
  /** Wall-clock days since startDate, for contextual labels only */
  calendarDays: number;
  /** Doses behind the expected pace (>= 0) */
  dosesBehind: number;
  /** Doses per week implied by the frequency string */
  perWeek: number;
}

/** Normalise an id or peptide name to a comparable slug. */
function slug(s: string | undefined | null): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Parse a frequency string into doses-per-week. Unknown → daily (7). */
export function parseFrequencyPerWeek(frequency: string | undefined): number {
  if (!frequency) return 7;
  const f = frequency.toLowerCase().trim();

  // Multiple doses per day
  if (/(2x|twice)\s*(daily|\/?\s*day)/.test(f) || f.includes('split')) return 14;
  if (/(3x|thrice)\s*(daily|\/?\s*day)/.test(f)) return 21;

  // Every other day / EOD / alternate
  if (f.includes('eod') || f.includes('every other day') || f.includes('alternate')) return 3.5;

  // Nx per week / Nx weekly
  const xWeekly = f.match(/(\d+)\s*x\s*\/?\s*(week|weekly)/);
  if (xWeekly) return Math.min(14, Math.max(1, parseInt(xWeekly[1], 10)));

  // "N times weekly"
  const nTimes = f.match(/(\d+)\s*times?\s*(per\s*)?week/);
  if (nTimes) return Math.min(14, Math.max(1, parseInt(nTimes[1], 10)));

  // Once weekly / weekly
  if (f.includes('weekly') || f.includes('once a week') || f.includes('per week')) return 1;

  // Monthly
  if (f.includes('monthly')) return 0.25;

  // Daily / every day / every night / morning / bedtime — default
  return 7;
}

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Local YYYY-MM-DD (avoids UTC drift from toISOString().split('T')[0]). */
function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


/**
 * Count logged doses for a cycle's peptide between startDate and now.
 * Daily peptides collapse multiple same-day logs into one occurrence so a
 * burst of corrective entries doesn't fast-forward the cycle.
 */
function countLoggedDoses(cycle: Cycle, doses: DailyDoseEntry[], perWeek: number, splitParts: number): number {
  const cycleSlugs = new Set([slug(cycle.peptideId), slug(cycle.peptideName)].filter(Boolean));
  const startStr = cycle.startDate;

  const matches = doses.filter(d => {
    if (d.date < startStr) return false;
    return cycleSlugs.has(slug(d.peptide_id)) || cycleSlugs.has(slug(d.peptide_name));
  });

  // Group by date so N same-day sub-doses collapse into max(1, floor(N/split))
  // complete doses. This applies for ALL cadences: split AM+PM weekly = 1/week.
  const byDay = new Map<string, number>();
  for (const m of matches) byDay.set(m.date, (byDay.get(m.date) ?? 0) + 1);

  let complete = 0;
  for (const count of byDay.values()) {
    complete += Math.max(1, Math.floor(count / Math.max(1, splitParts)));
  }
  // For daily-or-more cadences each unique day still counts at most once if no splits.
  if (perWeek >= 7 && splitParts <= 1) return byDay.size;
  return complete;
}

export function getCycleProgress(
  cycle: Cycle,
  doses: DailyDoseEntry[] = [],
  now: Date = new Date(),
): CycleProgress {
  const perWeek = parseFrequencyPerWeek(cycle.frequency);
  const splitParts = Math.max(1, cycle.splitParts ?? 1);
  const start = new Date(cycle.startDate);
  const calendarDays = daysBetween(start, now);

  // Planned dose count = complete doses for the whole cycle.
  const completePerWeek = perWeek / splitParts;
  const dosesPlanned = Math.max(1, Math.round((cycle.plannedDuration / 7) * completePerWeek));

  // Expected by today based on the schedule (capped at planned).
  const dosesExpectedRaw = Math.floor(((calendarDays + 1) / 7) * completePerWeek);
  const dosesExpected = Math.min(dosesPlanned, Math.max(0, dosesExpectedRaw));

  const dosesLogged = Math.min(dosesPlanned, countLoggedDoses(cycle, doses, perWeek, splitParts));
  const dosesBehind = Math.max(0, dosesExpected - dosesLogged);

  const progress = Math.min(100, (dosesLogged / dosesPlanned) * 100);
  const warningThreshold = dosesPlanned * 0.85;

  return {
    dosesLogged,
    dosesExpected,
    dosesPlanned,
    progress,
    isNearing: dosesLogged >= warningThreshold && dosesLogged < dosesPlanned,
    isOverdue: dosesLogged >= dosesPlanned,
    calendarDays,
    dosesBehind,
    perWeek: completePerWeek,
  };
}

/** Short status word used in badges / labels. */
export function cycleStatusLabel(p: CycleProgress, status?: string): string {
  if (status === 'break') return 'Paused';
  if (p.isOverdue) return 'Complete';
  if (p.dosesLogged === 0) return 'Not Started';
  if (p.isNearing) return 'Nearing End';
  // Weekly / sub-daily cadence: a single missed expected dose pauses the cycle
  if (p.perWeek < 7 && p.dosesBehind >= 1) return 'Paused';
  if (p.dosesBehind >= 2) return 'Behind';
  return 'On Track';
}

/**
 * Return the set of YYYY-MM-DD dates with a logged dose for this cycle's peptide,
 * on or after the cycle start. Used by calendars to highlight only days the user
 * actually logged — the cycle does not advance for empty days.
 */
export function getLoggedDoseDates(
  cycle: Cycle,
  doses: DailyDoseEntry[] = [],
): Set<string> {
  const cycleSlugs = new Set(
    [slug(cycle.peptideId), slug(cycle.peptideName)].filter(Boolean),
  );
  const out = new Set<string>();
  for (const d of doses) {
    if (d.date < cycle.startDate) continue;
    if (cycleSlugs.has(slug(d.peptide_id)) || cycleSlugs.has(slug(d.peptide_name))) {
      out.add(d.date);
    }
  }
  return out;
}

/** Doses matching this cycle's peptide on/after startDate, sorted ascending by date+time. */
function matchedDoses(cycle: Cycle, doses: DailyDoseEntry[]): DailyDoseEntry[] {
  const cycleSlugs = new Set([slug(cycle.peptideId), slug(cycle.peptideName)].filter(Boolean));
  return doses
    .filter(d => d.date >= cycle.startDate && (cycleSlugs.has(slug(d.peptide_id)) || cycleSlugs.has(slug(d.peptide_name))))
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}

export type CyclePhase =
  | 'not_started'
  | 'ramp_up'
  | 'maintenance'
  | 'taper'
  | 'complete'
  | 'paused';

export interface PhaseInfo {
  phase: CyclePhase;
  label: string;
  weekNow: number;
  weeksTotal: number;
  weeksLeft: number;
}

export function getCyclePhase(cycle: Cycle, info: CycleProgress): PhaseInfo {
  const weeksTotal = Math.max(1, Math.ceil(cycle.plannedDuration / 7));
  const weekNow = Math.min(weeksTotal, Math.max(1, Math.floor(info.calendarDays / 7) + 1));
  const weeksLeft = Math.max(0, weeksTotal - weekNow);

  if (cycle.status === 'break') {
    return { phase: 'paused', label: 'Paused', weekNow, weeksTotal, weeksLeft };
  }
  if (info.isOverdue) {
    return { phase: 'complete', label: 'Break recommended', weekNow, weeksTotal, weeksLeft: 0 };
  }
  if (info.dosesLogged === 0) {
    return { phase: 'not_started', label: 'Not started', weekNow: 1, weeksTotal, weeksLeft: weeksTotal };
  }
  const pct = info.dosesLogged / info.dosesPlanned;
  if (pct < 0.2) return { phase: 'ramp_up', label: 'Ramp-up', weekNow, weeksTotal, weeksLeft };
  if (pct >= 0.85) return { phase: 'taper', label: 'Taper / nearing end', weekNow, weeksTotal, weeksLeft };
  return { phase: 'maintenance', label: 'Maintenance', weekNow, weeksTotal, weeksLeft };
}

export interface NextDoseInfo {
  /** ISO date YYYY-MM-DD when the next dose is expected */
  date: string;
  /** Time HH:MM if we can infer it from the last log, else null */
  time: string | null;
  /** Whole days from today (negative if overdue) */
  daysFromToday: number;
  /** Friendly label: "Today", "Tomorrow", "in 3 days", "2 days overdue" */
  label: string;
}

export function getNextDose(
  cycle: Cycle,
  doses: DailyDoseEntry[] = [],
  now: Date = new Date(),
  doseTimes?: string[],
): NextDoseInfo | null {
  if (cycle.status === 'break') return null;
  const perWeek = parseFrequencyPerWeek(cycle.frequency);
  if (perWeek <= 0) return null;
  const intervalDays = 7 / perWeek;

  const slots = (doseTimes && doseTimes.length > 0)
    ? doseTimes
    : (cycle.doseTimes && cycle.doseTimes.length > 0 ? cycle.doseTimes : []);

  const logs = matchedDoses(cycle, doses);
  const todayIso = localIso(now);
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Same-day upcoming slot beats a next-interval calculation.
  if (slots.length > 0) {
    const upcomingToday = slots.filter(t => t > nowHM).sort();
    if (upcomingToday.length > 0) {
      // Only offer today's next slot if we haven't already logged all today's slots.
      const loggedToday = logs.filter(l => l.date === todayIso).length;
      if (loggedToday < slots.length) {
        return formatNextDose(new Date(todayIso + 'T00:00:00'), upcomingToday[0], now);
      }
    }
  }

  let anchor: Date;
  let time: string | null = slots[0] || null;

  if (logs.length === 0) {
    anchor = new Date(cycle.startDate);
    const next = anchor > now ? anchor : new Date(todayIso + 'T00:00:00');
    return formatNextDose(next, time, now);
  }

  const last = logs[logs.length - 1];
  anchor = new Date(last.date + 'T00:00:00');
  const next = new Date(anchor);
  next.setDate(next.getDate() + Math.max(1, Math.round(intervalDays)));
  return formatNextDose(next, time ?? last.time ?? null, now);
}

function formatNextDose(next: Date, time: string | null, now: Date): NextDoseInfo {
  const today = new Date(localIso(now) + 'T00:00:00');
  const nextDay = new Date(localIso(next) + 'T00:00:00');
  const days = Math.round((nextDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let label: string;
  if (days < 0) label = `${Math.abs(days)}d overdue`;
  else if (days === 0) label = time ? `Today ${time}` : 'Today';
  else if (days === 1) label = time ? `Tomorrow ${time}` : 'Tomorrow';
  else label = `in ${days} days`;
  return { date: localIso(nextDay), time, daysFromToday: days, label };
}


export type BackdateConflictReason =
  | 'before_start'
  | 'over_frequency_for_week'
  | 'outside_planned_duration';

export interface BackdateConflict {
  date: string;
  time: string | null;
  dose: number;
  unit: string;
  reason: BackdateConflictReason;
  weekIndex: number | null;
  detail: string;
  doseId: string;
}

export interface BackdateValidation {
  ok: boolean;
  severity: 'info' | 'warning';
  message: string;
  logsBeforeStart: number;
  logsAfterStart: number;
  expectedByNow: number;
  conflicts: BackdateConflict[];
}

/**
 * Validate a proposed start date against logged doses. Returns a structured
 * `conflicts` array so the UI can list every offending Daily-Log entry.
 * `splitParts` collapses N same-day sub-doses into 1 complete dose before
 * checking weekly cadence.
 */
export function validateBackdate(
  peptideId: string,
  peptideName: string,
  startDate: string,
  frequency: string,
  doses: DailyDoseEntry[],
  now: Date = new Date(),
  opts: { plannedDuration?: number; splitParts?: number } = {},
): BackdateValidation {
  const cycleSlugs = new Set([slug(peptideId), slug(peptideName)].filter(Boolean));
  const matched = doses
    .filter(d => cycleSlugs.has(slug(d.peptide_id)) || cycleSlugs.has(slug(d.peptide_name)))
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));

  const splitParts = Math.max(1, opts.splitParts ?? 1);
  const perWeek = parseFrequencyPerWeek(frequency);
  const start = new Date(startDate);
  const calendarDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  const expectedByNow = Math.max(1, Math.round(((calendarDays + 1) / 7) * perWeek));
  const plannedDuration = opts.plannedDuration;

  const conflicts: BackdateConflict[] = [];
  const weekBuckets = new Map<number, DailyDoseEntry[]>();

  for (const d of matched) {
    if (d.date < startDate) {
      conflicts.push({
        date: d.date, time: d.time || null, dose: d.dose, unit: d.unit,
        reason: 'before_start', weekIndex: null,
        detail: `Logged ${d.dose} ${d.unit} on ${d.date} — before this start date, won't count.`,
        doseId: d.id,
      });
      continue;
    }
    const weekIdx = Math.floor((new Date(d.date).getTime() - start.getTime()) / (7 * 86400000));
    if (plannedDuration && weekIdx >= Math.ceil(plannedDuration / 7)) {
      conflicts.push({
        date: d.date, time: d.time || null, dose: d.dose, unit: d.unit,
        reason: 'outside_planned_duration', weekIndex: weekIdx,
        detail: `Logged ${d.dose} ${d.unit} on ${d.date} — past the planned ${plannedDuration}-day window.`,
        doseId: d.id,
      });
      continue;
    }
    if (!weekBuckets.has(weekIdx)) weekBuckets.set(weekIdx, []);
    weekBuckets.get(weekIdx)!.push(d);
  }

  const expectedPerWeek = Math.max(1, Math.round(perWeek));
  for (const [weekIdx, entries] of weekBuckets) {
    const byDay = new Map<string, DailyDoseEntry[]>();
    for (const e of entries) {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date)!.push(e);
    }
    let completeDoses = 0;
    for (const dayEntries of byDay.values()) {
      completeDoses += Math.max(1, Math.floor(dayEntries.length / splitParts));
    }
    if (completeDoses > expectedPerWeek) {
      const sorted = [...entries].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
      const allowed = expectedPerWeek * splitParts;
      sorted.slice(allowed).forEach(d => {
        conflicts.push({
          date: d.date, time: d.time || null, dose: d.dose, unit: d.unit,
          reason: 'over_frequency_for_week', weekIndex: weekIdx,
          detail: `Week ${weekIdx + 1} already has ${expectedPerWeek} complete dose${expectedPerWeek === 1 ? '' : 's'}; extra ${d.dose} ${d.unit} on ${d.date} won't add a week.`,
          doseId: d.id,
        });
      });
    }
  }

  const logsBeforeStart = conflicts.filter(c => c.reason === 'before_start').length;
  const logsAfterStart = matched.length - logsBeforeStart;

  if (conflicts.length > 0) {
    const parts: string[] = [];
    if (logsBeforeStart) parts.push(`${logsBeforeStart} before start`);
    if (conflicts.some(c => c.reason === 'over_frequency_for_week')) parts.push(`some weeks exceed ${expectedPerWeek}× cadence`);
    if (conflicts.some(c => c.reason === 'outside_planned_duration')) parts.push(`some past the planned window`);
    return {
      ok: false, severity: 'warning',
      message: `${parts.join(' · ')} — review ${conflicts.length} entr${conflicts.length === 1 ? 'y' : 'ies'} below.`,
      logsBeforeStart, logsAfterStart, expectedByNow, conflicts,
    };
  }

  if (logsAfterStart === 0 && start < now && calendarDays > 7) {
    return {
      ok: true, severity: 'info',
      message: `No doses logged in the past ${calendarDays} days. The week counter advances but progress stays at 0% until you log a dose.`,
      logsBeforeStart: 0, logsAfterStart: 0, expectedByNow, conflicts: [],
    };
  }

  return {
    ok: true, severity: 'info',
    message: `${logsAfterStart} dose${logsAfterStart === 1 ? '' : 's'} logged since ${startDate} — no conflicts.`,
    logsBeforeStart: 0, logsAfterStart, expectedByNow, conflicts: [],
  };
}

/**
 * Compute the absolute next-fire timestamp (ms since epoch) for the next dose
 * in this cycle, used to schedule push reminders. Returns null when nothing
 * to schedule.
 */
export function computeNextFireAt(
  cycle: Cycle,
  doses: DailyDoseEntry[],
  preferredTime: string = '09:00',
  leadMinutes: number = 0,
  now: Date = new Date(),
): number | null {
  const next = getNextDose(cycle, doses, now, [preferredTime]);
  if (!next) return null;
  const time = next.time || preferredTime;
  const [h, m] = time.split(':').map(Number);
  const dt = new Date(next.date + 'T00:00:00');
  dt.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  let fireAt = dt.getTime() - leadMinutes * 60_000;
  if (fireAt <= now.getTime()) {
    const perWeek = parseFrequencyPerWeek(cycle.frequency);
    const stepDays = perWeek > 0 ? Math.max(1, Math.round(7 / perWeek)) : 1;
    fireAt += stepDays * 24 * 60 * 60_000;
  }
  return fireAt;
}

/**
 * Recalculate cycle metadata from logged doses:
 *  - startDate = earliest logged dose (if earlier than current start)
 *  - plannedDuration unchanged
 *  - status = 'active' if currently 'break' but recent doses logged
 * Returns the updated cycle (or the original if nothing to change).
 */
export function recalculateCycle(
  cycle: Cycle,
  doses: DailyDoseEntry[],
  now: Date = new Date(),
): { cycle: Cycle; changed: boolean; summary: string } {
  const cycleSlugs = new Set([slug(cycle.peptideId), slug(cycle.peptideName)].filter(Boolean));
  const matched = doses
    .filter(d => cycleSlugs.has(slug(d.peptide_id)) || cycleSlugs.has(slug(d.peptide_name)))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (matched.length === 0) {
    return { cycle, changed: false, summary: 'No logged doses found — nothing to reconcile.' };
  }

  const earliest = matched[0].date;
  const latest = matched[matched.length - 1].date;
  const todayIso = now.toISOString().split('T')[0];
  const daysSinceLast = Math.floor((new Date(todayIso).getTime() - new Date(latest).getTime()) / 86400000);

  let next: Cycle = { ...cycle };
  const changes: string[] = [];

  if (earliest < cycle.startDate) {
    next.startDate = earliest;
    changes.push(`start date moved to ${earliest}`);
  }

  // Auto-resume if paused but doses are recent
  if (cycle.status === 'break' && daysSinceLast <= 3) {
    next.status = 'active';
    next.resumedAt = todayIso;
    next.pauseReason = undefined;
    changes.push('cycle resumed (recent doses detected)');
  }

  // Auto-pause if active but no doses in 14+ days
  if (cycle.status === 'active' && daysSinceLast >= 14) {
    next.status = 'break';
    next.pausedAt = todayIso;
    next.pauseReason = 'missed_doses';
    next.missedDays = daysSinceLast;
    changes.push(`paused (${daysSinceLast} days since last dose)`);
  }

  const changed = changes.length > 0;
  return {
    cycle: next,
    changed,
    summary: changed
      ? `Reconciled: ${changes.join(', ')}.`
      : `Already in sync (${matched.length} dose${matched.length === 1 ? '' : 's'} logged, last on ${latest}).`,
  };
}

