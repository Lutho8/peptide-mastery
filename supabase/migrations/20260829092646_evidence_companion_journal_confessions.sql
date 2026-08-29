-- Evidence companion: private journal, privacy-preserving AI usage counters,
-- and a moderated, free-to-read community Confessions feed.
--
-- Personal dosing is never generated or stored by this migration. Journal
-- content is user-authored and owner-only; community posts remain pending until
-- an administrator explicitly publishes them.

create table tracker.research_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null default 'note'
    check (entry_type in ('note', 'ask', 'measurement', 'milestone')),
  peptide_id text,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 6000),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index research_journal_entries_user_date_idx
  on tracker.research_journal_entries (user_id, entry_date desc, created_at desc);

create table tracker.ai_request_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  peptide_id text,
  created_at timestamptz not null default now()
);

create index ai_request_usage_user_created_idx
  on tracker.ai_request_usage (user_id, created_at desc);

create table tracker.community_confessions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  display_alias text not null default 'Anonymous researcher'
    check (char_length(display_alias) between 2 and 40),
  is_anonymous boolean not null default true,
  category text not null
    check (category in (
      'what_helped', 'what_surprised_me', 'what_i_wish_i_knew',
      'side_effects', 'measurement_lesson'
    )),
  peptide_ids text[] not null default '{}',
  title text not null check (char_length(title) between 5 and 120),
  body text not null check (char_length(body) between 40 and 3000),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'published', 'rejected')),
  moderation_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (moderation_status = 'published' and published_at is not null)
    or (moderation_status <> 'published' and published_at is null)
  )
);

create index community_confessions_public_feed_idx
  on tracker.community_confessions (published_at desc, created_at desc)
  where moderation_status = 'published';
create index community_confessions_author_created_idx
  on tracker.community_confessions (author_id, created_at desc);

create trigger research_journal_entries_set_updated_at
  before update on tracker.research_journal_entries
  for each row execute function tracker.update_updated_at_column();

create trigger community_confessions_set_updated_at
  before update on tracker.community_confessions
  for each row execute function tracker.update_updated_at_column();

alter table tracker.research_journal_entries enable row level security;
alter table tracker.ai_request_usage enable row level security;
alter table tracker.community_confessions enable row level security;

revoke all on tracker.research_journal_entries from public, anon, authenticated;
revoke all on tracker.ai_request_usage from public, anon, authenticated;
revoke all on tracker.community_confessions from public, anon, authenticated;
revoke all on sequence tracker.ai_request_usage_id_seq from public, anon, authenticated;

grant select, insert, update, delete on tracker.research_journal_entries to authenticated;
grant select, insert on tracker.ai_request_usage to authenticated;
grant usage, select on sequence tracker.ai_request_usage_id_seq to authenticated;
grant select on tracker.community_confessions to anon;
grant select, insert, update, delete on tracker.community_confessions to authenticated;

grant all on tracker.research_journal_entries to service_role;
grant all on tracker.ai_request_usage to service_role;
grant usage, select on sequence tracker.ai_request_usage_id_seq to service_role;
grant all on tracker.community_confessions to service_role;

create policy research_journal_owner_select
  on tracker.research_journal_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy research_journal_owner_insert
  on tracker.research_journal_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy research_journal_owner_update
  on tracker.research_journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy research_journal_owner_delete
  on tracker.research_journal_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy ai_request_usage_owner_select
  on tracker.ai_request_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy ai_request_usage_owner_insert
  on tracker.ai_request_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy confessions_public_read
  on tracker.community_confessions for select to anon, authenticated
  using (moderation_status = 'published' and published_at <= now());
create policy confessions_owner_read
  on tracker.community_confessions for select to authenticated
  using ((select auth.uid()) = author_id);
create policy confessions_owner_submit
  on tracker.community_confessions for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and moderation_status = 'pending'
    and published_at is null
    and moderation_note is null
  );
create policy confessions_owner_edit_pending
  on tracker.community_confessions for update to authenticated
  using ((select auth.uid()) = author_id and moderation_status = 'pending')
  with check (
    (select auth.uid()) = author_id
    and moderation_status = 'pending'
    and published_at is null
    and moderation_note is null
  );
create policy confessions_owner_delete
  on tracker.community_confessions for delete to authenticated
  using ((select auth.uid()) = author_id);
create policy confessions_admin_all
  on tracker.community_confessions for all to authenticated
  using (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role))
  with check (tracker.has_role((select auth.uid()), 'admin'::tracker.app_role));

alter table tracker.journey_events
  drop constraint if exists journey_events_event_name_check;

alter table tracker.journey_events
  add constraint journey_events_event_name_check check (event_name in (
    'dashboard_viewed', 'experience_selected', 'pathway_selected',
    'next_action_started', 'next_action_completed', 'guided_support_requested',
    'research_item_saved', 'workspace_entry', 'order_cta_clicked',
    'order_status_viewed', 'reorder_cta_clicked', 'support_opened',
    'measurement_tool_opened', 'dose_history_viewed', 'local_history_recovered',
    'ai_question_asked', 'ai_answer_saved', 'journal_entry_created',
    'confession_submitted', 'confession_feed_viewed'
  ));

notify pgrst, 'reload schema';
