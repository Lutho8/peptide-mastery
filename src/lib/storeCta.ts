import { track } from '@/lib/analytics';
import { getCrmSessionId, getLastLeadEmail } from '@/lib/crm';
import { supabase } from '@/integrations/supabase/client';

export interface StoreCtaClick {
  placement: string;
  destination: string;
}

/**
 * Records the commercial handoff without delaying or controlling navigation.
 * The Edge Function safely links the event to the authenticated account or a
 * previously captured lead when available; otherwise it remains an anonymous
 * aggregate commerce event.
 */
export function recordStoreCtaClick({ placement, destination }: StoreCtaClick): void {
  track('buy_peptides_cta_clicked', { placement });

  void supabase.functions.invoke('crm-capture', {
    body: {
      action: 'track_store_cta',
      email: getLastLeadEmail(),
      placement,
      destination,
      source: `store_cta_${placement}`,
      pageUrl: typeof window === 'undefined' ? undefined : window.location.href,
      sessionId: getCrmSessionId(),
    },
  }).then(({ error }) => {
    if (error) console.warn('[commerce] Store CTA was not recorded:', error.message);
  }).catch((error: unknown) => {
    console.warn('[commerce] Store CTA was not recorded:', error);
  });
}
