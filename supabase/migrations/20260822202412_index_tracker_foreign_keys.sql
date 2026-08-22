-- Cover the two foreign keys identified by the post-cutover performance advisor.
create index if not exists idx_dose_reminders_user_id
  on tracker.dose_reminders (user_id);

create index if not exists idx_injection_records_site_id
  on tracker.injection_records (site_id);
