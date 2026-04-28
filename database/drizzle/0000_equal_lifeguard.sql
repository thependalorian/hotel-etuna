CREATE TYPE "public"."ai_conversation_channel" AS ENUM('web', 'whatsapp', 'email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."ai_conversation_status" AS ENUM('active', 'completed', 'escalated', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ai_message_sender_type" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."aml_alert_status" AS ENUM('pending', 'investigating', 'cleared', 'escalated', 'reported');--> statement-breakpoint
CREATE TYPE "public"."aml_risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract');--> statement-breakpoint
CREATE TYPE "public"."kyc_document_type" AS ENUM('national_id', 'passport', 'drivers_license', 'proof_of_address', 'business_registration', 'tax_certificate', 'bank_statement', 'other');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'in_review', 'approved', 'rejected', 'expired', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."kyc_tier" AS ENUM('lite_kyc_individual', 'lite_kyc_business', 'full_kyc_individual', 'full_kyc_business', 'none');--> statement-breakpoint
CREATE TYPE "public"."loyalty_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'takeout', 'delivery', 'room_service');--> statement-breakpoint
CREATE TYPE "public"."pep_category" AS ENUM('head_of_state', 'government_official', 'senior_politician', 'judicial_official', 'military_official', 'state_owned_enterprise', 'political_party_official', 'close_associate', 'family_member');--> statement-breakpoint
CREATE TYPE "public"."review_category" AS ENUM('stay', 'food', 'service', 'amenities', 'value', 'other');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('available', 'occupied', 'maintenance', 'out_of_order');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'inactive', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."str_status" AS ENUM('draft', 'submitted', 'acknowledged', 'under_review', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transaction_limit_type" AS ENUM('daily', 'monthly', 'per_transaction');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"property_id" uuid,
	"session_id" varchar(255),
	"channel" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"context" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"sender_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_due_diligence_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"dd_level" varchar(50) DEFAULT 'standard' NOT NULL,
	"risk_level" varchar(20) DEFAULT 'low',
	"risk_assessment_date" date NOT NULL,
	"risk_assessment_by" uuid,
	"identity_verified" boolean DEFAULT false,
	"identity_verification_method" varchar(100),
	"identity_verification_date" date,
	"identity_documents" jsonb DEFAULT '[]',
	"source_of_wealth_declared" varchar(255),
	"source_of_wealth_verified" boolean DEFAULT false,
	"source_of_wealth_documents" jsonb DEFAULT '[]',
	"source_of_funds_declared" varchar(255),
	"source_of_funds_verified" boolean DEFAULT false,
	"source_of_funds_documents" jsonb DEFAULT '[]',
	"beneficial_owners" jsonb DEFAULT '[]',
	"beneficial_ownership_verified" boolean DEFAULT false,
	"purpose_of_relationship" text,
	"expected_transaction_volume" varchar(100),
	"expected_transaction_types" text[],
	"last_review_date" date,
	"next_review_date" date,
	"review_frequency_days" integer DEFAULT 365,
	"is_pep" boolean DEFAULT false,
	"pep_flag_id" uuid,
	"approved" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"attachments" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_geographic_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"transaction_id" uuid,
	"ip_address" text,
	"country_code" varchar(2),
	"city" varchar(100),
	"region" varchar(100),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_high_risk_jurisdiction" boolean DEFAULT false,
	"is_unusual_location" boolean DEFAULT false,
	"distance_from_usual_km" integer,
	"risk_level" varchar(20) DEFAULT 'low',
	"risk_factors" jsonb DEFAULT '[]',
	"transaction_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_guest_pep_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"pep_id" uuid,
	"flag_type" varchar(50) NOT NULL,
	"match_confidence" numeric(5, 2),
	"match_criteria" jsonb DEFAULT '{}',
	"edd_completed" boolean DEFAULT false,
	"edd_completed_at" timestamp with time zone,
	"edd_completed_by" uuid,
	"source_of_wealth_verified" boolean DEFAULT false,
	"source_of_funds_verified" boolean DEFAULT false,
	"relationship_approved" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"ongoing_monitoring_level" varchar(50) DEFAULT 'enhanced',
	"is_active" boolean DEFAULT true,
	"flagged_at" timestamp with time zone DEFAULT now(),
	"cleared_at" timestamp with time zone,
	"cleared_by" uuid,
	"clearance_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_monitoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"rule_code" varchar(50) NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"rule_category" varchar(50) NOT NULL,
	"description" text,
	"threshold_value" numeric(15, 2),
	"threshold_count" integer,
	"time_window_hours" integer,
	"risk_level" varchar(20) DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"auto_escalate" boolean DEFAULT false,
	"requires_immediate_review" boolean DEFAULT false,
	"conditions" jsonb DEFAULT '{}' NOT NULL,
	"actions" jsonb DEFAULT '[]',
	"created_by" uuid,
	"last_modified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "aml_monitoring_rules_rule_code_unique" UNIQUE("rule_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_pep_database" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"date_of_birth" date,
	"nationality" varchar(100),
	"id_number" varchar(100),
	"passport_number" varchar(100),
	"pep_category" varchar(50) NOT NULL,
	"position_title" varchar(255),
	"organization" varchar(255),
	"country_of_office" varchar(100),
	"is_domestic_pep" boolean DEFAULT false,
	"is_foreign_pep" boolean DEFAULT false,
	"risk_level" varchar(20) DEFAULT 'high',
	"risk_factors" jsonb DEFAULT '[]',
	"associated_peps" uuid[],
	"beneficial_owners" jsonb DEFAULT '[]',
	"source" varchar(100) NOT NULL,
	"verification_date" date,
	"verified_by" uuid,
	"is_active" boolean DEFAULT true,
	"position_start_date" date,
	"position_end_date" date,
	"exit_interview_completed" boolean DEFAULT false,
	"cooling_off_period_end" date,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_suspicious_transaction_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"str_reference" varchar(100) NOT NULL,
	"str_type" varchar(50) NOT NULL,
	"guest_id" uuid,
	"subject_name" varchar(255) NOT NULL,
	"subject_id_number" varchar(100),
	"subject_passport" varchar(100),
	"subject_address" text,
	"subject_nationality" varchar(100),
	"transaction_ids" uuid[],
	"alert_ids" uuid[],
	"total_amount" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'NAD',
	"transaction_count" integer,
	"suspicion_category" varchar(100) NOT NULL,
	"suspicion_indicators" jsonb DEFAULT '[]',
	"suspicion_description" text NOT NULL,
	"supporting_evidence" jsonb DEFAULT '[]',
	"risk_level" varchar(20) DEFAULT 'high',
	"risk_score" numeric(5, 2),
	"risk_analysis" text,
	"detection_date" date NOT NULL,
	"report_deadline" date NOT NULL,
	"drafted_at" timestamp with time zone,
	"drafted_by" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"submitted_at" timestamp with time zone,
	"submitted_by" uuid,
	"fic_submission_reference" varchar(100),
	"fic_acknowledgment_date" date,
	"fic_response_date" date,
	"fic_feedback" text,
	"status" varchar(50) DEFAULT 'draft',
	"action_taken" varchar(255),
	"follow_up_required" boolean DEFAULT false,
	"follow_up_notes" text,
	"tipping_off_risk_assessed" boolean DEFAULT false,
	"customer_notified" boolean DEFAULT false,
	"retention_until" date NOT NULL,
	"archived" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "aml_suspicious_transaction_reports_str_reference_unique" UNIQUE("str_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_transaction_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"transaction_id" uuid,
	"transaction_reference" varchar(100),
	"guest_id" uuid,
	"alert_type" varchar(100) NOT NULL,
	"alert_category" varchar(50) NOT NULL,
	"risk_level" varchar(20) DEFAULT 'medium',
	"risk_score" numeric(5, 2),
	"trigger_rules" jsonb DEFAULT '[]',
	"detection_timestamp" timestamp with time zone DEFAULT now(),
	"pattern_details" jsonb DEFAULT '{}',
	"amount" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'NAD',
	"transaction_count" integer,
	"time_window_hours" integer,
	"geographic_pattern" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"investigation_notes" text,
	"resolution_notes" text,
	"escalated" boolean DEFAULT false,
	"escalated_at" timestamp with time zone,
	"escalated_to" uuid,
	"requires_str" boolean DEFAULT false,
	"str_id" uuid,
	"investigated_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aml_transaction_velocity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"window_hours" integer NOT NULL,
	"transaction_count" integer NOT NULL,
	"total_amount" numeric(15, 2),
	"average_amount" numeric(15, 2),
	"max_amount" numeric(15, 2),
	"min_amount" numeric(15, 2),
	"is_suspicious" boolean DEFAULT false,
	"suspicion_reason" varchar(255),
	"risk_score" numeric(5, 2),
	"unique_locations" integer,
	"location_details" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"session_id" varchar(255),
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bon_incident_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"incident_category" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"submission_date" timestamp with time zone NOT NULL,
	"submission_method" varchar(50) DEFAULT 'api',
	"submitted_by" uuid,
	"financial_loss" numeric(15, 2) DEFAULT '0',
	"data_loss_records" integer DEFAULT 0,
	"availability_loss_minutes" integer DEFAULT 0,
	"affected_users_count" integer DEFAULT 0,
	"incident_summary" text NOT NULL,
	"impact_details" text,
	"mitigation_actions" text,
	"recovery_actions" text,
	"lessons_learned" text,
	"bon_reference" varchar(255),
	"bon_acknowledged_at" timestamp with time zone,
	"bon_status" varchar(50) DEFAULT 'submitted',
	"bon_comments" text,
	"bon_follow_up_required" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"room_id" uuid,
	"guest_count" integer DEFAULT 1,
	"rate_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"guest_id" uuid,
	"booking_reference" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'confirmed',
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"actual_check_in_date" timestamp with time zone,
	"actual_check_out_date" timestamp with time zone,
	"room_count" integer DEFAULT 1,
	"adult_count" integer DEFAULT 1,
	"child_count" integer DEFAULT 0,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"payment_status" varchar(50) DEFAULT 'pending',
	"special_requests" text,
	"cancellation_policy" varchar(100),
	"ai_processed" boolean DEFAULT false,
	"ai_confidence_score" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bookings_booking_reference_unique" UNIQUE("booking_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"content_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"metadata" jsonb DEFAULT '{}',
	"status" varchar(50) DEFAULT 'draft',
	"version" integer DEFAULT 1,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"content_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50),
	"file_size" bigint,
	"mime_type" varchar(100),
	"storage_location" varchar(255),
	"alt_text" varchar(255),
	"caption" text,
	"display_order" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cms_menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"ingredients" text[],
	"allergens" text[],
	"dietary_tags" text[],
	"image_url" text,
	"is_available" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_verification_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject_type" varchar(32) NOT NULL,
	"subject_id" uuid,
	"subject_party" varchar(32) DEFAULT 'individual' NOT NULL,
	"kyc_tier" varchar(16) DEFAULT 'lite' NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"workflow_stage" varchar(64),
	"workflow_snapshot" jsonb,
	"reviewer_user_id" uuid,
	"reviewer_notes" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_type" varchar(64) NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(512),
	"uploaded_by_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consumer_rights_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"account_holder_id" uuid,
	"transaction_id" uuid,
	"request_reference" varchar(100) NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"request_date" date NOT NULL,
	"request_description" text NOT NULL,
	"cooling_off_deadline" date,
	"refund_deadline" date,
	"status" varchar(50) DEFAULT 'pending',
	"resolution_date" date,
	"resolution_notes" text,
	"refund_amount" numeric(15, 2),
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "consumer_rights_requests_request_reference_unique" UNIQUE("request_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_graph_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"src_entity_type" varchar(50) NOT NULL,
	"src_entity_id" varchar(36) NOT NULL,
	"dst_entity_type" varchar(50) NOT NULL,
	"dst_entity_id" varchar(36) NOT NULL,
	"relation_type" varchar(80) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_guest_memory_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"fact_text" text NOT NULL,
	"source" varchar(32) DEFAULT 'sofia' NOT NULL,
	"mem0_memory_id" varchar(128),
	"conversation_session_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_outreach_touches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"property_id" uuid,
	"channel" varchar(32) NOT NULL,
	"campaign_key" varchar(100),
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"message_subject" varchar(500),
	"message_body" text,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"workflow_stage" varchar(64),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cybersecurity_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"incident_reference" varchar(100) NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"affected_systems" text[],
	"incident_description" text NOT NULL,
	"financial_loss" numeric(15, 2),
	"availability_loss_minutes" integer,
	"detected_at" timestamp with time zone NOT NULL,
	"reported_to_bon_at" timestamp with time zone,
	"bon_reporting_deadline" timestamp with time zone,
	"recovery_started_at" timestamp with time zone,
	"recovery_completed_at" timestamp with time zone,
	"recovery_time_minutes" integer,
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cybersecurity_incidents_incident_reference_unique" UNIQUE("incident_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_transaction_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"tracking_date" date DEFAULT CURRENT_DATE NOT NULL,
	"transaction_count" integer DEFAULT 0,
	"total_amount" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"daily_limit" numeric(10, 2),
	"limit_exceeded" boolean DEFAULT false,
	"limit_exceeded_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "electronic_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_id" uuid NOT NULL,
	"document_name" varchar(500),
	"document_hash" varchar(64) NOT NULL,
	"signer_id" uuid NOT NULL,
	"signer_name" varchar(255) NOT NULL,
	"signer_email" varchar(255) NOT NULL,
	"signer_phone" varchar(50),
	"signer_ip" "inet",
	"signer_location" varchar(255),
	"signature_method" varchar(50) NOT NULL,
	"signature_data" text NOT NULL,
	"signature_timestamp" timestamp with time zone NOT NULL,
	"signature_provider" varchar(100),
	"verified" boolean DEFAULT false NOT NULL,
	"verification_timestamp" timestamp with time zone,
	"verification_method" varchar(50),
	"certificate_issuer" varchar(255),
	"certificate_serial" varchar(255),
	"certificate_valid_from" timestamp with time zone,
	"certificate_valid_until" timestamp with time zone,
	"eta_compliant" boolean DEFAULT true NOT NULL,
	"legally_binding" boolean DEFAULT true NOT NULL,
	"signature_unique_to_signer" boolean DEFAULT true,
	"signer_identifiable" boolean DEFAULT true,
	"under_signer_control" boolean DEFAULT true,
	"detects_changes" boolean DEFAULT true,
	"witnessed" boolean DEFAULT false,
	"witness_name" varchar(255),
	"witness_email" varchar(255),
	"witness_timestamp" timestamp with time zone,
	"status" varchar(50) DEFAULT 'active',
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"risk_profile_id" uuid,
	"transaction_id" uuid,
	"guest_id" uuid,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"priority" integer DEFAULT 5,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"is_false_positive" boolean DEFAULT false,
	"email_sent" boolean DEFAULT false,
	"sms_sent" boolean DEFAULT false,
	"webhook_sent" boolean DEFAULT false,
	"notification_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_reference" varchar(100) NOT NULL,
	"case_type" varchar(50) NOT NULL,
	"fraud_type" varchar(50),
	"severity" varchar(20) NOT NULL,
	"guest_id" uuid,
	"transaction_ids" uuid[] DEFAULT ARRAY[]::UUID[],
	"alert_ids" uuid[] DEFAULT ARRAY[]::UUID[],
	"total_amount" numeric(15, 2) DEFAULT '0',
	"recovered_amount" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"priority" integer DEFAULT 5,
	"description" text,
	"investigation_notes" text,
	"evidence_urls" text[] DEFAULT ARRAY[]::TEXT[],
	"resolution" varchar(50),
	"resolution_notes" text,
	"police_report_filed" boolean DEFAULT false,
	"police_case_number" varchar(100),
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fraud_cases_case_reference_unique" UNIQUE("case_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_detection_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"threshold_value" numeric(15, 2),
	"threshold_operator" varchar(10),
	"action" varchar(50) NOT NULL,
	"risk_score_impact" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 5,
	"trigger_count" integer DEFAULT 0,
	"true_positive_count" integer DEFAULT 0,
	"false_positive_count" integer DEFAULT 0,
	"accuracy_rate" numeric(5, 2),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_device_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid,
	"device_id" varchar(255) NOT NULL,
	"device_hash" varchar(255) NOT NULL,
	"browser_name" varchar(100),
	"browser_version" varchar(50),
	"os_name" varchar(100),
	"os_version" varchar(50),
	"device_type" varchar(50),
	"screen_resolution" varchar(50),
	"timezone" varchar(100),
	"language" varchar(10),
	"is_trusted" boolean DEFAULT false,
	"trust_score" numeric(5, 2) DEFAULT '0',
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"transaction_count" integer DEFAULT 0,
	"fraud_count" integer DEFAULT 0,
	"ip_addresses" text[] DEFAULT ARRAY[]::TEXT[],
	"countries" text[] DEFAULT ARRAY[]::TEXT[],
	"cities" text[] DEFAULT ARRAY[]::TEXT[],
	"is_vpn" boolean DEFAULT false,
	"is_proxy" boolean DEFAULT false,
	"is_tor" boolean DEFAULT false,
	"is_emulator" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fraud_device_fingerprints_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_risk_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid,
	"guest_id" uuid,
	"risk_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"risk_level" varchar(20) DEFAULT 'low' NOT NULL,
	"fraud_type" varchar(50),
	"velocity_score" numeric(5, 2) DEFAULT '0',
	"geographic_score" numeric(5, 2) DEFAULT '0',
	"device_score" numeric(5, 2) DEFAULT '0',
	"behavioral_score" numeric(5, 2) DEFAULT '0',
	"amount_score" numeric(5, 2) DEFAULT '0',
	"decision" varchar(20) DEFAULT 'pending' NOT NULL,
	"decision_reason" text,
	"requires_3ds" boolean DEFAULT false,
	"requires_otp" boolean DEFAULT false,
	"requires_manual_review" boolean DEFAULT false,
	"detection_rules" jsonb DEFAULT '[]',
	"device_fingerprint" jsonb,
	"ip_address" text,
	"user_agent" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_transactions" integer DEFAULT 0,
	"flagged_transactions" integer DEFAULT 0,
	"declined_transactions" integer DEFAULT 0,
	"fraud_rate" numeric(5, 2) DEFAULT '0',
	"total_amount" numeric(15, 2) DEFAULT '0',
	"fraud_amount" numeric(15, 2) DEFAULT '0',
	"prevented_amount" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"cnp_fraud_count" integer DEFAULT 0,
	"phishing_count" integer DEFAULT 0,
	"sim_swap_count" integer DEFAULT 0,
	"phone_scam_count" integer DEFAULT 0,
	"counterfeit_count" integer DEFAULT 0,
	"true_positives" integer DEFAULT 0,
	"false_positives" integer DEFAULT 0,
	"false_negatives" integer DEFAULT 0,
	"accuracy_rate" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"loyalty_tier" varchar(50) DEFAULT 'bronze',
	"loyalty_points" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"booking_count" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"preferred_room_type" varchar(100),
	"dietary_restrictions" text[],
	"accessibility_needs" text[],
	"communication_preferences" jsonb,
	"marketing_consent" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"booking_id" uuid,
	"guest_id" uuid,
	"property_id" uuid,
	"rating" integer,
	"review_text" text,
	"review_category" varchar(50),
	"is_public" boolean DEFAULT true,
	"response_text" text,
	"responded_at" timestamp with time zone,
	"responded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"date_of_birth" date,
	"nationality" varchar(100),
	"passport_number" varchar(100),
	"id_number" varchar(100),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"preferences" jsonb,
	"marketing_consent" boolean DEFAULT false,
	"is_signed_up" boolean DEFAULT false,
	"sign_up_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "guests_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kyc_profile_id" uuid NOT NULL,
	"document_type" "kyc_document_type" NOT NULL,
	"document_number" varchar(100),
	"document_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50),
	"file_size_bytes" bigint,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"verification_notes" text,
	"expires_at" date,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"kyc_tier" "kyc_tier" DEFAULT 'none',
	"kyc_status" "kyc_status" DEFAULT 'pending',
	"is_business" boolean DEFAULT false,
	"business_name" varchar(255),
	"business_registration_number" varchar(100),
	"business_tax_number" varchar(100),
	"id_number" varchar(100),
	"id_type" varchar(50),
	"id_expiry_date" date,
	"passport_number" varchar(100),
	"passport_expiry_date" date,
	"proof_of_address_verified" boolean DEFAULT false,
	"address_verification_date" timestamp with time zone,
	"kyc_submitted_at" timestamp with time zone,
	"kyc_approved_at" timestamp with time zone,
	"kyc_expires_at" timestamp with time zone,
	"kyc_reviewed_by" uuid,
	"rejection_reason" text,
	"suspension_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_upgrade_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"current_kyc_tier" "kyc_tier" NOT NULL,
	"suggested_kyc_tier" "kyc_tier" NOT NULL,
	"trigger_reason" varchar(255) NOT NULL,
	"trigger_transaction_id" uuid,
	"is_shown" boolean DEFAULT false,
	"shown_at" timestamp with time zone,
	"is_dismissed" boolean DEFAULT false,
	"dismissed_at" timestamp with time zone,
	"is_accepted" boolean DEFAULT false,
	"accepted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_balance_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"tracking_month" varchar(7) NOT NULL,
	"current_balance" numeric(10, 2) DEFAULT '0',
	"peak_balance" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"monthly_balance_limit" numeric(10, 2),
	"limit_exceeded" boolean DEFAULT false,
	"limit_exceeded_at" timestamp with time zone,
	"total_credits" numeric(10, 2) DEFAULT '0',
	"total_debits" numeric(10, 2) DEFAULT '0',
	"transaction_count" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "namqr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"guest_id" uuid,
	"qr_reference" varchar(10) NOT NULL,
	"token_vault_id" varchar(50),
	"qr_type" varchar(50) NOT NULL,
	"presentation_mode" varchar(50) NOT NULL,
	"qr_payload" text NOT NULL,
	"qr_image_url" text,
	"payee_identifier" varchar(255),
	"payee_name" varchar(255),
	"amount" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'NAD',
	"merchant_category_code" varchar(4),
	"merchant_id" varchar(50),
	"is_active" boolean DEFAULT true,
	"scan_count" integer DEFAULT 0,
	"expires_at" timestamp with time zone,
	"signature" varchar(512),
	"is_signed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "namqr_codes_qr_reference_unique" UNIQUE("qr_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ob_api_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(100) NOT NULL,
	"tpp_participant_id" varchar(10),
	"endpoint" varchar(255) NOT NULL,
	"http_method" varchar(10) NOT NULL,
	"http_status_code" integer NOT NULL,
	"response_time_ms" integer,
	"consent_id" varchar(100),
	"account_holder_id" uuid,
	"scopes_used" text[],
	"ip_address" text,
	"error_code" varchar(50),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ob_api_transactions_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ob_consent_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_id" varchar(100) NOT NULL,
	"account_holder_id" uuid,
	"tpp_participant_id" varchar(10),
	"dp_participant_id" varchar(10) DEFAULT 'API000001',
	"scopes" text[] NOT NULL,
	"duration_days" integer DEFAULT 180,
	"code_challenge" varchar(255),
	"code_challenge_method" varchar(10) DEFAULT 'S256',
	"authorization_code" varchar(255),
	"authorization_code_expires_at" timestamp with time zone,
	"authorization_code_used" boolean DEFAULT false,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp with time zone,
	"request_uri" text,
	"state" varchar(255),
	"nonce" varchar(255),
	"redirect_uri" text NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"revoked_by" varchar(50),
	"revoked_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ob_consent_tokens_consent_id_unique" UNIQUE("consent_id"),
	CONSTRAINT "ob_consent_tokens_authorization_code_unique" UNIQUE("authorization_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ob_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar(10) NOT NULL,
	"participant_name" varchar(255) NOT NULL,
	"role" varchar(10) NOT NULL,
	"sectors" text[] DEFAULT ARRAY['banking'],
	"services" text[] DEFAULT ARRAY['AIS', 'PIS'],
	"operation_types" text[] DEFAULT ARRAY['Read', 'Write'],
	"status" varchar(50) DEFAULT 'active',
	"certificate_serial" varchar(255),
	"certificate_valid_from" timestamp with time zone,
	"certificate_expires_at" timestamp with time zone,
	"contact_email" varchar(255) NOT NULL,
	"contact_url" text,
	"developer_portal_url" text,
	"sandbox_url" text,
	"production_url" text,
	"competent_authority_name" varchar(255) DEFAULT 'Bank of Namibia',
	"competent_authority_id" varchar(10) DEFAULT 'NA-BON',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ob_participants_participant_id_unique" UNIQUE("participant_id"),
	CONSTRAINT "ob_participants_certificate_serial_unique" UNIQUE("certificate_serial")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"guest_id" uuid,
	"type" varchar(50) NOT NULL,
	"provider" varchar(50),
	"last_four" varchar(4),
	"expiry_month" integer,
	"expiry_year" integer,
	"is_default" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_payments_attempted" integer DEFAULT 0,
	"total_payments_successful" integer DEFAULT 0,
	"total_payments_failed" integer DEFAULT 0,
	"total_payments_blocked" integer DEFAULT 0,
	"avg_processing_time_ms" integer,
	"p50_processing_time_ms" integer,
	"p95_processing_time_ms" integer,
	"p99_processing_time_ms" integer,
	"max_processing_time_ms" integer,
	"success_rate" numeric(5, 2),
	"failure_rate" numeric(5, 2),
	"timeout_count" integer DEFAULT 0,
	"two_fa_success_rate" numeric(5, 2),
	"fraud_blocked_count" integer DEFAULT 0,
	"fraud_blocked_amount" numeric(15, 2) DEFAULT '0',
	"total_amount_processed" numeric(15, 2) DEFAULT '0',
	"total_amount_blocked" numeric(15, 2) DEFAULT '0',
	"average_transaction_amount" numeric(12, 2),
	"gateway_name" varchar(50),
	"gateway_uptime_percent" numeric(5, 2),
	"gateway_success_rate" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_security_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"booking_id" uuid,
	"payment_id" varchar(255) NOT NULL,
	"payment_reference" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"two_fa_method" varchar(50),
	"two_fa_verified" boolean DEFAULT false NOT NULL,
	"two_fa_attempts" integer DEFAULT 0,
	"two_fa_verified_at" timestamp with time zone,
	"device_fingerprint" varchar(255),
	"ip_address" "inet",
	"user_agent" text,
	"geo_country" varchar(2),
	"geo_city" varchar(100),
	"fraud_score" numeric(5, 2),
	"fraud_checks_passed" boolean DEFAULT false,
	"velocity_check_result" varchar(50),
	"geo_check_result" varchar(50),
	"device_check_result" varchar(50),
	"cvv_verified" boolean,
	"avs_verified" boolean,
	"three_d_secure_verified" boolean,
	"card_tokenized" boolean DEFAULT true,
	"gateway_name" varchar(50),
	"gateway_status" varchar(50),
	"gateway_response_code" varchar(50),
	"gateway_response_time_ms" integer,
	"psd12_compliant" boolean DEFAULT false NOT NULL,
	"psd4_compliant" boolean DEFAULT false NOT NULL,
	"overall_security_passed" boolean DEFAULT false NOT NULL,
	"risk_level" varchar(20),
	"risk_factors" jsonb DEFAULT '{}'::jsonb,
	"blocked" boolean DEFAULT false,
	"block_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"owner_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'Namibia',
	"postal_code" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"star_rating" integer,
	"room_count" integer DEFAULT 0,
	"subscription_tier" varchar(50),
	"currency" varchar(3) DEFAULT 'NAD',
	"timezone" varchar(100) DEFAULT 'Africa/Windhoek',
	"status" varchar(50) DEFAULT 'active',
	"amenities" text[],
	"images" text[],
	"check_in_time" time DEFAULT '14:00',
	"check_out_time" time DEFAULT '11:00',
	"has_restaurant_features" boolean DEFAULT false,
	"is_enterprise" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "record_retention_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"record_type" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"record_created_at" timestamp with time zone NOT NULL,
	"retention_period_years" integer NOT NULL,
	"retention_policy_reason" varchar(255) NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_location" text,
	"archived_by" uuid,
	"deleted_at" timestamp with time zone,
	"deletion_approved_by" uuid,
	"deletion_approval_reason" text,
	"eta_retention_compliant" boolean DEFAULT true NOT NULL,
	"tax_retention_compliant" boolean DEFAULT true NOT NULL,
	"record_size_bytes" bigint,
	"record_checksum" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"restaurant_id" uuid,
	"property_id" uuid,
	"guest_id" uuid,
	"cart_id" varchar(100),
	"table_id" uuid,
	"qr_code" varchar(255),
	"booking_id" uuid,
	"order_number" varchar(100) NOT NULL,
	"order_type" varchar(50) DEFAULT 'dine_in',
	"table_number" varchar(50),
	"room_number" varchar(50),
	"status" varchar(50) DEFAULT 'pending',
	"special_instructions" text,
	"ordered_at" timestamp with time zone DEFAULT now(),
	"estimated_ready_at" timestamp with time zone,
	"served_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "restaurant_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid,
	"property_id" uuid,
	"table_number" varchar(50) NOT NULL,
	"table_name" varchar(100),
	"capacity" integer NOT NULL,
	"location" varchar(100),
	"qr_code" varchar(255) NOT NULL,
	"qr_code_url" text NOT NULL,
	"qr_code_image_url" text,
	"is_active" boolean DEFAULT true,
	"status" varchar(50) DEFAULT 'available',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "restaurant_tables_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cuisine_type" varchar(100),
	"capacity" integer,
	"opening_hours" jsonb,
	"contact_phone" varchar(50),
	"contact_email" varchar(255),
	"images" text[],
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid,
	"property_id" uuid,
	"qr_code" varchar(255) NOT NULL,
	"qr_code_url" text NOT NULL,
	"qr_code_image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "room_qr_codes_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid,
	"rate_name" varchar(100) NOT NULL,
	"rate_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"min_stay_nights" integer DEFAULT 1,
	"max_stay_nights" integer,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"room_number" varchar(50) NOT NULL,
	"room_type" varchar(100) NOT NULL,
	"floor" integer,
	"max_occupancy" integer DEFAULT 2,
	"base_rate" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'NAD',
	"amenities" text[],
	"images" text[],
	"status" varchar(50) DEFAULT 'available',
	"smoking_allowed" boolean DEFAULT false,
	"pet_friendly" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sofia_email_inbox_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"email_address" varchar(255) NOT NULL,
	"imap_host" varchar(255) NOT NULL,
	"imap_port" integer DEFAULT 993,
	"imap_secure" boolean DEFAULT true,
	"imap_username" varchar(255) NOT NULL,
	"imap_password" text NOT NULL,
	"folder_name" varchar(100) DEFAULT 'INBOX',
	"check_interval_minutes" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"last_checked_at" timestamp with time zone,
	"last_email_uid" bigint,
	"auto_reply" boolean DEFAULT true,
	"auto_link_conversation" boolean DEFAULT true,
	"auto_create_guest" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sofia_email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"template_id" uuid,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"subject" text NOT NULL,
	"html_content" text,
	"text_content" text,
	"status" varchar(50) DEFAULT 'pending',
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"bounce_reason" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sofia_email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"guest_id" uuid,
	"conversation_id" uuid,
	"thread_id" varchar(500) NOT NULL,
	"subject" text NOT NULL,
	"initial_message_id" varchar(500),
	"email_count" integer DEFAULT 1,
	"last_email_at" timestamp with time zone,
	"last_replied_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'active',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sofia_incoming_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"guest_id" uuid,
	"conversation_id" uuid,
	"message_id" varchar(500) NOT NULL,
	"in_reply_to" varchar(500),
	"references_header" text,
	"thread_id" varchar(500),
	"from_email" varchar(255) NOT NULL,
	"from_name" varchar(255),
	"to_email" varchar(255) NOT NULL,
	"cc_emails" text[],
	"bcc_emails" text[],
	"subject" text NOT NULL,
	"html_body" text,
	"text_body" text,
	"attachments" jsonb DEFAULT '[]',
	"status" varchar(50) DEFAULT 'pending',
	"processed_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"error_message" text,
	"received_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sofia_voice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid,
	"conversation_id" uuid,
	"external_call_id" varchar(255) NOT NULL,
	"provider" varchar(64) DEFAULT 'generic' NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"handoff_requested" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"property_id" uuid,
	"user_id" uuid,
	"employee_number" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"position" varchar(100) NOT NULL,
	"department" varchar(100),
	"employment_type" varchar(50) DEFAULT 'full_time',
	"status" varchar(50) DEFAULT 'active',
	"hire_date" date NOT NULL,
	"termination_date" date,
	"hourly_rate" numeric(10, 2),
	"salary" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'NAD',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_employee_number_unique" UNIQUE("employee_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid,
	"tenant_id" uuid,
	"property_id" uuid,
	"shift_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_duration_minutes" integer DEFAULT 30,
	"position" varchar(100),
	"shift_type" varchar(50),
	"status" varchar(50) DEFAULT 'scheduled',
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_ticket_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"user_id" uuid,
	"message" text NOT NULL,
	"is_admin_reply" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"category" varchar(100) DEFAULT 'general' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp with time zone,
	"linear_issue_id" varchar(64),
	"linear_issue_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"level" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"user_id" uuid,
	"session_id" varchar(255),
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"category" varchar(100) NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" jsonb,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_whatsapp_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone_number_id" varchar(64) NOT NULL,
	"default_property_id" uuid,
	"access_token" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenant_whatsapp_settings_phone_number_id_unique" UNIQUE("phone_number_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100),
	"domain" varchar(255),
	"status" varchar(50) DEFAULT 'active',
	"subscription_tier" varchar(50) DEFAULT 'starter',
	"subscription_status" varchar(50) DEFAULT 'trial',
	"monthly_price" numeric(10, 2),
	"room_count" integer DEFAULT 0,
	"property_type" varchar(50),
	"has_restaurant_features" boolean DEFAULT false,
	"is_enterprise" boolean DEFAULT false,
	"trial_ends_at" timestamp with time zone,
	"subscription_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"kyc_tier" "kyc_tier" NOT NULL,
	"limit_type" "transaction_limit_type" NOT NULL,
	"limit_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"effective_from" date DEFAULT CURRENT_DATE NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"booking_id" uuid,
	"guest_id" uuid,
	"payment_method_id" uuid,
	"transaction_reference" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NAD',
	"status" varchar(50) DEFAULT 'pending',
	"payment_gateway" varchar(50),
	"gateway_transaction_id" varchar(255),
	"description" text,
	"metadata" jsonb,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transactions_transaction_reference_unique" UNIQUE("transaction_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"account_number" varchar(100) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"branch" varchar(255),
	"account_type" varchar(50) DEFAULT 'trust_account',
	"balance" numeric(10, 2) DEFAULT '0',
	"reserved_amount" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "trust_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_accounts_psd3" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"account_number" varchar(100) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"bank_code" varchar(10),
	"branch" varchar(255),
	"balance" numeric(15, 2) DEFAULT '0',
	"outstanding_liabilities" numeric(15, 2) DEFAULT '0',
	"reserve_percentage" numeric(5, 2) DEFAULT '100.00',
	"last_reconciliation_at" timestamp with time zone,
	"reconciliation_status" varchar(50) DEFAULT 'balanced',
	"deficiency_amount" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'NAD',
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "trust_accounts_psd3_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"method" varchar(50) NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text,
	"is_enabled" boolean DEFAULT false,
	"phone_number" varchar(50),
	"device_id" varchar(255),
	"last_otp_hash" varchar(255),
	"last_otp_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"email_verification_otp" varchar(6),
	"email_verification_otp_expires_at" timestamp,
	"password_hash" varchar(255) NOT NULL,
	"password_reset_token" varchar(255),
	"password_reset_token_expires_at" timestamp,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(50),
	"role" varchar(50) DEFAULT 'user',
	"is_platform_admin" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'active',
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_due_diligence_records" ADD CONSTRAINT "aml_due_diligence_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_due_diligence_records" ADD CONSTRAINT "aml_due_diligence_records_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_due_diligence_records" ADD CONSTRAINT "aml_due_diligence_records_risk_assessment_by_users_id_fk" FOREIGN KEY ("risk_assessment_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_due_diligence_records" ADD CONSTRAINT "aml_due_diligence_records_pep_flag_id_aml_guest_pep_flags_id_fk" FOREIGN KEY ("pep_flag_id") REFERENCES "public"."aml_guest_pep_flags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_due_diligence_records" ADD CONSTRAINT "aml_due_diligence_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_geographic_patterns" ADD CONSTRAINT "aml_geographic_patterns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_geographic_patterns" ADD CONSTRAINT "aml_geographic_patterns_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_geographic_patterns" ADD CONSTRAINT "aml_geographic_patterns_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_pep_id_aml_pep_database_id_fk" FOREIGN KEY ("pep_id") REFERENCES "public"."aml_pep_database"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_edd_completed_by_users_id_fk" FOREIGN KEY ("edd_completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_guest_pep_flags" ADD CONSTRAINT "aml_guest_pep_flags_cleared_by_users_id_fk" FOREIGN KEY ("cleared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_monitoring_rules" ADD CONSTRAINT "aml_monitoring_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_monitoring_rules" ADD CONSTRAINT "aml_monitoring_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_monitoring_rules" ADD CONSTRAINT "aml_monitoring_rules_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_pep_database" ADD CONSTRAINT "aml_pep_database_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_pep_database" ADD CONSTRAINT "aml_pep_database_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_suspicious_transaction_reports" ADD CONSTRAINT "aml_suspicious_transaction_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_suspicious_transaction_reports" ADD CONSTRAINT "aml_suspicious_transaction_reports_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_suspicious_transaction_reports" ADD CONSTRAINT "aml_suspicious_transaction_reports_drafted_by_users_id_fk" FOREIGN KEY ("drafted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_suspicious_transaction_reports" ADD CONSTRAINT "aml_suspicious_transaction_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_suspicious_transaction_reports" ADD CONSTRAINT "aml_suspicious_transaction_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_alerts" ADD CONSTRAINT "aml_transaction_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_alerts" ADD CONSTRAINT "aml_transaction_alerts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_alerts" ADD CONSTRAINT "aml_transaction_alerts_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_alerts" ADD CONSTRAINT "aml_transaction_alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_alerts" ADD CONSTRAINT "aml_transaction_alerts_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_velocity" ADD CONSTRAINT "aml_transaction_velocity_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aml_transaction_velocity" ADD CONSTRAINT "aml_transaction_velocity_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bon_incident_reports" ADD CONSTRAINT "bon_incident_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bon_incident_reports" ADD CONSTRAINT "bon_incident_reports_incident_id_cybersecurity_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."cybersecurity_incidents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bon_incident_reports" ADD CONSTRAINT "bon_incident_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_rooms" ADD CONSTRAINT "booking_rooms_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_rooms" ADD CONSTRAINT "booking_rooms_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_content_id_cms_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."cms_content"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_menu_items" ADD CONSTRAINT "cms_menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cms_menu_items" ADD CONSTRAINT "cms_menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_verification_cases" ADD CONSTRAINT "compliance_verification_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_verification_cases" ADD CONSTRAINT "compliance_verification_cases_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_verification_documents" ADD CONSTRAINT "compliance_verification_documents_case_id_compliance_verification_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."compliance_verification_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_verification_documents" ADD CONSTRAINT "compliance_verification_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_verification_documents" ADD CONSTRAINT "compliance_verification_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumer_rights_requests" ADD CONSTRAINT "consumer_rights_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumer_rights_requests" ADD CONSTRAINT "consumer_rights_requests_account_holder_id_guests_id_fk" FOREIGN KEY ("account_holder_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumer_rights_requests" ADD CONSTRAINT "consumer_rights_requests_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumer_rights_requests" ADD CONSTRAINT "consumer_rights_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_graph_edges" ADD CONSTRAINT "crm_graph_edges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_guest_memory_facts" ADD CONSTRAINT "crm_guest_memory_facts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_guest_memory_facts" ADD CONSTRAINT "crm_guest_memory_facts_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_outreach_touches" ADD CONSTRAINT "crm_outreach_touches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_outreach_touches" ADD CONSTRAINT "crm_outreach_touches_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_outreach_touches" ADD CONSTRAINT "crm_outreach_touches_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cybersecurity_incidents" ADD CONSTRAINT "cybersecurity_incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_transaction_tracking" ADD CONSTRAINT "daily_transaction_tracking_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_transaction_tracking" ADD CONSTRAINT "daily_transaction_tracking_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_signer_id_users_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_risk_profile_id_fraud_risk_profiles_id_fk" FOREIGN KEY ("risk_profile_id") REFERENCES "public"."fraud_risk_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_cases" ADD CONSTRAINT "fraud_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_cases" ADD CONSTRAINT "fraud_cases_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_cases" ADD CONSTRAINT "fraud_cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_detection_rules" ADD CONSTRAINT "fraud_detection_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_detection_rules" ADD CONSTRAINT "fraud_detection_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_device_fingerprints" ADD CONSTRAINT "fraud_device_fingerprints_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_device_fingerprints" ADD CONSTRAINT "fraud_device_fingerprints_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_risk_profiles" ADD CONSTRAINT "fraud_risk_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_risk_profiles" ADD CONSTRAINT "fraud_risk_profiles_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_risk_profiles" ADD CONSTRAINT "fraud_risk_profiles_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_statistics" ADD CONSTRAINT "fraud_statistics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_profiles" ADD CONSTRAINT "guest_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_profiles" ADD CONSTRAINT "guest_profiles_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guests" ADD CONSTRAINT "guests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kyc_profile_id_kyc_profiles_id_fk" FOREIGN KEY ("kyc_profile_id") REFERENCES "public"."kyc_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_kyc_reviewed_by_users_id_fk" FOREIGN KEY ("kyc_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_upgrade_prompts" ADD CONSTRAINT "kyc_upgrade_prompts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_upgrade_prompts" ADD CONSTRAINT "kyc_upgrade_prompts_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_upgrade_prompts" ADD CONSTRAINT "kyc_upgrade_prompts_trigger_transaction_id_transactions_id_fk" FOREIGN KEY ("trigger_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_balance_tracking" ADD CONSTRAINT "monthly_balance_tracking_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_balance_tracking" ADD CONSTRAINT "monthly_balance_tracking_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "namqr_codes" ADD CONSTRAINT "namqr_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "namqr_codes" ADD CONSTRAINT "namqr_codes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "namqr_codes" ADD CONSTRAINT "namqr_codes_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ob_api_transactions" ADD CONSTRAINT "ob_api_transactions_tpp_participant_id_ob_participants_participant_id_fk" FOREIGN KEY ("tpp_participant_id") REFERENCES "public"."ob_participants"("participant_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ob_api_transactions" ADD CONSTRAINT "ob_api_transactions_consent_id_ob_consent_tokens_consent_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."ob_consent_tokens"("consent_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ob_api_transactions" ADD CONSTRAINT "ob_api_transactions_account_holder_id_guests_id_fk" FOREIGN KEY ("account_holder_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ob_consent_tokens" ADD CONSTRAINT "ob_consent_tokens_account_holder_id_guests_id_fk" FOREIGN KEY ("account_holder_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ob_consent_tokens" ADD CONSTRAINT "ob_consent_tokens_tpp_participant_id_ob_participants_participant_id_fk" FOREIGN KEY ("tpp_participant_id") REFERENCES "public"."ob_participants"("participant_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_performance_metrics" ADD CONSTRAINT "payment_performance_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_security_audit" ADD CONSTRAINT "payment_security_audit_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_security_audit" ADD CONSTRAINT "payment_security_audit_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_security_audit" ADD CONSTRAINT "payment_security_audit_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_settings" ADD CONSTRAINT "property_settings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "record_retention_audit" ADD CONSTRAINT "record_retention_audit_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "record_retention_audit" ADD CONSTRAINT "record_retention_audit_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "record_retention_audit" ADD CONSTRAINT "record_retention_audit_deletion_approved_by_users_id_fk" FOREIGN KEY ("deletion_approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_table_id_restaurant_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_qr_codes" ADD CONSTRAINT "room_qr_codes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_qr_codes" ADD CONSTRAINT "room_qr_codes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_rates" ADD CONSTRAINT "room_rates_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_inbox_config" ADD CONSTRAINT "sofia_email_inbox_config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_inbox_config" ADD CONSTRAINT "sofia_email_inbox_config_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_logs" ADD CONSTRAINT "sofia_email_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_threads" ADD CONSTRAINT "sofia_email_threads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_threads" ADD CONSTRAINT "sofia_email_threads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_threads" ADD CONSTRAINT "sofia_email_threads_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_email_threads" ADD CONSTRAINT "sofia_email_threads_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_incoming_emails" ADD CONSTRAINT "sofia_incoming_emails_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_incoming_emails" ADD CONSTRAINT "sofia_incoming_emails_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_incoming_emails" ADD CONSTRAINT "sofia_incoming_emails_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_incoming_emails" ADD CONSTRAINT "sofia_incoming_emails_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_voice_sessions" ADD CONSTRAINT "sofia_voice_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_voice_sessions" ADD CONSTRAINT "sofia_voice_sessions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sofia_voice_sessions" ADD CONSTRAINT "sofia_voice_sessions_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_ticket_replies" ADD CONSTRAINT "support_ticket_replies_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_ticket_replies" ADD CONSTRAINT "support_ticket_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_whatsapp_settings" ADD CONSTRAINT "tenant_whatsapp_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_whatsapp_settings" ADD CONSTRAINT "tenant_whatsapp_settings_default_property_id_properties_id_fk" FOREIGN KEY ("default_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_limits" ADD CONSTRAINT "transaction_limits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_accounts" ADD CONSTRAINT "trust_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_accounts_psd3" ADD CONSTRAINT "trust_accounts_psd3_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_guest_id" ON "ai_conversations" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_property_id" ON "ai_conversations" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_session_id" ON "ai_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_messages_conversation_id" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_messages_created_at" ON "ai_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_dd_records_tenant_id" ON "aml_due_diligence_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_dd_records_guest_id" ON "aml_due_diligence_records" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_dd_records_risk_level" ON "aml_due_diligence_records" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_dd_records_next_review_date" ON "aml_due_diligence_records" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_geo_patterns_guest_id" ON "aml_geographic_patterns" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_geo_patterns_country_code" ON "aml_geographic_patterns" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_geo_patterns_is_high_risk" ON "aml_geographic_patterns" USING btree ("is_high_risk_jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_guest_pep_flags_guest_id" ON "aml_guest_pep_flags" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_guest_pep_flags_pep_id" ON "aml_guest_pep_flags" USING btree ("pep_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_guest_pep_flags_is_active" ON "aml_guest_pep_flags" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_guest_pep_flags_tenant_id" ON "aml_guest_pep_flags" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_monitoring_rules_tenant_id" ON "aml_monitoring_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_monitoring_rules_rule_code" ON "aml_monitoring_rules" USING btree ("rule_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_monitoring_rules_is_active" ON "aml_monitoring_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_tenant_id" ON "aml_pep_database" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_full_name" ON "aml_pep_database" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_id_number" ON "aml_pep_database" USING btree ("id_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_passport_number" ON "aml_pep_database" USING btree ("passport_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_risk_level" ON "aml_pep_database" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_pep_database_is_active" ON "aml_pep_database" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_tenant_id" ON "aml_suspicious_transaction_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_guest_id" ON "aml_suspicious_transaction_reports" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_status" ON "aml_suspicious_transaction_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_report_deadline" ON "aml_suspicious_transaction_reports" USING btree ("report_deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_created_at" ON "aml_suspicious_transaction_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_str_retention_until" ON "aml_suspicious_transaction_reports" USING btree ("retention_until");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_tenant_id" ON "aml_transaction_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_transaction_id" ON "aml_transaction_alerts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_guest_id" ON "aml_transaction_alerts" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_status" ON "aml_transaction_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_risk_level" ON "aml_transaction_alerts" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_transaction_alerts_created_at" ON "aml_transaction_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_velocity_guest_id" ON "aml_transaction_velocity" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_velocity_window_start" ON "aml_transaction_velocity" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aml_velocity_is_suspicious" ON "aml_transaction_velocity" USING btree ("is_suspicious");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_trail_tenant_timestamp" ON "audit_trail" USING btree ("tenant_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_trail_resource" ON "audit_trail" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bon_reports_tenant" ON "bon_incident_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bon_reports_incident" ON "bon_incident_reports" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bon_reports_submission_date" ON "bon_incident_reports" USING btree ("submission_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bon_reports_bon_status" ON "bon_incident_reports" USING btree ("bon_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bon_reports_reference" ON "bon_incident_reports" USING btree ("bon_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_booking_rooms_booking_id" ON "booking_rooms" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_booking_rooms_room_id" ON "booking_rooms" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_tenant_id" ON "bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_property_id" ON "bookings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_guest_id" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_status" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_check_in_date" ON "bookings" USING btree ("check_in_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cms_media_property_id" ON "cms_media" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cms_menu_items_restaurant_id" ON "cms_menu_items" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cms_menu_items_category_id" ON "cms_menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_cases_tenant" ON "compliance_verification_cases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_cases_status" ON "compliance_verification_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_cases_subject" ON "compliance_verification_cases" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_docs_case" ON "compliance_verification_documents" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_docs_tenant" ON "compliance_verification_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consumer_rights_requests_account_holder" ON "consumer_rights_requests" USING btree ("account_holder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consumer_rights_requests_type" ON "consumer_rights_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consumer_rights_requests_status" ON "consumer_rights_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_graph_edges_tenant" ON "crm_graph_edges" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_graph_edges_src" ON "crm_graph_edges" USING btree ("tenant_id","src_entity_type","src_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_graph_edges_dst" ON "crm_graph_edges" USING btree ("tenant_id","dst_entity_type","dst_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_crm_graph_edges_natural" ON "crm_graph_edges" USING btree ("tenant_id","src_entity_type","src_entity_id","dst_entity_type","dst_entity_id","relation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_guest_memory_guest" ON "crm_guest_memory_facts" USING btree ("tenant_id","guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_outreach_tenant_guest" ON "crm_outreach_touches" USING btree ("tenant_id","guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_outreach_status" ON "crm_outreach_touches" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cybersecurity_incidents_severity" ON "cybersecurity_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cybersecurity_incidents_status" ON "cybersecurity_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cybersecurity_incidents_detected_at" ON "cybersecurity_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_tracking_tenant_guest_date_unique" ON "daily_transaction_tracking" USING btree ("tenant_id","guest_id","tracking_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_tracking_tenant_id" ON "daily_transaction_tracking" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_tracking_guest_id" ON "daily_transaction_tracking" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_tracking_date" ON "daily_transaction_tracking" USING btree ("tracking_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_tracking_limit_exceeded" ON "daily_transaction_tracking" USING btree ("limit_exceeded");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_tenant" ON "electronic_signatures" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_signer" ON "electronic_signatures" USING btree ("signer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_document" ON "electronic_signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_document_type" ON "electronic_signatures" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_timestamp" ON "electronic_signatures" USING btree ("signature_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_electronic_signatures_status" ON "electronic_signatures" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_tenant" ON "fraud_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_risk_profile" ON "fraud_alerts" USING btree ("risk_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_status" ON "fraud_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_severity" ON "fraud_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_assigned" ON "fraud_alerts" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_alerts_created" ON "fraud_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_cases_tenant" ON "fraud_cases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_cases_reference" ON "fraud_cases" USING btree ("case_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_cases_status" ON "fraud_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_cases_severity" ON "fraud_cases" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_cases_guest" ON "fraud_cases" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_rules_tenant" ON "fraud_detection_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_rules_type" ON "fraud_detection_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_rules_active" ON "fraud_detection_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_rules_priority" ON "fraud_detection_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_device_fingerprints_tenant" ON "fraud_device_fingerprints" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_device_fingerprints_guest" ON "fraud_device_fingerprints" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_device_fingerprints_device_id" ON "fraud_device_fingerprints" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_device_fingerprints_trust_score" ON "fraud_device_fingerprints" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_tenant" ON "fraud_risk_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_transaction" ON "fraud_risk_profiles" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_guest" ON "fraud_risk_profiles" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_risk_level" ON "fraud_risk_profiles" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_decision" ON "fraud_risk_profiles" USING btree ("decision");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_risk_profiles_detected_at" ON "fraud_risk_profiles" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_statistics_tenant" ON "fraud_statistics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fraud_statistics_period" ON "fraud_statistics" USING btree ("period_type","period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_profiles_guest_id" ON "guest_profiles" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_reviews_property_id" ON "guest_reviews" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_reviews_rating" ON "guest_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guests_tenant_id" ON "guests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guests_email" ON "guests" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_documents_kyc_profile_id" ON "kyc_documents" USING btree ("kyc_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_documents_document_type" ON "kyc_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_documents_is_verified" ON "kyc_documents" USING btree ("is_verified");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_profiles_tenant_guest_unique" ON "kyc_profiles" USING btree ("tenant_id","guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_profiles_tenant_id" ON "kyc_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_profiles_guest_id" ON "kyc_profiles" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_profiles_kyc_tier" ON "kyc_profiles" USING btree ("kyc_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_profiles_kyc_status" ON "kyc_profiles" USING btree ("kyc_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_upgrade_prompts_tenant_id" ON "kyc_upgrade_prompts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_upgrade_prompts_guest_id" ON "kyc_upgrade_prompts" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_upgrade_prompts_is_shown" ON "kyc_upgrade_prompts" USING btree ("is_shown");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kyc_upgrade_prompts_created_at" ON "kyc_upgrade_prompts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_tracking_tenant_guest_month_unique" ON "monthly_balance_tracking" USING btree ("tenant_id","guest_id","tracking_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monthly_tracking_tenant_id" ON "monthly_balance_tracking" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monthly_tracking_guest_id" ON "monthly_balance_tracking" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monthly_tracking_month" ON "monthly_balance_tracking" USING btree ("tracking_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monthly_tracking_limit_exceeded" ON "monthly_balance_tracking" USING btree ("limit_exceeded");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_namqr_codes_qr_reference" ON "namqr_codes" USING btree ("qr_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_namqr_codes_token_vault" ON "namqr_codes" USING btree ("token_vault_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_namqr_codes_is_active" ON "namqr_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_api_transactions_tpp" ON "ob_api_transactions" USING btree ("tpp_participant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_api_transactions_endpoint" ON "ob_api_transactions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_api_transactions_created_at" ON "ob_api_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_consent_tokens_account_holder" ON "ob_consent_tokens" USING btree ("account_holder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_consent_tokens_tpp" ON "ob_consent_tokens" USING btree ("tpp_participant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_consent_tokens_status" ON "ob_consent_tokens" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_consent_tokens_expires" ON "ob_consent_tokens" USING btree ("access_token_expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_participants_role" ON "ob_participants" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ob_participants_status" ON "ob_participants" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_metrics_tenant" ON "payment_performance_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_metrics_measured" ON "payment_performance_metrics" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_metrics_gateway" ON "payment_performance_metrics" USING btree ("gateway_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_tenant" ON "payment_security_audit" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_booking" ON "payment_security_audit" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_payment_id" ON "payment_security_audit" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_created" ON "payment_security_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_fraud_score" ON "payment_security_audit" USING btree ("fraud_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_blocked" ON "payment_security_audit" USING btree ("blocked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_security_compliance" ON "payment_security_audit" USING btree ("psd12_compliant","psd4_compliant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_tenant_id" ON "properties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_slug" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_type" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_status" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_property_setting" ON "property_settings" USING btree ("property_id","setting_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_retention_tenant" ON "record_retention_audit" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_retention_record_type" ON "record_retention_audit" USING btree ("record_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_retention_status" ON "record_retention_audit" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_retention_expires" ON "record_retention_audit" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_orders_restaurant_id" ON "restaurant_orders" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_orders_status" ON "restaurant_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_tables_restaurant_id" ON "restaurant_tables" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_tables_qr_code" ON "restaurant_tables" USING btree ("qr_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_table_number" ON "restaurant_tables" USING btree ("restaurant_id","table_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_qr_codes_room_id" ON "room_qr_codes" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_qr_codes_property_id" ON "room_qr_codes" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_qr_codes_qr_code" ON "room_qr_codes" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rooms_property_id" ON "rooms" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rooms_status" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_room_number" ON "rooms" USING btree ("property_id","room_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_email_inbox_config_tenant_id" ON "sofia_email_inbox_config" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_email_inbox_config_is_active" ON "sofia_email_inbox_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_email_logs_tenant_id" ON "sofia_email_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_email_logs_status" ON "sofia_email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_email_logs_recipient_email" ON "sofia_email_logs" USING btree ("recipient_email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sofia_email_threads_tenant_thread_id" ON "sofia_email_threads" USING btree ("tenant_id","thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_incoming_emails_tenant_id" ON "sofia_incoming_emails" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_incoming_emails_message_id" ON "sofia_incoming_emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_incoming_emails_thread_id" ON "sofia_incoming_emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_incoming_emails_from_email" ON "sofia_incoming_emails" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_incoming_emails_status" ON "sofia_incoming_emails" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sofia_incoming_emails_tenant_message_id" ON "sofia_incoming_emails" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_voice_sessions_tenant_id" ON "sofia_voice_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sofia_voice_sessions_external_call" ON "sofia_voice_sessions" USING btree ("external_call_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sofia_voice_sessions_tenant_external_call" ON "sofia_voice_sessions" USING btree ("tenant_id","external_call_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_tenant_id" ON "staff" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_property_id" ON "staff" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_status" ON "staff" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_shifts_staff_id" ON "staff_shifts" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_shifts_shift_date" ON "staff_shifts" USING btree ("shift_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_support_ticket_replies_ticket_id" ON "support_ticket_replies" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_support_tickets_tenant_id" ON "support_tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_support_tickets_status" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_system_logs_tenant_level" ON "system_logs" USING btree ("tenant_id","level","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_setting" ON "system_settings" USING btree ("tenant_id","category","setting_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tenant_whatsapp_settings_tenant_id" ON "tenant_whatsapp_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_limits_tenant_tier_limit_unique" ON "transaction_limits" USING btree ("tenant_id","kyc_tier","limit_type","effective_from");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transaction_limits_tenant_id" ON "transaction_limits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transaction_limits_kyc_tier" ON "transaction_limits" USING btree ("kyc_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transaction_limits_is_active" ON "transaction_limits" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_tenant_id" ON "transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_booking_id" ON "transactions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trust_accounts_psd3_tenant" ON "trust_accounts_psd3" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trust_accounts_psd3_status" ON "trust_accounts_psd3" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_two_factor_auth_user_method" ON "two_factor_auth" USING btree ("user_id","method");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_two_factor_auth_enabled" ON "two_factor_auth" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant_email" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email_verification_otp" ON "users" USING btree ("email_verification_otp");