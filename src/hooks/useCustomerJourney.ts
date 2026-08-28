import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export type ExperienceMode = 'new_to_peptides' | 'experienced';
export type CustomerPathway = 'undecided' | 'guided' | 'research';
export type JourneyEventName =
  | 'dashboard_viewed'
  | 'experience_selected'
  | 'pathway_selected'
  | 'next_action_started'
  | 'next_action_completed'
  | 'guided_support_requested'
  | 'research_item_saved'
  | 'workspace_entry'
  | 'order_cta_clicked'
  | 'order_status_viewed'
  | 'reorder_cta_clicked'
  | 'support_opened'
  | 'measurement_tool_opened'
  | 'dose_history_viewed'
  | 'local_history_recovered';

export interface CustomerJourney {
  experience_mode: ExperienceMode | null;
  pathway: CustomerPathway;
  lifecycle_stage: string;
  primary_goal: string | null;
  onboarding_step: number;
  next_action_code: string;
  last_active_at: string;
  updated_at: string;
}

export interface DashboardSnapshot {
  journey: CustomerJourney | null;
  profile: { display_name: string | null; profile_completed: boolean } | null;
  workspace: {
    stack_items: number;
    recent_events: Array<{
      id: number;
      event_name: JourneyEventName;
      source: string;
      context: Json;
      created_at: string;
    }>;
    latest_lab_report: {
      id: string;
      status: string;
      uploaded_at: string;
      report_date: string | null;
    } | null;
  };
  commerce: OrderDashboard;
}

export interface OrderDashboard {
  order_count: number;
  latest_order: {
    id: string;
    public_ref: string;
    status: string;
    total: number;
    currency: string;
    created_at: string;
    paid_at: string | null;
    shipping_method: string | null;
  } | null;
  latest_shipment: {
    id: string;
    order_ref: string;
    status: string;
    service: string;
    courier: string | null;
    tracking_number: string | null;
    postnet_branch_name: string | null;
    promised_date: string | null;
    picked_at: string | null;
    packed_at: string | null;
    ready_for_collection_at: string | null;
    dispatched_at: string | null;
    delivered_at: string | null;
    updated_at: string;
  } | null;
  next_reorder: {
    id: string;
    product_slug: string;
    variant_label: string | null;
    due_at: string;
    source_order_id: string | null;
  } | null;
}

const EMPTY_ORDER_DASHBOARD: OrderDashboard = {
  order_count: 0,
  latest_order: null,
  latest_shipment: null,
  next_reorder: null,
};

export function useCustomerJourney() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewedForUser = useRef<string | null>(null);

  const trackEvent = useCallback(async (
    eventName: JourneyEventName,
    context: Record<string, Json> = {},
  ) => {
    if (!user) return;
    const { error: insertError } = await supabase.from('journey_events').insert({
      user_id: user.id,
      event_name: eventName,
      source: 'dashboard',
      context,
    });
    if (insertError) console.warn('[Journey] Event was not recorded:', insertError.message);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setSnapshot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const [{ data, error: rpcError }, orderResult] = await Promise.all([
      supabase.rpc('get_dashboard_snapshot'),
      supabase.rpc('get_order_dashboard'),
    ]);
    if (rpcError) {
      setError('Your dashboard could not be loaded. Please try again.');
      setIsLoading(false);
      return;
    }
    if (orderResult.error) console.warn('[Journey] Order status was not loaded:', orderResult.error.message);
    const baseSnapshot = data as unknown as Omit<DashboardSnapshot, 'commerce'>;
    setSnapshot({
      ...baseSnapshot,
      commerce: orderResult.error
        ? EMPTY_ORDER_DASHBOARD
        : (orderResult.data as unknown as OrderDashboard) ?? EMPTY_ORDER_DASHBOARD,
    });
    setIsLoading(false);

    if (viewedForUser.current !== user.id) {
      viewedForUser.current = user.id;
      void trackEvent('dashboard_viewed');
    }
  }, [trackEvent, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectExperience = useCallback(async (mode: ExperienceMode) => {
    if (!user) return false;
    const experienced = mode === 'experienced';
    const { error: upsertError } = await supabase.from('customer_journeys').upsert({
      user_id: user.id,
      experience_mode: mode,
      pathway: experienced ? 'research' : 'undecided',
      lifecycle_stage: experienced ? 'research_workspace' : 'orientation',
      onboarding_step: experienced ? 4 : 1,
      next_action_code: experienced ? 'review_workspace' : 'choose_pathway',
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertError) {
      setError('We could not save that choice. Please try again.');
      return false;
    }
    await trackEvent('experience_selected', { mode });
    if (experienced) await trackEvent('workspace_entry', { entry: 'experience_selection' });
    await refresh();
    return true;
  }, [refresh, trackEvent, user]);

  const selectPathway = useCallback(async (pathway: Exclude<CustomerPathway, 'undecided'>) => {
    if (!user) return false;
    const guided = pathway === 'guided';
    const { error: updateError } = await supabase.from('customer_journeys').update({
      pathway,
      lifecycle_stage: guided ? 'guided_intake' : 'research_workspace',
      onboarding_step: guided ? 2 : 4,
      next_action_code: guided ? 'complete_guided_intake' : 'review_research_library',
      last_active_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    if (updateError) {
      setError('We could not save that pathway. Please try again.');
      return false;
    }
    await trackEvent('pathway_selected', { pathway });
    await refresh();
    return true;
  }, [refresh, trackEvent, user]);

  const isOnboarding = isLoading
    || !snapshot?.journey?.experience_mode
    || (snapshot.journey.experience_mode === 'new_to_peptides' && snapshot.journey.pathway === 'undecided');

  return {
    snapshot,
    isLoading,
    isOnboarding,
    error,
    refresh,
    selectExperience,
    selectPathway,
    trackEvent,
  };
}
