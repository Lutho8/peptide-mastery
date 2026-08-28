
create table public.gsc_submissions (
  id uuid primary key default gen_random_uuid(),
  site_url text not null,
  sitemap_url text not null,
  submitted_at timestamptz not null default now(),
  status text not null,
  http_status int,
  errors jsonb default '[]'::jsonb,
  warnings int default 0,
  source text not null default 'manual'
);
alter table public.gsc_submissions enable row level security;
create policy "Admins view submissions" on public.gsc_submissions for select using (public.has_role(auth.uid(),'admin'));
create policy "Admins insert submissions" on public.gsc_submissions for insert with check (public.has_role(auth.uid(),'admin'));

create table public.gsc_coverage_snapshots (
  id uuid primary key default gen_random_uuid(),
  site_url text not null,
  captured_at timestamptz not null default now(),
  submitted int default 0,
  indexed int default 0,
  errors int default 0,
  warnings int default 0,
  raw jsonb
);
alter table public.gsc_coverage_snapshots enable row level security;
create policy "Admins view coverage" on public.gsc_coverage_snapshots for select using (public.has_role(auth.uid(),'admin'));
create policy "Admins insert coverage" on public.gsc_coverage_snapshots for insert with check (public.has_role(auth.uid(),'admin'));

create index on public.gsc_submissions (submitted_at desc);
create index on public.gsc_coverage_snapshots (captured_at desc);
