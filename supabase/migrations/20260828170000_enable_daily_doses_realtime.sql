-- Daily-dose changes drive the cross-device dashboard refresh. RLS remains
-- enforced for every subscriber; publication membership grants no row access.
alter publication supabase_realtime add table tracker.daily_doses;
