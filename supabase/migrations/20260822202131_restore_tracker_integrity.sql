-- Restore the relational integrity omitted from the initial tracker-schema cutover.

-- Generated from the verified 2026-08-19 PostgreSQL archive post-data section.

-- Existing owner-scoped RLS policies and least-privilege grants remain unchanged.



-- constraint objects

ALTER TABLE ONLY tracker.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.bloodwork_reminders
    ADD CONSTRAINT bloodwork_reminders_lab_report_id_kind_key UNIQUE (lab_report_id, kind);

ALTER TABLE ONLY tracker.bloodwork_reminders
    ADD CONSTRAINT bloodwork_reminders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.body_composition
    ADD CONSTRAINT body_composition_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.calculator_settings
    ADD CONSTRAINT calculator_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.calculator_settings
    ADD CONSTRAINT calculator_settings_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY tracker.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.daily_doses
    ADD CONSTRAINT daily_doses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.dose_reminders
    ADD CONSTRAINT dose_reminders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.email_send_log
    ADD CONSTRAINT email_send_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.email_send_state
    ADD CONSTRAINT email_send_state_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_email_key UNIQUE (email);

ALTER TABLE ONLY tracker.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_token_key UNIQUE (token);

ALTER TABLE ONLY tracker.food_logs
    ADD CONSTRAINT food_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.gsc_coverage_snapshots
    ADD CONSTRAINT gsc_coverage_snapshots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.gsc_submissions
    ADD CONSTRAINT gsc_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.injection_records
    ADD CONSTRAINT injection_records_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.injection_sites
    ADD CONSTRAINT injection_sites_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.lab_reports
    ADD CONSTRAINT lab_reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.measurements
    ADD CONSTRAINT measurements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.pk_user_overrides
    ADD CONSTRAINT pk_user_overrides_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.pk_user_overrides
    ADD CONSTRAINT pk_user_overrides_user_id_peptide_id_key UNIQUE (user_id, peptide_id);

ALTER TABLE ONLY tracker.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.progress_photos
    ADD CONSTRAINT progress_photos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.protocol_adherence
    ADD CONSTRAINT protocol_adherence_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.protocol_adherence
    ADD CONSTRAINT protocol_adherence_user_id_lab_report_id_section_item_key_key UNIQUE (user_id, lab_report_id, section, item_key);

ALTER TABLE ONLY tracker.qna_registrations
    ADD CONSTRAINT qna_registrations_email_session_month_key UNIQUE (email, session_month);

ALTER TABLE ONLY tracker.qna_registrations
    ADD CONSTRAINT qna_registrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.renpho_credentials
    ADD CONSTRAINT renpho_credentials_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.renpho_credentials
    ADD CONSTRAINT renpho_credentials_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY tracker.safety_checks
    ADD CONSTRAINT safety_checks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.safety_checks
    ADD CONSTRAINT safety_checks_user_id_peptide_id_profile_hash_key UNIQUE (user_id, peptide_id, profile_hash);

ALTER TABLE ONLY tracker.safety_profiles
    ADD CONSTRAINT safety_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.safety_profiles
    ADD CONSTRAINT safety_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY tracker.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY tracker.suppressed_emails
    ADD CONSTRAINT suppressed_emails_email_key UNIQUE (email);

ALTER TABLE ONLY tracker.suppressed_emails
    ADD CONSTRAINT suppressed_emails_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

ALTER TABLE ONLY tracker.user_stacks
    ADD CONSTRAINT user_stacks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.user_stacks
    ADD CONSTRAINT user_stacks_user_peptide_unique UNIQUE (user_id, peptide_id);

ALTER TABLE ONLY tracker.water_intake
    ADD CONSTRAINT water_intake_pkey PRIMARY KEY (id);

ALTER TABLE ONLY tracker.water_intake
    ADD CONSTRAINT water_intake_user_id_date_key UNIQUE (user_id, date);



-- index objects

CREATE INDEX audit_logs_action_created_at_idx ON tracker.audit_logs USING btree (action, created_at DESC);

CREATE INDEX audit_logs_user_id_created_at_idx ON tracker.audit_logs USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX body_composition_user_date_unique ON tracker.body_composition USING btree (user_id, date);

CREATE INDEX gsc_coverage_snapshots_captured_at_idx ON tracker.gsc_coverage_snapshots USING btree (captured_at DESC);

CREATE INDEX gsc_submissions_submitted_at_idx ON tracker.gsc_submissions USING btree (submitted_at DESC);

CREATE INDEX idx_bloodwork_reminders_due ON tracker.bloodwork_reminders USING btree (due_at) WHERE (notified_at IS NULL);

