export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type GeneratedDatabase = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      bloodwork_reminders: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          due_at: string
          id: string
          kind: string
          lab_report_id: string
          notified_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          kind: string
          lab_report_id: string
          notified_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          kind?: string
          lab_report_id?: string
          notified_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloodwork_reminders_lab_report_id_fkey"
            columns: ["lab_report_id"]
            isOneToOne: false
            referencedRelation: "lab_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      body_composition: {
        Row: {
          bmi: number | null
          bmr: number | null
          body_fat: number | null
          body_water: number | null
          bone_mass: number | null
          created_at: string
          date: string
          fat_free_weight: number | null
          id: string
          metabolic_age: number | null
          muscle_mass: number | null
          protein: number | null
          skeletal_muscle: number | null
          source: string | null
          subcutaneous_fat: number | null
          user_id: string
          visceral_fat: number | null
          weight: number
        }
        Insert: {
          bmi?: number | null
          bmr?: number | null
          body_fat?: number | null
          body_water?: number | null
          bone_mass?: number | null
          created_at?: string
          date: string
          fat_free_weight?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          protein?: number | null
          skeletal_muscle?: number | null
          source?: string | null
          subcutaneous_fat?: number | null
          user_id: string
          visceral_fat?: number | null
          weight: number
        }
        Update: {
          bmi?: number | null
          bmr?: number | null
          body_fat?: number | null
          body_water?: number | null
          bone_mass?: number | null
          created_at?: string
          date?: string
          fat_free_weight?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          protein?: number | null
          skeletal_muscle?: number | null
          source?: string | null
          subcutaneous_fat?: number | null
          user_id?: string
          visceral_fat?: number | null
          weight?: number
        }
        Relationships: []
      }
      calculator_settings: {
        Row: {
          created_at: string
          experience_level: string
          id: string
          last_bac_water: string | null
          last_selected_peptide: string | null
          last_target_dose: string | null
          last_vial_size: string | null
          syringe_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_level?: string
          id?: string
          last_bac_water?: string | null
          last_selected_peptide?: string | null
          last_target_dose?: string | null
          last_vial_size?: string | null
          syringe_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_level?: string
          id?: string
          last_bac_water?: string | null
          last_selected_peptide?: string | null
          last_target_dose?: string | null
          last_vial_size?: string | null
          syringe_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          course_completed_at: string | null
          created_at: string
          email: string
          enrolled_at: string
          full_name: string
          id: string
          phone: string | null
          sms_consent: boolean
          updated_at: string
        }
        Insert: {
          course_completed_at?: string | null
          created_at?: string
          email: string
          enrolled_at?: string
          full_name: string
          id?: string
          phone?: string | null
          sms_consent?: boolean
          updated_at?: string
        }
        Update: {
          course_completed_at?: string | null
          created_at?: string
          email?: string
          enrolled_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          sms_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      customer_journeys: {
        Row: {
          created_at: string
          experience_mode: string | null
          last_active_at: string
          lifecycle_stage: string
          next_action_code: string
          onboarding_step: number
          pathway: string
          primary_goal: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_mode?: string | null
          last_active_at?: string
          lifecycle_stage?: string
          next_action_code?: string
          onboarding_step?: number
          pathway?: string
          primary_goal?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_mode?: string | null
          last_active_at?: string
          lifecycle_stage?: string
          next_action_code?: string
          onboarding_step?: number
          pathway?: string
          primary_goal?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_doses: {
        Row: {
          created_at: string
          date: string
          dose: number
          id: string
          notes: string | null
          peptide_id: string
          peptide_name: string
          time: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          dose: number
          id?: string
          notes?: string | null
          peptide_id: string
          peptide_name: string
          time: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          dose?: number
          id?: string
          notes?: string | null
          peptide_id?: string
          peptide_name?: string
          time?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dose_reminders: {
        Row: {
          created_at: string
          days: string[]
          dose: string
          email_notification_enabled: boolean
          enabled: boolean
          id: string
          peptide_id: string
          peptide_name: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: string[]
          dose: string
          email_notification_enabled?: boolean
          enabled?: boolean
          id?: string
          peptide_id: string
          peptide_name: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: string[]
          dose?: string
          email_notification_enabled?: boolean
          enabled?: boolean
          id?: string
          peptide_id?: string
          peptide_name?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          date: string
          fat_g: number
          fiber_g: number
          id: string
          meal_name: string
          meal_type: string
          notes: string | null
          protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          date: string
          fat_g?: number
          fiber_g?: number
          id?: string
          meal_name: string
          meal_type?: string
          notes?: string | null
          protein_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          date?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          meal_name?: string
          meal_type?: string
          notes?: string | null
          protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gsc_coverage_snapshots: {
        Row: {
          captured_at: string
          errors: number | null
          id: string
          indexed: number | null
          raw: Json | null
          site_url: string
          submitted: number | null
          warnings: number | null
        }
        Insert: {
          captured_at?: string
          errors?: number | null
          id?: string
          indexed?: number | null
          raw?: Json | null
          site_url: string
          submitted?: number | null
          warnings?: number | null
        }
        Update: {
          captured_at?: string
          errors?: number | null
          id?: string
          indexed?: number | null
          raw?: Json | null
          site_url?: string
          submitted?: number | null
          warnings?: number | null
        }
        Relationships: []
      }
      gsc_submissions: {
        Row: {
          errors: Json | null
          http_status: number | null
          id: string
          site_url: string
          sitemap_url: string
          source: string
          status: string
          submitted_at: string
          warnings: number | null
        }
        Insert: {
          errors?: Json | null
          http_status?: number | null
          id?: string
          site_url: string
          sitemap_url: string
          source?: string
          status: string
          submitted_at?: string
          warnings?: number | null
        }
        Update: {
          errors?: Json | null
          http_status?: number | null
          id?: string
          site_url?: string
          sitemap_url?: string
          source?: string
          status?: string
          submitted_at?: string
          warnings?: number | null
        }
        Relationships: []
      }
      injection_records: {
        Row: {
          created_at: string
          dose_mg: number | null
          id: string
          injected_at: string
          notes: string | null
          pain_score: number | null
          peptide_id: string
          peptide_name: string | null
          route: string
          site_id: string
          swelling_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dose_mg?: number | null
          id?: string
          injected_at?: string
          notes?: string | null
          pain_score?: number | null
          peptide_id: string
          peptide_name?: string | null
          route?: string
          site_id: string
          swelling_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          dose_mg?: number | null
          id?: string
          injected_at?: string
          notes?: string | null
          pain_score?: number | null
          peptide_id?: string
          peptide_name?: string | null
          route?: string
          site_id?: string
          swelling_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "injection_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "injection_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      injection_sites: {
        Row: {
          display_name: string
          id: string
          recommended_routes: string[]
          region: string
          side: string
          svg_path_id: string
          zone_index: number
        }
        Insert: {
          display_name: string
          id: string
          recommended_routes?: string[]
          region: string
          side: string
          svg_path_id: string
          zone_index: number
        }
        Update: {
          display_name?: string
          id?: string
          recommended_routes?: string[]
          region?: string
          side?: string
          svg_path_id?: string
          zone_index?: number
        }
        Relationships: []
      }
      journey_events: {
        Row: {
          context: Json
          created_at: string
          event_name: string
          id: number
          source: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          event_name: string
          id?: never
          source?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          event_name?: string
          id?: never
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          bac_water_ml: number | null
          coa_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          lot_number: string | null
          notes: string | null
          peptide_id: string
          peptide_name: string
          reconstituted_at: string | null
          remaining_mg: number
          status: string
          updated_at: string
          user_id: string
          vendor: string | null
          vial_total_mg: number
        }
        Insert: {
          bac_water_ml?: number | null
          coa_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          peptide_id: string
          peptide_name: string
          reconstituted_at?: string | null
          remaining_mg: number
          status?: string
          updated_at?: string
          user_id: string
          vendor?: string | null
          vial_total_mg: number
        }
        Update: {
          bac_water_ml?: number | null
          coa_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          peptide_id?: string
          peptide_name?: string
          reconstituted_at?: string | null
          remaining_mg?: number
          status?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
          vial_total_mg?: number
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          ai_insights: string | null
          ai_insights_de: string | null
          ai_summary: string | null
          ai_summary_de: string | null
          created_at: string
          detected_language: string | null
          extracted_biomarkers: Json | null
          file_name: string
          file_url: string
          goals: string[]
          health_score: number | null
          id: string
          patient_age: number | null
          patient_sex: string | null
          peptide_history_notes: string | null
          peptide_history_used: boolean | null
          protocol: Json | null
          recommended_stack_peptides: string[]
          report_date: string | null
          scan_type: string
          status: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          ai_insights_de?: string | null
          ai_summary?: string | null
          ai_summary_de?: string | null
          created_at?: string
          detected_language?: string | null
          extracted_biomarkers?: Json | null
          file_name: string
          file_url: string
          goals?: string[]
          health_score?: number | null
          id?: string
          patient_age?: number | null
          patient_sex?: string | null
          peptide_history_notes?: string | null
          peptide_history_used?: boolean | null
          protocol?: Json | null
          recommended_stack_peptides?: string[]
          report_date?: string | null
          scan_type?: string
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          ai_insights_de?: string | null
          ai_summary?: string | null
          ai_summary_de?: string | null
          created_at?: string
          detected_language?: string | null
          extracted_biomarkers?: Json | null
          file_name?: string
          file_url?: string
          goals?: string[]
          health_score?: number | null
          id?: string
          patient_age?: number | null
          patient_sex?: string | null
          peptide_history_notes?: string | null
          peptide_history_used?: boolean | null
          protocol?: Json | null
          recommended_stack_peptides?: string[]
          report_date?: string | null
          scan_type?: string
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          chest_cm: number | null
          created_at: string
          date: string
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_thigh_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_thigh_cm: number | null
          updated_at: string
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          chest_cm?: number | null
          created_at?: string
          date: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          chest_cm?: number | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      pk_user_overrides: {
        Row: {
          absorption_rate: number | null
          bioavailability: number | null
          created_at: string
          half_life_hours: number | null
          id: string
          peptide_id: string
          route: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absorption_rate?: number | null
          bioavailability?: number | null
          created_at?: string
          half_life_hours?: number | null
          id?: string
          peptide_id: string
          route?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absorption_rate?: number | null
          bioavailability?: number | null
          created_at?: string
          half_life_hours?: number | null
          id?: string
          peptide_id?: string
          route?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          display_name: string | null
          email_reminders_enabled: boolean
          experience: string | null
          full_name: string | null
          gender: string | null
          goals: string[] | null
          height_cm: number | null
          id: string
          profile_completed_at: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          display_name?: string | null
          email_reminders_enabled?: boolean
          experience?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id: string
          profile_completed_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          display_name?: string | null
          email_reminders_enabled?: boolean
          experience?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          profile_completed_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          notes: string | null
          photo_url: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          photo_url: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          photo_url?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      protocol_adherence: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          item_key: string
          item_label: string
          lab_report_id: string
          section: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          item_key: string
          item_label: string
          lab_report_id: string
          section: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          item_key?: string
          item_label?: string
          lab_report_id?: string
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      qna_registrations: {
        Row: {
          created_at: string
          email: string
          email_consent: boolean
          experience_level: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string | null
          session_month: string
          topics_of_interest: string[] | null
          whatsapp_consent: boolean
          whatsapp_country_code: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_consent?: boolean
          experience_level?: string
          first_name?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          session_month: string
          topics_of_interest?: string[] | null
          whatsapp_consent?: boolean
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_consent?: boolean
          experience_level?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          session_month?: string
          topics_of_interest?: string[] | null
          whatsapp_consent?: boolean
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      renpho_credentials: {
        Row: {
          created_at: string
          email_encrypted: string
          id: string
          last_sync_at: string | null
          password_hash_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_encrypted: string
          id?: string
          last_sync_at?: string | null
          password_hash_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_encrypted?: string
          id?: string
          last_sync_at?: string | null
          password_hash_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_checks: {
        Row: {
          contraindications: Json
          created_at: string
          expires_at: string
          id: string
          peptide_id: string
          profile_hash: string
          reasoning: string | null
          severity: string
          status: string
          user_id: string
          warnings: Json
        }
        Insert: {
          contraindications?: Json
          created_at?: string
          expires_at?: string
          id?: string
          peptide_id: string
          profile_hash: string
          reasoning?: string | null
          severity: string
          status: string
          user_id: string
          warnings?: Json
        }
        Update: {
          contraindications?: Json
          created_at?: string
          expires_at?: string
          id?: string
          peptide_id?: string
          profile_hash?: string
          reasoning?: string | null
          severity?: string
          status?: string
          user_id?: string
          warnings?: Json
        }
        Relationships: []
      }
      safety_profiles: {
        Row: {
          age: number | null
          allergies: string[]
          conditions: string[]
          created_at: string
          id: string
          is_pregnant: boolean
          kidney_status: string | null
          liver_status: string | null
          medications: string[]
          notes: string | null
          oncology_history: boolean
          sex: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[]
          conditions?: string[]
          created_at?: string
          id?: string
          is_pregnant?: boolean
          kidney_status?: string | null
          liver_status?: string | null
          medications?: string[]
          notes?: string | null
          oncology_history?: boolean
          sex?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[]
          conditions?: string[]
          created_at?: string
          id?: string
          is_pregnant?: boolean
          kidney_status?: string | null
          liver_status?: string | null
          medications?: string[]
          notes?: string | null
          oncology_history?: boolean
          sex?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stacks: {
        Row: {
          created_at: string
          dose: string
          frequency: string
          id: string
          peptide_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose: string
          frequency: string
          id?: string
          peptide_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose?: string
          frequency?: string
          id?: string
          peptide_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          amount_ml: number
          created_at: string
          date: string
          goal_ml: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          date: string
          goal_ml?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          date?: string
          goal_ml?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_credential: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      encrypt_credential: {
        Args: { encryption_key: string; plain_text: string }
        Returns: string
      }
      get_dashboard_snapshot: { Args: never; Returns: Json }
      get_order_dashboard: { Args: never; Returns: Json }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_plan: "monthly" | "annual"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "pending"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// The tracker database is namespaced in the company-owned Supabase project to
// avoid colliding with commerce tables in `public`. Its shape matches the
// original generated schema, so keep one strict source of row/table types.
export type Database = GeneratedDatabase & {
  tracker: GeneratedDatabase["public"]
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_plan: ["monthly", "annual"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "pending",
        "paused",
      ],
    },
  },
} as const
