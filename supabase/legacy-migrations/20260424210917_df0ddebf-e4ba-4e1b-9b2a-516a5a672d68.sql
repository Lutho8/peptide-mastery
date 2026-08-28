create table public.protocol_adherence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lab_report_id uuid not null,
  section text not null check (section in ('supplements','nutrition','exercise','stress')),
  item_key text not null,
  item_label text not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lab_report_id, section, item_key)
);

alter table public.protocol_adherence enable row level security;

create policy "Users view own adherence"
  on public.protocol_adherence for select
  using (auth.uid() = user_id);

create policy "Users insert own adherence"
  on public.protocol_adherence for insert
  with check (auth.uid() = user_id);

create policy "Users delete own adherence"
  on public.protocol_adherence for delete
  using (auth.uid() = user_id);

create index protocol_adherence_user_report_idx
  on public.protocol_adherence (user_id, lab_report_id);

create index protocol_adherence_user_section_completed_idx
  on public.protocol_adherence (user_id, section, completed_at desc);