-- Evidence-to-tracker workspace and private customer COA vault.
--
-- Research saves retain the evidence snapshot the user saw at the time.
-- COA documents are owner-only and files live in a separate private bucket.

create table tracker.research_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  peptide_id text not null check (char_length(peptide_id) between 1 and 100),
  goal_id text not null default 'general-research'
    check (char_length(goal_id) between 1 and 80),
  evidence_version text not null check (char_length(evidence_version) between 1 and 40),
  evidence_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, peptide_id, goal_id)
);

create index research_saves_user_created_idx
  on tracker.research_saves (user_id, created_at desc);

create table tracker.user_coa_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  peptide_id text check (peptide_id is null or char_length(peptide_id) between 1 and 100),
  file_path text not null unique check (char_length(file_path) between 3 and 500),
  original_filename text not null check (char_length(original_filename) between 1 and 240),
  mime_type text not null check (mime_type in (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
  )),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'reviewed', 'needs_attention')),
  sample_name text check (sample_name is null or char_length(sample_name) <= 200),
  lab_name text check (lab_name is null or char_length(lab_name) <= 160),
  report_number text check (report_number is null or char_length(report_number) <= 120),
  batch_number text check (batch_number is null or char_length(batch_number) <= 120),
  tested_at date,
  identity_status text not null default 'not_reported'
    check (identity_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  hplc_status text not null default 'not_reported'
    check (hplc_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  purity_pct numeric(6,3) check (purity_pct is null or (purity_pct >= 0 and purity_pct <= 100)),
  assay_status text not null default 'not_reported'
    check (assay_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  assay_pct numeric(6,3) check (assay_pct is null or (assay_pct >= 0 and assay_pct <= 100)),
  net_content_status text not null default 'not_reported'
    check (net_content_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  net_content_mg numeric(10,3) check (net_content_mg is null or net_content_mg >= 0),
  endotoxin_status text not null default 'not_reported'
    check (endotoxin_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  sterility_status text not null default 'not_reported'
    check (sterility_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  traceability_status text not null default 'not_reported'
    check (traceability_status in ('shown', 'incomplete', 'not_reported', 'not_applicable')),
  notes text check (notes is null or char_length(notes) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_coa_documents_user_created_idx
  on tracker.user_coa_documents (user_id, created_at desc);
create index user_coa_documents_user_peptide_idx
  on tracker.user_coa_documents (user_id, peptide_id, created_at desc);

create trigger research_saves_set_updated_at
  before update on tracker.research_saves
  for each row execute function tracker.update_updated_at_column();

create trigger user_coa_documents_set_updated_at
  before update on tracker.user_coa_documents
  for each row execute function tracker.update_updated_at_column();

alter table tracker.research_saves enable row level security;
alter table tracker.user_coa_documents enable row level security;

revoke all on tracker.research_saves from public, anon, authenticated;
revoke all on tracker.user_coa_documents from public, anon, authenticated;
grant select, insert, update, delete on tracker.research_saves to authenticated;
grant select, insert, update, delete on tracker.user_coa_documents to authenticated;
grant all on tracker.research_saves to service_role;
grant all on tracker.user_coa_documents to service_role;

create policy research_saves_owner_select
  on tracker.research_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy research_saves_owner_insert
  on tracker.research_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy research_saves_owner_update
  on tracker.research_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy research_saves_owner_delete
  on tracker.research_saves for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy user_coa_documents_owner_select
  on tracker.user_coa_documents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy user_coa_documents_owner_insert
  on tracker.user_coa_documents for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and split_part(file_path, '/', 1) = (select auth.uid())::text
  );
create policy user_coa_documents_owner_update
  on tracker.user_coa_documents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and split_part(file_path, '/', 1) = (select auth.uid())::text
  );
create policy user_coa_documents_owner_delete
  on tracker.user_coa_documents for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coa-vault',
  'coa-vault',
  false,
  12582912,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy coa_vault_owner_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'coa-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy coa_vault_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coa-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy coa_vault_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'coa-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'coa-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy coa_vault_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'coa-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

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
    'confession_submitted', 'confession_feed_viewed',
    'evidence_passport_viewed', 'research_comparison_viewed',
    'research_plan_saved', 'coa_document_uploaded', 'coa_document_deleted'
  ));

notify pgrst, 'reload schema';
