import type { MeasurementAmountUnit } from '@/lib/measurementMath';

export type MeasurementGuidanceMode = 'beginner' | 'intermediate' | 'athlete';

export type MeasurementScheduleMode =
  | 'not-recorded'
  | 'daily'
  | 'twice-daily'
  | 'weekly'
  | 'twice-weekly'
  | 'three-weekly'
  | 'custom';

export const MEASUREMENT_GUIDANCE = [
  {
    id: 'beginner' as const,
    label: 'Entry-level guidance',
    shortLabel: 'Entry',
    description: 'Explains every input and adds a final label-and-syringe checklist.',
  },
  {
    id: 'intermediate' as const,
    label: 'Intermediate guidance',
    shortLabel: 'Intermediate',
    description: 'Keeps the workflow compact while preserving the verification maths.',
  },
  {
    id: 'athlete' as const,
    label: 'Athlete tracking',
    shortLabel: 'Athlete',
    description: 'Emphasises repeatable setup, schedule consistency and record keeping.',
  },
] as const;

export const MEASUREMENT_SCHEDULES = [
  { id: 'not-recorded' as const, label: 'Not recorded' },
  { id: 'daily' as const, label: 'Daily' },
  { id: 'twice-daily' as const, label: 'Twice daily' },
  { id: 'weekly' as const, label: 'Weekly' },
  { id: 'twice-weekly' as const, label: 'Twice weekly' },
  { id: 'three-weekly' as const, label: 'Three times weekly' },
  { id: 'custom' as const, label: 'Custom / as recorded' },
] as const;

export function parseRecordedMeasurementAmount(
  value: string,
): { value: string; unit: MeasurementAmountUnit } | null {
  const match = value.trim().match(/([0-9]*\.?[0-9]+)\s*(mg|mcg|ug|µg)\b/i);
  if (!match || Number(match[1]) <= 0) return null;
  const unit = match[2].toLowerCase() === 'mg' ? 'mg' : 'mcg';
  return { value: match[1], unit };
}

export function inferMeasurementSchedule(
  frequency: string | undefined,
): { mode: MeasurementScheduleMode; details: string } {
  const raw = frequency?.trim() || '';
  if (!raw) return { mode: 'not-recorded', details: '' };

  const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
  if (/\b(2x|twice)\b.*\b(daily|day)\b|\b(daily|day)\b.*\b(2x|twice)\b/.test(normalized)) {
    return { mode: 'twice-daily', details: raw };
  }
  if (/\b(3x|three times)\b.*\bweek|\bweek\b.*\b(3x|three times)\b/.test(normalized)) {
    return { mode: 'three-weekly', details: raw };
  }
  if (/\b(2x|twice)\b.*\bweek|\bweek\b.*\b(2x|twice)\b/.test(normalized)) {
    return { mode: 'twice-weekly', details: raw };
  }
  if (/\b(daily|every day|once a day)\b/.test(normalized)) {
    return { mode: 'daily', details: raw };
  }
  if (/\b(weekly|once a week|every week)\b/.test(normalized)) {
    return { mode: 'weekly', details: raw };
  }
  return { mode: 'custom', details: raw };
}

export function formatMeasurementSchedule(
  mode: MeasurementScheduleMode,
  details: string,
): string {
  const detail = details.trim();
  if (detail) return detail;
  return MEASUREMENT_SCHEDULES.find((option) => option.id === mode)?.label || 'Not recorded';
}
