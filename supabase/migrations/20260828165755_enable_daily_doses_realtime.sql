-- Daily-dose changes drive the cross-device dashboard refresh. RLS remains
-- enforced for every subscriber; publication membership grants no row access.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'tracker'
      and tablename = 'daily_doses'
  ) then
    execute 'alter publication supabase_realtime add table tracker.daily_doses';
  end if;
end
$$;