CREATE INDEX idx_bloodwork_reminders_user ON tracker.bloodwork_reminders USING btree (user_id, status);

CREATE UNIQUE INDEX idx_course_enrollments_email ON tracker.course_enrollments USING btree (email);

CREATE INDEX idx_daily_doses_user_date ON tracker.daily_doses USING btree (user_id, date);

CREATE INDEX idx_email_send_log_created ON tracker.email_send_log USING btree (created_at DESC);

CREATE INDEX idx_email_send_log_message ON tracker.email_send_log USING btree (message_id);

CREATE UNIQUE INDEX idx_email_send_log_message_sent_unique ON tracker.email_send_log USING btree (message_id) WHERE (status = 'sent'::text);

CREATE INDEX idx_email_send_log_recipient ON tracker.email_send_log USING btree (recipient_email);

CREATE INDEX idx_injection_records_user_site ON tracker.injection_records USING btree (user_id, site_id, injected_at DESC);

CREATE INDEX idx_injection_records_user_time ON tracker.injection_records USING btree (user_id, injected_at DESC);

CREATE INDEX idx_inventory_user_peptide_status ON tracker.inventory_items USING btree (user_id, peptide_id, status);

CREATE INDEX idx_safety_checks_lookup ON tracker.safety_checks USING btree (user_id, peptide_id, expires_at);

CREATE INDEX idx_subscriptions_status ON tracker.subscriptions USING btree (status);

CREATE INDEX idx_subscriptions_user_id ON tracker.subscriptions USING btree (user_id);

CREATE INDEX idx_suppressed_emails_email ON tracker.suppressed_emails USING btree (email);

CREATE INDEX idx_unsubscribe_tokens_token ON tracker.email_unsubscribe_tokens USING btree (token);

CREATE INDEX idx_user_stacks_user_id ON tracker.user_stacks USING btree (user_id);

CREATE INDEX protocol_adherence_user_report_idx ON tracker.protocol_adherence USING btree (user_id, lab_report_id);

CREATE INDEX protocol_adherence_user_section_completed_idx ON tracker.protocol_adherence USING btree (user_id, section, completed_at DESC);



-- fk constraint objects

ALTER TABLE ONLY tracker.bloodwork_reminders
    ADD CONSTRAINT bloodwork_reminders_lab_report_id_fkey FOREIGN KEY (lab_report_id) REFERENCES tracker.lab_reports(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.bloodwork_reminders
    ADD CONSTRAINT bloodwork_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.body_composition
    ADD CONSTRAINT body_composition_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.calculator_settings
    ADD CONSTRAINT calculator_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.dose_reminders
    ADD CONSTRAINT dose_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.injection_records
    ADD CONSTRAINT injection_records_site_id_fkey FOREIGN KEY (site_id) REFERENCES tracker.injection_sites(id);

ALTER TABLE ONLY tracker.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.renpho_credentials
    ADD CONSTRAINT renpho_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY tracker.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



-- trigger objects

CREATE TRIGGER set_bloodwork_reminders_updated_at BEFORE UPDATE ON tracker.bloodwork_reminders FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER trg_decrement_inventory AFTER INSERT ON tracker.daily_doses FOR EACH ROW EXECUTE FUNCTION tracker.decrement_inventory_on_dose();

CREATE TRIGGER trg_pk_overrides_updated BEFORE UPDATE ON tracker.pk_user_overrides FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER trg_safety_profiles_updated BEFORE UPDATE ON tracker.safety_profiles FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER trg_schedule_bloodwork_reminders AFTER UPDATE ON tracker.lab_reports FOR EACH ROW EXECUTE FUNCTION tracker.schedule_bloodwork_reminders();

CREATE TRIGGER trg_set_inventory_expiry BEFORE INSERT OR UPDATE OF reconstituted_at ON tracker.inventory_items FOR EACH ROW EXECUTE FUNCTION tracker.set_inventory_expiry();

CREATE TRIGGER update_calculator_settings_updated_at BEFORE UPDATE ON tracker.calculator_settings FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON tracker.course_enrollments FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_daily_doses_updated_at BEFORE UPDATE ON tracker.daily_doses FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_dose_reminders_updated_at BEFORE UPDATE ON tracker.dose_reminders FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE ON tracker.food_logs FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON tracker.inventory_items FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON tracker.measurements FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON tracker.profiles FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_renpho_credentials_updated_at BEFORE UPDATE ON tracker.renpho_credentials FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON tracker.subscriptions FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_user_stacks_updated_at BEFORE UPDATE ON tracker.user_stacks FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();

CREATE TRIGGER update_water_intake_updated_at BEFORE UPDATE ON tracker.water_intake FOR EACH ROW EXECUTE FUNCTION tracker.update_updated_at_column();
