-- Extend the immutable dashboard event vocabulary for access recovery and
-- high-value current-user tools. No clinical values are stored in context.

alter table tracker.journey_events
  drop constraint if exists journey_events_event_name_check;

alter table tracker.journey_events
  add constraint journey_events_event_name_check check (event_name in (
    'dashboard_viewed', 'experience_selected', 'pathway_selected',
    'next_action_started', 'next_action_completed', 'guided_support_requested',
    'research_item_saved', 'workspace_entry', 'order_cta_clicked',
    'order_status_viewed', 'reorder_cta_clicked', 'support_opened',
    'measurement_tool_opened', 'dose_history_viewed', 'local_history_recovered'
  ));

notify pgrst, 'reload schema';
