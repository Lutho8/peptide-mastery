// CRM client helper — fire-and-forget lead capture into the owned Supabase CRM.
// Never blocks UX. Failures are logged to the console only.

import { supabase } from '@/integrations/supabase/client';

export type ActivityType =
  | 'page_view'
  | 'qa_signup'
  | 'course_start'
  | 'calculator_use'
  | 'premium_click'
  | 'pricing_view'
  | 'peptide_search'
  | 'email_open'
  | 'consultation_booked'
  | 'store_click'
  | 'account_created';

export type PlanInterest = 'free' | 'premium' | 'undecided';

export interface CaptureLeadInput {
  email?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source: string;
  planInterest?: PlanInterest;
  activityType: ActivityType;
  activityData?: Record<string, unknown>;
}

const SESSION_KEY = 'rtd-session-id';
const LAST_LEAD_EMAIL_KEY = 'rtd-last-lead-email';

/**
 * Last email captured by any surface in this browser. Used as a fallback so
 * anonymous Premium CTAs can still be attributed to a known lead (e.g. a
 * visitor who registered for the Q&A then clicked "Go Premium" without
 * signing in).
 */
export function getLastLeadEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_LEAD_EMAIL_KEY);
  } catch {
    return null;
  }
}

function rememberLeadEmail(email: string) {
  try {
    localStorage.setItem(LAST_LEAD_EMAIL_KEY, email);
  } catch {
    /* noop */
  }
}

export function getCrmSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        crypto.randomUUID?.() ??
        `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

export async function captureLead(input: CaptureLeadInput): Promise<void> {
  const explicitEmail = (input.email ?? '').trim().toLowerCase();
  // Fall back to the last captured lead email so anonymous Premium clicks
  // still attach to the correct CRM record.
  const email = explicitEmail || (getLastLeadEmail() ?? '');
  if (!email) return;
  if (explicitEmail) rememberLeadEmail(explicitEmail);

  try {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const sessionId = getCrmSessionId();

    await supabase.functions.invoke('crm-capture', {
      body: {
        action: 'capture_lead',
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        source: input.source,
        planInterest: input.planInterest ?? 'undecided',
        activityType: input.activityType,
        activityData: input.activityData,
        pageUrl,
        sessionId,
      },
    });
  } catch (err) {
    // Never block UX on CRM failures.
    console.warn('[crm] captureLead failed:', err);
  }
}
