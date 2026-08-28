-- Reconcile private tracker storage on the company-owned Supabase project.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lab-reports', 'lab-reports', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('progress-photos', 'progress-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lab reports: the first path segment is always the authenticated owner UUID.
drop policy if exists "Users can upload own lab reports" on storage.objects;
drop policy if exists "Users can view own lab reports storage" on storage.objects;
drop policy if exists "Users can update own lab reports" on storage.objects;
drop policy if exists "Users can delete own lab reports storage" on storage.objects;

create policy "Users can upload own lab reports"
on storage.objects for insert to authenticated
with check (bucket_id = 'lab-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can view own lab reports storage"
on storage.objects for select to authenticated
using (bucket_id = 'lab-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update own lab reports"
on storage.objects for update to authenticated
using (bucket_id = 'lab-reports' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'lab-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete own lab reports storage"
on storage.objects for delete to authenticated
using (bucket_id = 'lab-reports' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Progress photos use the same owner-scoped layout.
drop policy if exists "Users can upload own progress photos" on storage.objects;
drop policy if exists "Users can view own progress photos" on storage.objects;
drop policy if exists "Users can update own progress photos" on storage.objects;
drop policy if exists "Users can delete own progress photos" on storage.objects;

create policy "Users can upload own progress photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can view own progress photos"
on storage.objects for select to authenticated
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update own progress photos"
on storage.objects for update to authenticated
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete own progress photos"
on storage.objects for delete to authenticated
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

