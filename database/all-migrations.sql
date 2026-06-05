-- Hotel Etuna — consolidated migrations (generated; prefer npm run db:migrate:all)
-- Generated: 2026-06-04T15:01:33.266Z
BEGIN;

-- === 0000_equal_lifeguard.sql ===
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

-- === 0001_broad_firebird.sql ===
CREATE TABLE IF NOT EXISTS "restaurant_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb,
	"special_instructions" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_order_id_restaurant_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."restaurant_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_menu_item_id_cms_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."cms_menu_items"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_order_items_order_id" ON "restaurant_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_order_items_menu_item_id" ON "restaurant_order_items" USING btree ("menu_item_id");

-- === 0002_daffy_silver_surfer.sql ===
CREATE TABLE IF NOT EXISTS "crm_consent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"previous_marketing_consent" boolean,
	"new_marketing_consent" boolean NOT NULL,
	"source" varchar(64) DEFAULT 'dashboard' NOT NULL,
	"reason" text,
	"changed_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_consent_events" ADD CONSTRAINT "crm_consent_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_consent_events" ADD CONSTRAINT "crm_consent_events_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_consent_events" ADD CONSTRAINT "crm_consent_events_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_consent_events_tenant_id" ON "crm_consent_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_consent_events_guest_id" ON "crm_consent_events" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_consent_events_created_at" ON "crm_consent_events" USING btree ("created_at");

-- === 0003_hotel_etuna_partner_network.sql ===
-- Hotel Etuna Partner Network Migration
-- Adds hub-and-spoke multi-tenancy with partner support
-- Date: 2026-04-28

-- ============================================================================
-- STEP 1: Create tenant_type enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "tenant_type" AS ENUM ('hub', 'partner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new columns to tenants table
-- ============================================================================

-- Add type column (hub vs partner)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "type" "tenant_type" NOT NULL DEFAULT 'hub';

-- Add parent_tenant_id for partner -> hub relationship
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "parent_tenant_id" uuid;

-- Add commission percentage for partners (default 10%)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5,2) DEFAULT 10.00;

-- ============================================================================
-- STEP 3: Add commission_amount to bookings table
-- ============================================================================

-- Track commission amount for partner bookings
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "commission_amount" numeric(12,2);

-- ============================================================================
-- STEP 4: Create partner_invites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "partner_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "token" varchar(255) UNIQUE NOT NULL,
  "property_name" varchar(255) NOT NULL,
  "claimed" boolean DEFAULT false NOT NULL,
  "claimed_at" timestamp with time zone,
  "claimed_by_user_id" uuid,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by_user_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STEP 5: Add foreign key constraints
-- ============================================================================

-- Parent tenant foreign key
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parent_tenant_id_tenants_id_fk" 
    FOREIGN KEY ("parent_tenant_id") REFERENCES "public"."tenants"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner invites -> users (created by)
DO $$ BEGIN
  ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_created_by_user_id_users_id_fk" 
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner invites -> users (claimed by)
DO $$ BEGIN
  ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_claimed_by_user_id_users_id_fk" 
    FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") 
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 6: Create indexes for performance
-- ============================================================================

-- Index on tenant type for filtering
CREATE INDEX IF NOT EXISTS "idx_tenants_type" ON "tenants" USING btree ("type");

-- Index on parent_tenant_id for partner lookups
CREATE INDEX IF NOT EXISTS "idx_tenants_parent_tenant_id" ON "tenants" USING btree ("parent_tenant_id");

-- Index on commission_amount for reporting
CREATE INDEX IF NOT EXISTS "idx_bookings_commission_amount" ON "bookings" USING btree ("commission_amount") WHERE "commission_amount" IS NOT NULL;

-- Indexes on partner_invites
CREATE INDEX IF NOT EXISTS "idx_partner_invites_email" ON "partner_invites" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_token" ON "partner_invites" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_claimed" ON "partner_invites" USING btree ("claimed");
CREATE INDEX IF NOT EXISTS "idx_partner_invites_expires_at" ON "partner_invites" USING btree ("expires_at");

-- ============================================================================
-- STEP 7: Add check constraints
-- ============================================================================

-- Ensure commission_percent is between 0 and 100
ALTER TABLE "tenants" ADD CONSTRAINT IF NOT EXISTS "tenants_commission_percent_check" 
  CHECK ("commission_percent" >= 0 AND "commission_percent" <= 100);

-- Ensure commission_amount is non-negative
ALTER TABLE "bookings" ADD CONSTRAINT IF NOT EXISTS "bookings_commission_amount_check" 
  CHECK ("commission_amount" IS NULL OR "commission_amount" >= 0);

-- Hub tenants cannot have a parent
ALTER TABLE "tenants" ADD CONSTRAINT IF NOT EXISTS "tenants_hub_no_parent_check" 
  CHECK (("type" = 'hub' AND "parent_tenant_id" IS NULL) OR "type" = 'partner');

-- Partner tenants must have a parent
ALTER TABLE "tenants" ADD CONSTRAINT IF NOT EXISTS "tenants_partner_has_parent_check" 
  CHECK (("type" = 'partner' AND "parent_tenant_id" IS NOT NULL) OR "type" = 'hub');

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN "tenants"."type" IS 'Tenant type: hub (Hotel Etuna) or partner (referral properties)';
COMMENT ON COLUMN "tenants"."parent_tenant_id" IS 'For partners: references the hub tenant (Hotel Etuna)';
COMMENT ON COLUMN "tenants"."commission_percent" IS 'Commission percentage for partner bookings (0-100)';
COMMENT ON COLUMN "bookings"."commission_amount" IS 'Commission amount retained by hub for partner bookings';
COMMENT ON TABLE "partner_invites" IS 'Invite tokens for onboarding referral partners';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- === 0004_hotel_etuna_tenant_rls_policies.sql ===
-- Hotel Etuna Tenant RLS Policies
-- Enforces partner isolation while allowing hub-level reporting access.
-- Date: 2026-04-28

-- IMPORTANT:
-- App must set `app.tenant_id` for each request/session before querying tenant-scoped tables.

BEGIN;

-- Shared predicate:
-- - Partner tenant: only own rows
-- - Hub tenant: can read/write across tenant-scoped rows for operations/reporting
--
-- current_setting(..., true) returns NULL if not set (safe default deny)

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    GROUP BY table_name
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I;',
      'tenant_access_' || t.table_name,
      t.table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR ALL
       USING (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR EXISTS (
           SELECT 1
           FROM public.tenants hub_tenant
           WHERE hub_tenant.id::text = current_setting(''app.tenant_id'', true)
             AND hub_tenant.type = ''hub''
         )
       )
       WITH CHECK (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR EXISTS (
           SELECT 1
           FROM public.tenants hub_tenant
           WHERE hub_tenant.id::text = current_setting(''app.tenant_id'', true)
             AND hub_tenant.type = ''hub''
         )
       );',
      'tenant_access_' || t.table_name,
      t.table_name
    );
  END LOOP;
END $$;

-- Tenants table policy (no tenant_id column)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_tenants ON public.tenants;
CREATE POLICY tenant_access_tenants ON public.tenants
FOR ALL
USING (
  id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

-- Partner invites are hub-admin operational data; partner tenants have no access.
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_only_partner_invites ON public.partner_invites;
CREATE POLICY hub_only_partner_invites ON public.partner_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

COMMIT;

-- === 0005_hotel_etuna_partner_constraints.sql ===
-- Hotel Etuna Partner Constraint Fixes
-- Adds constraints that failed in 0003 due unsupported "ADD CONSTRAINT IF NOT EXISTS" syntax.

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_commission_percent_check
    CHECK (commission_percent >= 0 AND commission_percent <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_commission_amount_check
    CHECK (commission_amount IS NULL OR commission_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_hub_no_parent_check
    CHECK ((type = 'hub' AND parent_tenant_id IS NULL) OR type = 'partner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_partner_has_parent_check
    CHECK ((type = 'partner' AND parent_tenant_id IS NOT NULL) OR type = 'hub');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- === 0006_fix_rls_recursion_with_tenant_type.sql ===
-- Fix RLS recursion by removing self-referential tenants lookup from policy predicates.
-- Uses session context:
--   app.tenant_id   -> active tenant UUID
--   app.tenant_type -> 'hub' | 'partner'

BEGIN;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I;',
      'tenant_access_' || t.table_name,
      t.table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR ALL
       USING (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR current_setting(''app.tenant_type'', true) = ''hub''
       )
       WITH CHECK (
         tenant_id::text = current_setting(''app.tenant_id'', true)
         OR current_setting(''app.tenant_type'', true) = ''hub''
       );',
      'tenant_access_' || t.table_name,
      t.table_name
    );
  END LOOP;
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_tenants ON public.tenants;
CREATE POLICY tenant_access_tenants ON public.tenants
FOR ALL
USING (
  id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
)
WITH CHECK (
  id::text = current_setting('app.tenant_id', true)
  OR current_setting('app.tenant_type', true) = 'hub'
);

ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hub_only_partner_invites ON public.partner_invites;
CREATE POLICY hub_only_partner_invites ON public.partner_invites
FOR ALL
USING (current_setting('app.tenant_type', true) = 'hub')
WITH CHECK (current_setting('app.tenant_type', true) = 'hub');

COMMIT;

-- === 0007_cash_payments_and_reconciliation.sql ===
-- Phase 2: Cash payments + reconciliation hardening
-- Note: 0008_reconcile_neon_baseline.sql repeats this DDL idempotently for Neon; prefer 0008 on production apply.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_tendered numeric(10, 2),
  ADD COLUMN IF NOT EXISTS change_given numeric(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_number varchar(100);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  reconciliation_date date NOT NULL,
  shift varchar(20) NOT NULL DEFAULT 'full_day',
  expected_amount numeric(12, 2) NOT NULL DEFAULT 0,
  actual_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discrepancy numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  staff_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date
  ON cash_reconciliations (reconciliation_date);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_property_date
  ON cash_reconciliations (property_id, reconciliation_date);

-- === 0008_reconcile_neon_baseline.sql ===
-- 0008_reconcile_neon_baseline.sql
-- Purpose: safe, idempotent reconciliation with Neon baseline.
-- IMPORTANT:
-- - Non-destructive only (no DROP POLICY CASCADE / no DISABLE RLS)
-- - Intended for controlled execution and audit visibility.

BEGIN;

-- 1) Ensure cash columns exist on bookings (Phase 2 baseline)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_tendered numeric(10, 2),
  ADD COLUMN IF NOT EXISTS change_given numeric(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_number varchar(100);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method
  ON public.bookings (payment_method);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON public.bookings (payment_status);

-- 2) Ensure cash_reconciliations table exists with expected core columns
CREATE TABLE IF NOT EXISTS public.cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  reconciliation_date date NOT NULL,
  shift varchar(20) NOT NULL DEFAULT 'full_day',
  expected_amount numeric(12, 2) NOT NULL DEFAULT 0,
  actual_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discrepancy numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  staff_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date
  ON public.cash_reconciliations (reconciliation_date);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_property_date
  ON public.cash_reconciliations (property_id, reconciliation_date);

-- 3) Ensure partner/tenant check constraints exist
DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_commission_percent_check
    CHECK (commission_percent >= 0 AND commission_percent <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_commission_amount_check
    CHECK (commission_amount IS NULL OR commission_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_hub_no_parent_check
    CHECK ((type = 'hub' AND parent_tenant_id IS NULL) OR type = 'partner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_partner_has_parent_check
    CHECK ((type = 'partner' AND parent_tenant_id IS NOT NULL) OR type = 'hub');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Ensure RLS is enabled for cash_reconciliations and tenant policy exists
ALTER TABLE public.cash_reconciliations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE '
    CREATE POLICY tenant_access_cash_reconciliations
    ON public.cash_reconciliations
    FOR ALL
    USING (
      tenant_id::text = current_setting(''app.tenant_id'', true)
      OR current_setting(''app.tenant_type'', true) = ''hub''
    )
    WITH CHECK (
      tenant_id::text = current_setting(''app.tenant_id'', true)
      OR current_setting(''app.tenant_type'', true) = ''hub''
    )';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- === 0009_booking_charges_folio.sql ===
-- Stay folio ledger: room + F&B + payments per booking (separate from guest_profiles loyalty)

DO $$ BEGIN
  CREATE TYPE booking_charge_type AS ENUM ('room', 'fnb', 'tax', 'adjustment', 'payment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_charge_status AS ENUM ('open', 'settled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS booking_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  charge_type booking_charge_type NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'NAD',
  status booking_charge_status NOT NULL DEFAULT 'open',
  reference_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id ON booking_charges(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_charges_status ON booking_charges(status);
CREATE INDEX IF NOT EXISTS idx_booking_charges_type ON booking_charges(charge_type);
CREATE INDEX IF NOT EXISTS idx_booking_charges_tenant_id ON booking_charges(tenant_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS folio_closed_at timestamptz;

-- === 0010_booking_charges_rls.sql ===
-- RLS for booking_charges (table added in 0009 after bulk tenant_id policies in 0004)

BEGIN;

ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_access_booking_charges ON public.booking_charges;

CREATE POLICY tenant_access_booking_charges ON public.booking_charges
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1
    FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

COMMIT;

-- === 0011_fnb_inventory.sql ===
-- F&B inventory: SKU stock levels, menu links, movements, low-stock alerts

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  sku varchar(64) NOT NULL,
  name varchar(255) NOT NULL,
  unit varchar(32) NOT NULL DEFAULT 'each',
  category varchar(64),
  quantity_on_hand numeric(12, 3) NOT NULL DEFAULT 0,
  reorder_point numeric(12, 3) NOT NULL DEFAULT 12,
  reorder_quantity numeric(12, 3) DEFAULT 24,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_tenant_sku
  ON inventory_items(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant_id
  ON inventory_items(restaurant_id);

CREATE TABLE IF NOT EXISTS menu_item_inventory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES cms_menu_items(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_per_sale numeric(12, 3) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_item_inventory_links_menu_item
  ON menu_item_inventory_links(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_inventory_links_inventory
  ON menu_item_inventory_links(inventory_item_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type varchar(32) NOT NULL,
  quantity_delta numeric(12, 3) NOT NULL,
  quantity_after numeric(12, 3) NOT NULL,
  reference_type varchar(64),
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_item_id
  ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at
  ON stock_movements(created_at);

CREATE TABLE IF NOT EXISTS stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_type varchar(32) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'open',
  quantity_at_alert numeric(12, 3) NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_inventory_status
  ON stock_alerts(inventory_item_id, status);

-- === 0012_adumo_virtual_payment_sessions.sql ===
-- Adumo Virtual hosted-page payment sessions (merchantReference → booking)
CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  merchant_reference VARCHAR(255) NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  purpose VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  session_data JSONB,
  adumo_transaction_index VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_booking_id ON payment_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires_at ON payment_sessions(expires_at);

-- === 0013_platform_billing.sql ===
-- Buffr platform billing: settlement profiles, fee accruals, monthly invoices (PRD §3.5.3)

BEGIN;

-- Settlement bank profiles (property guest collections vs Buffr platform billing)
CREATE TABLE IF NOT EXISTS settlement_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  party VARCHAR(20) NOT NULL CHECK (party IN ('property', 'platform')),
  profile_key VARCHAR(100) NOT NULL UNIQUE,
  legal_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  branch_code VARCHAR(20),
  swift_code VARCHAR(20),
  account_type VARCHAR(50),
  registration_ref VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_accounts_tenant ON settlement_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_accounts_party ON settlement_accounts(party);

-- Per-tenant fee schedule (Buffr → property)
CREATE TABLE IF NOT EXISTS platform_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  card_processing_percent NUMERIC(6, 3) NOT NULL DEFAULT 2.500,
  card_processing_fixed_nad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_subscription_nad NUMERIC(10, 2) NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accrued processing fees (from successful card captures)
CREATE TABLE IF NOT EXISTS platform_fee_accruals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  merchant_reference VARCHAR(255),
  gateway_transaction_id VARCHAR(255),
  purpose VARCHAR(50) NOT NULL,
  gross_amount NUMERIC(12, 2) NOT NULL,
  fee_amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  period_month CHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued', 'invoiced', 'void')),
  invoice_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_fee_accruals_tenant_period
  ON platform_fee_accruals(tenant_id, period_month, status);
CREATE INDEX IF NOT EXISTS idx_platform_fee_accruals_invoice
  ON platform_fee_accruals(invoice_id);

-- Monthly platform invoices (Buffr → property)
CREATE TABLE IF NOT EXISTS platform_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'void')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant_status
  ON platform_invoices(tenant_id, status);

CREATE TABLE IF NOT EXISTS platform_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
  line_type VARCHAR(30) NOT NULL
    CHECK (line_type IN ('subscription', 'processing_fee', 'adjustment')),
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_amount NUMERIC(12, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_lines_invoice
  ON platform_invoice_lines(invoice_id);

ALTER TABLE platform_fee_accruals
  ADD CONSTRAINT platform_fee_accruals_invoice_fk
  FOREIGN KEY (invoice_id) REFERENCES platform_invoices(id) ON DELETE SET NULL;

ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS beneficiary VARCHAR(20) NOT NULL DEFAULT 'property';

-- RLS
ALTER TABLE settlement_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_accruals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_access_settlement_accounts ON settlement_accounts
FOR ALL
USING (
  tenant_id IS NULL
  OR tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id IS NULL
  OR tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_fee_schedules ON platform_fee_schedules
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_fee_accruals ON platform_fee_accruals
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_invoices ON platform_invoices
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM tenants hub
    WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
  )
);

CREATE POLICY tenant_access_platform_invoice_lines ON platform_invoice_lines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM platform_invoices pi
    WHERE pi.id = platform_invoice_lines.invoice_id
      AND (
        pi.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM tenants hub
          WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_invoices pi
    WHERE pi.id = platform_invoice_lines.invoice_id
      AND (
        pi.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM tenants hub
          WHERE hub.id::text = current_setting('app.tenant_id', true) AND hub.type = 'hub'
        )
      )
  )
);

-- Seed hub property + Buffr billing profiles (idempotent)
INSERT INTO settlement_accounts (
  tenant_id, party, profile_key, legal_name, bank_name, account_number,
  branch_code, swift_code, account_type, registration_ref
)
SELECT
  t.id,
  'property',
  'hotel_etuna_nedbank',
  'ETUNA GUESTHOUSE AND TOURS CC',
  'Nedbank Namibia',
  '11000481744',
  '461089',
  'NEDSNANX',
  'Current Account',
  NULL
FROM tenants t
WHERE t.type = 'hub'
ON CONFLICT (profile_key) DO NOTHING;

INSERT INTO settlement_accounts (
  tenant_id, party, profile_key, legal_name, bank_name, account_number,
  branch_code, swift_code, account_type, registration_ref
)
VALUES (
  NULL,
  'platform',
  'buffr_bank_windhoek',
  'BUFFR FINANCIAL SERVICES CC',
  'Bank Windhoek',
  '8050377860',
  '485-673',
  'BWLINANX',
  'CHK Account',
  'CC/2024/09322'
)
ON CONFLICT (profile_key) DO NOTHING;

INSERT INTO platform_fee_schedules (tenant_id, card_processing_percent, card_processing_fixed_nad, monthly_subscription_nad)
SELECT t.id, 2.500, 0, COALESCE(t.monthly_price, 0)
FROM tenants t
WHERE t.type = 'hub'
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

-- === 0014_platform_invoice_vat.sql ===
-- VAT fields on Buffr platform invoices (NamRA tax invoice support)

BEGIN;

ALTER TABLE platform_invoices
  ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(30) DEFAULT 'invoice';

ALTER TABLE platform_fee_schedules
  ADD COLUMN IF NOT EXISTS prices_include_vat BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

-- === 0015_rls_inventory_payment_sessions.sql ===
-- RLS for tables added after 0004 bulk tenant_id policies (0011 inventory, 0012 payment_sessions)

BEGIN;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_inventory_items ON public.inventory_items;
CREATE POLICY tenant_access_inventory_items ON public.inventory_items
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_payment_sessions ON public.payment_sessions;
CREATE POLICY tenant_access_payment_sessions ON public.payment_sessions
FOR ALL
USING (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
)
WITH CHECK (
  tenant_id::text = current_setting('app.tenant_id', true)
  OR EXISTS (
    SELECT 1 FROM public.tenants hub_tenant
    WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
      AND hub_tenant.type = 'hub'
  )
);

-- Child tables without tenant_id: scope via inventory_items
ALTER TABLE public.menu_item_inventory_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_menu_item_inventory_links ON public.menu_item_inventory_links;
CREATE POLICY tenant_access_menu_item_inventory_links ON public.menu_item_inventory_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = menu_item_inventory_links.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = menu_item_inventory_links.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_stock_movements ON public.stock_movements;
CREATE POLICY tenant_access_stock_movements ON public.stock_movements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_movements.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_movements.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_stock_alerts ON public.stock_alerts;
CREATE POLICY tenant_access_stock_alerts ON public.stock_alerts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_alerts.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    WHERE ii.id = stock_alerts.inventory_item_id
      AND (
        ii.tenant_id::text = current_setting('app.tenant_id', true)
        OR EXISTS (
          SELECT 1 FROM public.tenants hub_tenant
          WHERE hub_tenant.id::text = current_setting('app.tenant_id', true)
            AND hub_tenant.type = 'hub'
        )
      )
  )
);

COMMIT;

-- === 0016_fraud_detection_rules_seed.sql ===
-- Default fraud detection rules per tenant (idempotent — smoke + PSD-12 baseline)
-- Run after 0000 baseline: psql $DATABASE_URL -v ON_ERROR_STOP=1 -f database/drizzle/0016_fraud_detection_rules_seed.sql

INSERT INTO fraud_detection_rules (
  tenant_id,
  rule_name,
  rule_type,
  description,
  conditions,
  action,
  risk_score_impact,
  is_active,
  priority
)
SELECT
  t.id,
  v.rule_name,
  v.rule_type,
  v.description,
  v.conditions::jsonb,
  v.action,
  v.risk_score_impact,
  true,
  v.priority
FROM tenants t
CROSS JOIN (
  VALUES
    (
      'Payment velocity (1h)',
      'velocity',
      'Flag more than 5 card attempts per guest per hour',
      '{"window_minutes":60,"max_attempts":5}'::jsonb,
      'review',
      15.00,
      1
    ),
    (
      'High amount NAD',
      'amount',
      'Single payment above NAD 50,000 requires review',
      '{"currency":"NAD","max_amount":50000}'::jsonb,
      'block',
      25.00,
      2
    ),
    (
      'Geo mismatch',
      'geo',
      'Billing country differs from property country',
      '{"check":"billing_vs_property_country"}'::jsonb,
      'review',
      10.00,
      3
    )
) AS v(rule_name, rule_type, description, conditions, action, risk_score_impact, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM fraud_detection_rules f WHERE f.tenant_id = t.id
);

-- === 0017_ai_conversations_tenant_session_idx.sql ===
-- Align query pattern: SofiaConciergeService.saveConversation filters by tenant_id + session_id
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant_session
  ON ai_conversations (tenant_id, session_id);

-- === 0018_dining_reservations.sql ===
-- Sofia restaurant table reservations (deposit + booking code + OTP cancel)
CREATE TABLE IF NOT EXISTS "dining_reservations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "guest_id" uuid REFERENCES "guests"("id") ON DELETE SET NULL,
  "session_id" varchar(255),
  "party_size" integer NOT NULL,
  "reservation_date" varchar(10) NOT NULL,
  "reservation_time" varchar(8) NOT NULL,
  "deposit_cents" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'NAD' NOT NULL,
  "payment_session_id" uuid,
  "booking_code" varchar(12) NOT NULL,
  "otp_hash" varchar(64),
  "otp_expires_at" timestamptz,
  "status" varchar(32) DEFAULT 'awaiting_deposit' NOT NULL,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_dining_reservations_tenant_booking_code"
  ON "dining_reservations" ("tenant_id", "booking_code");
CREATE INDEX IF NOT EXISTS "idx_dining_reservations_guest"
  ON "dining_reservations" ("tenant_id", "guest_id");
CREATE INDEX IF NOT EXISTS "idx_dining_reservations_session"
  ON "dining_reservations" ("tenant_id", "session_id");

-- === 0019_dining_adumo_payment_sessions.sql ===
-- Dining reservations: Adumo (Namibia) — link payment_sessions, drop Stripe column
ALTER TABLE payment_sessions
  ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS dining_reservation_id UUID;

CREATE INDEX IF NOT EXISTS idx_payment_sessions_dining_reservation_id
  ON payment_sessions (dining_reservation_id);

ALTER TABLE dining_reservations
  DROP COLUMN IF EXISTS stripe_session_id;

ALTER TABLE dining_reservations
  ADD COLUMN IF NOT EXISTS payment_session_id UUID REFERENCES payment_sessions(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_sessions_dining_reservation_id_fkey'
  ) THEN
    ALTER TABLE payment_sessions
      ADD CONSTRAINT payment_sessions_dining_reservation_id_fkey
      FOREIGN KEY (dining_reservation_id) REFERENCES dining_reservations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- === 0020_namqr_pending_confirmations.sql ===
-- Guest-submitted NamQR bank-app payments awaiting staff approval (Option B)
CREATE TABLE IF NOT EXISTS namqr_pending_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  qr_reference VARCHAR(10),
  amount_claimed NUMERIC(12, 2) NOT NULL,
  bank_reference VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_namqr_pending_tenant_status
  ON namqr_pending_confirmations(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_namqr_pending_booking_status
  ON namqr_pending_confirmations(booking_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_namqr_pending_booking_bank_ref_pending
  ON namqr_pending_confirmations(booking_id, bank_reference)
  WHERE status = 'pending';

-- === 0021_housekeeping_tasks.sql ===
-- Hotel Etuna Housekeeping Task Management
-- Migration: 0021_housekeeping_tasks
-- Purpose: Housekeeping task board, room status tracking, checkout automation

-- Create housekeeping task status enum
CREATE TYPE "public"."housekeeping_task_status" AS ENUM(
  'dirty',
  'cleaning',
  'inspecting',
  'clean'
);
--> statement-breakpoint

-- Create housekeeping task priority enum
CREATE TYPE "public"."housekeeping_task_priority" AS ENUM(
  'low',
  'normal',
  'high',
  'urgent'
);
--> statement-breakpoint

-- Create housekeeping tasks table
CREATE TABLE IF NOT EXISTS "housekeeping_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "room_id" uuid NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "assigned_to" uuid REFERENCES "staff"("id") ON DELETE SET NULL,
  "status" housekeeping_task_status DEFAULT 'dirty' NOT NULL,
  "priority" housekeeping_task_priority DEFAULT 'normal' NOT NULL,
  "task_type" varchar(100) DEFAULT 'checkout_cleaning',
  "notes" text,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "inspection_notes" text,
  "photos" text[] DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL
);
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_property_id" ON "housekeeping_tasks" ("property_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_room_id" ON "housekeeping_tasks" ("room_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_assigned_to" ON "housekeeping_tasks" ("assigned_to");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_status" ON "housekeeping_tasks" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_booking_id" ON "housekeeping_tasks" ("booking_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_created_at" ON "housekeeping_tasks" ("created_at");
--> statement-breakpoint

-- Create RLS policies for housekeeping tasks
ALTER TABLE "housekeeping_tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Policy: Staff can see tasks for their property
CREATE POLICY "housekeeping_tasks_staff_select" ON "housekeeping_tasks"
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT property_id FROM staff WHERE user_id = auth.uid()
    )
  );
--> statement-breakpoint

-- Policy: Staff can update tasks they're assigned to or tasks in their property
CREATE POLICY "housekeeping_tasks_staff_update" ON "housekeeping_tasks"
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (SELECT id FROM staff WHERE user_id = auth.uid())
    OR property_id IN (
      SELECT property_id FROM staff 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin', 'housekeeping_supervisor')
    )
  );
--> statement-breakpoint

-- Policy: Managers and supervisors can insert tasks
CREATE POLICY "housekeeping_tasks_manager_insert" ON "housekeeping_tasks"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT property_id FROM staff 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin', 'housekeeping_supervisor')
    )
  );
--> statement-breakpoint

-- Policy: Managers and supervisors can delete tasks
CREATE POLICY "housekeeping_tasks_manager_delete" ON "housekeeping_tasks"
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT property_id FROM staff 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin', 'housekeeping_supervisor')
    )
  );
--> statement-breakpoint

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_housekeeping_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER trigger_update_housekeeping_tasks_updated_at
  BEFORE UPDATE ON "housekeeping_tasks"
  FOR EACH ROW
  EXECUTE FUNCTION update_housekeeping_tasks_updated_at();
--> statement-breakpoint

-- Create trigger to auto-create housekeeping task on checkout
CREATE OR REPLACE FUNCTION create_housekeeping_task_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking status changes to 'checked_out', create housekeeping tasks
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    -- Create a task for each room in the booking
    INSERT INTO housekeeping_tasks (
      property_id,
      room_id,
      booking_id,
      status,
      priority,
      task_type,
      notes,
      created_by
    )
    SELECT 
      NEW.property_id,
      br.room_id,
      NEW.id,
      'dirty'::housekeeping_task_status,
      CASE 
        WHEN NEW.actual_check_out_date > NEW.check_out_date THEN 'high'::housekeeping_task_priority
        ELSE 'normal'::housekeeping_task_priority
      END,
      'checkout_cleaning',
      'Auto-generated after checkout of booking ' || NEW.booking_reference,
      auth.uid()
    FROM booking_rooms br
    WHERE br.booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
--> statement-breakpoint

CREATE TRIGGER trigger_create_housekeeping_task_on_checkout
  AFTER UPDATE ON "bookings"
  FOR EACH ROW
  WHEN (NEW.status = 'checked_out')
  EXECUTE FUNCTION create_housekeeping_task_on_checkout();
--> statement-breakpoint

-- === 0029_cms_pages_blocks.sql ===
-- Hotel Etuna CMS Pages & Blocks
-- Migration: 0029
-- Created: June 1, 2026
-- Purpose: Add cms_pages and cms_blocks tables for block editor

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  meta_description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL,
  block_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_cms_pages_tenant_id ON cms_pages(tenant_id);
CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON cms_pages(status);
CREATE INDEX idx_cms_blocks_page_id ON cms_blocks(page_id);
CREATE INDEX idx_cms_blocks_order ON cms_blocks(page_id, block_order);

-- Updated_at trigger for cms_pages
CREATE OR REPLACE FUNCTION update_cms_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_pages_updated_at();

-- Updated_at trigger for cms_blocks
CREATE OR REPLACE FUNCTION update_cms_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cms_blocks_updated_at
  BEFORE UPDATE ON cms_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_blocks_updated_at();

-- === 0029b_cms_pages_blocks_rls.sql ===
-- Hotel Etuna CMS Pages & Blocks RLS Policies
-- Migration: 0029b
-- Created: June 1, 2026
-- Purpose: Row-level security for cms_pages and cms_blocks

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blocks ENABLE ROW LEVEL SECURITY;

-- Staff can create, read, update, delete pages in their tenant
CREATE POLICY cms_pages_staff_full_access ON cms_pages
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Public can read published pages
CREATE POLICY cms_pages_public_read ON cms_pages
  FOR SELECT
  USING (status = 'published');

-- Staff can manage blocks for pages they can access
CREATE POLICY cms_blocks_staff_full_access ON cms_blocks
  FOR ALL
  USING (
    page_id IN (
      SELECT id FROM cms_pages WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid
      )
    )
  );

-- Public can read blocks for published pages
CREATE POLICY cms_blocks_public_read ON cms_blocks
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM cms_pages WHERE status = 'published'
    )
  );

-- === 0031_introducer_partners.sql ===
-- Introducer partners: referral codes, commission tracking, public directory
CREATE TABLE IF NOT EXISTS introducers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Partner details
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Commission configuration
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_public_directory BOOLEAN NOT NULL DEFAULT false,
  
  -- Public profile
  bio TEXT,
  website VARCHAR(500),
  logo_url VARCHAR(500),
  
  -- Performance tracking
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_commission_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_introducers_tenant
  ON introducers(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_introducers_code
  ON introducers(code);

CREATE INDEX IF NOT EXISTS idx_introducers_active
  ON introducers(is_active);

CREATE INDEX IF NOT EXISTS idx_introducers_public
  ON introducers(show_in_public_directory);

-- Add introducer tracking to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS introducer_id UUID REFERENCES introducers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_introducer_id
  ON bookings(introducer_id);

-- Trigger to update introducer stats when a booking is created/updated
CREATE OR REPLACE FUNCTION update_introducer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.introducer_id IS NOT NULL THEN
    -- Increment booking count and commission on new booking
    UPDATE introducers
    SET 
      total_bookings = total_bookings + 1,
      total_commission_earned = total_commission_earned + COALESCE(NEW.commission_amount, 0),
      updated_at = NOW()
    WHERE id = NEW.introducer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.introducer_id IS NOT NULL THEN
    -- Update commission if it changed
    IF OLD.commission_amount IS DISTINCT FROM NEW.commission_amount THEN
      UPDATE introducers
      SET 
        total_commission_earned = total_commission_earned - COALESCE(OLD.commission_amount, 0) + COALESCE(NEW.commission_amount, 0),
        updated_at = NOW()
      WHERE id = NEW.introducer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.introducer_id IS NOT NULL THEN
    -- Decrement stats on booking deletion
    UPDATE introducers
    SET 
      total_bookings = GREATEST(0, total_bookings - 1),
      total_commission_earned = GREATEST(0, total_commission_earned - COALESCE(OLD.commission_amount, 0)),
      updated_at = NOW()
    WHERE id = OLD.introducer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_introducer_stats
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_introducer_stats();

-- === 0031b_introducer_partners_rls.sql ===
-- RLS policies for introducer partners

-- Enable RLS on introducers table
ALTER TABLE introducers ENABLE ROW LEVEL SECURITY;

-- Staff can manage introducers within their tenant
CREATE POLICY introducers_tenant_isolation
  ON introducers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Public read for active introducers in directory (for /partners page)
CREATE POLICY introducers_public_directory_read
  ON introducers
  FOR SELECT
  USING (
    is_active = true
    AND show_in_public_directory = true
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

-- Introducers can view their own stats (if they have a user account linked)
-- This is optional and can be extended later if introducers get portal access
CREATE POLICY introducers_self_view
  ON introducers
  FOR SELECT
  USING (
    email = current_setting('app.current_user_email', true)
  );

-- === 0033_loyalty_transactions.sql ===
-- Loyalty transactions ledger: earn/burn events append-only log
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  guest_profile_id UUID REFERENCES guest_profiles(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'burn', 'adjustment', 'tier_bonus')),
  points_delta INTEGER NOT NULL,  -- positive for earn, negative for burn
  
  -- Balance tracking
  points_before INTEGER NOT NULL DEFAULT 0,
  points_after INTEGER NOT NULL,
  
  -- Context
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reward_id UUID,  -- references loyalty_rewards (created in next migration)
  description TEXT NOT NULL,
  
  -- Metadata
  staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_tenant_guest
  ON loyalty_transactions(tenant_id, guest_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_guest_created
  ON loyalty_transactions(guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_type_created
  ON loyalty_transactions(transaction_type, created_at DESC);

-- Loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Reward details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  value_nad NUMERIC(12, 2),  -- equivalent value in NAD
  
  -- Availability
  available BOOLEAN NOT NULL DEFAULT true,
  max_redemptions_per_guest INTEGER,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  -- Tier restrictions (null = available to all)
  min_tier VARCHAR(50) CHECK (min_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_tenant_available
  ON loyalty_rewards(tenant_id, available);

-- Track redemptions
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES loyalty_transactions(id) ON DELETE CASCADE,
  
  -- Redemption details
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  
  -- Fulfillment
  fulfilled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_guest
  ON loyalty_redemptions(guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status
  ON loyalty_redemptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_tenant
  ON loyalty_redemptions(tenant_id, created_at DESC);

-- === 0033b_loyalty_transactions_rls.sql ===
-- RLS policies for loyalty system

-- Enable RLS on loyalty tables
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- loyalty_transactions policies
CREATE POLICY loyalty_transactions_tenant_isolation
  ON loyalty_transactions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Guests can view their own transactions
CREATE POLICY loyalty_transactions_guest_view
  ON loyalty_transactions
  FOR SELECT
  USING (
    guest_id IN (
      SELECT g.id FROM guests g
      WHERE g.email = current_setting('app.current_user_email', true)
        AND g.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- loyalty_rewards policies
CREATE POLICY loyalty_rewards_tenant_isolation
  ON loyalty_rewards
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Rewards are publicly readable within tenant (for catalog display)
CREATE POLICY loyalty_rewards_public_read
  ON loyalty_rewards
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- loyalty_redemptions policies
CREATE POLICY loyalty_redemptions_tenant_isolation
  ON loyalty_redemptions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Guests can view their own redemptions
CREATE POLICY loyalty_redemptions_guest_view
  ON loyalty_redemptions
  FOR SELECT
  USING (
    guest_id IN (
      SELECT g.id FROM guests g
      WHERE g.email = current_setting('app.current_user_email', true)
        AND g.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- === 0035_loyalty_tiers.sql ===
-- Loyalty tier definitions and thresholds
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tier details
  tier_name VARCHAR(50) NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_order INTEGER NOT NULL,  -- 1=bronze, 2=silver, 3=gold, 4=platinum
  
  -- Thresholds
  points_threshold INTEGER NOT NULL DEFAULT 0,  -- minimum points to reach this tier
  
  -- Benefits summary
  earn_rate_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,  -- e.g. 1.25 = 25% bonus
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, tier_name),
  UNIQUE(tenant_id, tier_order)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_tenant
  ON loyalty_tiers(tenant_id, tier_order);

-- Seed default tier thresholds for all tenants (hub-only feature will be enforced at application layer)
-- Note: Will seed for all tenants, but loyalty features are hub-exclusive per business rules
DO $$
DECLARE
  tenant_rec RECORD;
BEGIN
  FOR tenant_rec IN SELECT id FROM tenants LOOP
    -- Bronze tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'bronze',
      1,
      0,
      1.00,
      'Entry level - Earn 1 point per N$10 spent'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Silver tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'silver',
      2,
      500,
      1.10,
      'Silver tier - Earn 10% bonus points + priority support'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Gold tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'gold',
      3,
      1500,
      1.25,
      'Gold tier - Earn 25% bonus points + room upgrades + late checkout'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
    
    -- Platinum tier
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    VALUES (
      tenant_rec.id,
      'platinum',
      4,
      5000,
      1.50,
      'Platinum tier - Earn 50% bonus points + complimentary breakfast + suite upgrades'
    )
    ON CONFLICT (tenant_id, tier_name) DO NOTHING;
  END LOOP;
END $$;

-- === 0036_loyalty_tier_benefits.sql ===
-- Loyalty tier-specific benefits/perks
CREATE TABLE IF NOT EXISTS loyalty_tier_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  
  -- Benefit details
  benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN (
    'points_multiplier',
    'room_upgrade',
    'late_checkout',
    'early_checkin',
    'complimentary_breakfast',
    'priority_support',
    'free_wifi_upgrade',
    'minibar_credit',
    'spa_discount',
    'restaurant_discount',
    'birthday_reward',
    'anniversary_reward'
  )),
  
  benefit_name VARCHAR(255) NOT NULL,
  benefit_description TEXT,
  benefit_value VARCHAR(100),  -- e.g. "25%", "1 hour", "complimentary"
  
  -- Activation
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tier
  ON loyalty_tier_benefits(tier_id, active);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tenant
  ON loyalty_tier_benefits(tenant_id, tier_id);

-- Seed default benefits for each tier
-- Bronze tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  'points_multiplier',
  'Base Points Earning',
  'Earn 1 point for every N$10 spent on room and dining',
  '1.0x'
FROM loyalty_tiers lt
WHERE lt.tier_name = 'bronze'
ON CONFLICT DO NOTHING;

-- Silver tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Bonus Points Earning', 'Earn 10% bonus points on all stays', '1.1x'),
  ('priority_support', 'Priority Support', 'Priority response for booking inquiries and requests', 'enabled'),
  ('late_checkout', 'Late Checkout', 'Late checkout subject to availability', '12:00 PM')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'silver'
ON CONFLICT DO NOTHING;

-- Gold tier benefits
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Enhanced Points Earning', 'Earn 25% bonus points on all stays', '1.25x'),
  ('room_upgrade', 'Room Upgrade', 'Complimentary room upgrade subject to availability', 'one_category'),
  ('late_checkout', 'Extended Late Checkout', 'Late checkout until 2:00 PM subject to availability', '2:00 PM'),
  ('early_checkin', 'Early Check-in', 'Early check-in from 12:00 PM subject to availability', '12:00 PM'),
  ('priority_support', 'Premium Support', 'Dedicated support line and priority service', 'enabled'),
  ('restaurant_discount', 'Dining Discount', '10% discount on restaurant dining', '10%')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'gold'
ON CONFLICT DO NOTHING;

-- Platinum tier benefits  
INSERT INTO loyalty_tier_benefits (tenant_id, tier_id, benefit_type, benefit_name, benefit_description, benefit_value)
SELECT 
  lt.tenant_id,
  lt.id,
  benefit_type,
  benefit_name,
  benefit_description,
  benefit_value
FROM loyalty_tiers lt
CROSS JOIN (VALUES
  ('points_multiplier', 'Premium Points Earning', 'Earn 50% bonus points on all stays', '1.5x'),
  ('room_upgrade', 'Suite Upgrade', 'Complimentary suite upgrade subject to availability', 'suite'),
  ('complimentary_breakfast', 'Complimentary Breakfast', 'Free breakfast for two daily', 'two_guests'),
  ('late_checkout', 'Guaranteed Late Checkout', 'Guaranteed late checkout until 3:00 PM', '3:00 PM'),
  ('early_checkin', 'Guaranteed Early Check-in', 'Guaranteed early check-in from 11:00 AM', '11:00 AM'),
  ('priority_support', 'Concierge Service', 'Personal concierge and 24/7 priority assistance', 'enabled'),
  ('restaurant_discount', 'VIP Dining Discount', '15% discount on restaurant dining', '15%'),
  ('minibar_credit', 'Minibar Credit', 'N$200 minibar credit per stay', 'N$200'),
  ('birthday_reward', 'Birthday Bonus', 'Special birthday gift and bonus points', '500_points'),
  ('anniversary_reward', 'Anniversary Bonus', 'Anniversary stay bonus and upgrade', '1000_points')
) AS benefits(benefit_type, benefit_name, benefit_description, benefit_value)
WHERE lt.tier_name = 'platinum'
ON CONFLICT DO NOTHING;

-- === 0037_loyalty_auto_tier_up.sql ===
-- Auto tier-up function and trigger

-- Function to check and update guest tier based on current points
CREATE OR REPLACE FUNCTION check_and_update_guest_tier()
RETURNS TRIGGER AS $$
DECLARE
  current_points INTEGER;
  new_tier_name VARCHAR(50);
  new_tier_order INTEGER;
BEGIN
  -- Get the guest's current total points from guest_profiles
  SELECT loyalty_points INTO current_points
  FROM guest_profiles
  WHERE id = NEW.guest_profile_id
    AND tenant_id = NEW.tenant_id;
  
  -- Find the highest tier the guest qualifies for
  SELECT lt.tier_name, lt.tier_order
  INTO new_tier_name, new_tier_order
  FROM loyalty_tiers lt
  WHERE lt.tenant_id = NEW.tenant_id
    AND lt.points_threshold <= current_points
  ORDER BY lt.tier_order DESC
  LIMIT 1;
  
  -- Update guest profile if tier changed
  IF new_tier_name IS NOT NULL THEN
    UPDATE guest_profiles
    SET loyalty_tier = new_tier_name,
        updated_at = NOW()
    WHERE id = NEW.guest_profile_id
      AND tenant_id = NEW.tenant_id
      AND loyalty_tier != new_tier_name;
    
    -- Log tier promotion if it happened
    IF FOUND THEN
      RAISE NOTICE 'Guest % promoted to % tier', NEW.guest_id, new_tier_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on loyalty_transactions to auto-upgrade tier after points change
CREATE TRIGGER trigger_auto_tier_up
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type IN ('earn', 'adjustment'))
  EXECUTE FUNCTION check_and_update_guest_tier();

-- Helper function to calculate tier eligibility (for UI/API use)
CREATE OR REPLACE FUNCTION get_guest_tier_info(
  p_tenant_id UUID,
  p_guest_profile_id UUID
)
RETURNS TABLE (
  current_tier VARCHAR(50),
  current_points INTEGER,
  next_tier VARCHAR(50),
  points_to_next_tier INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH guest_info AS (
    SELECT loyalty_tier, loyalty_points
    FROM guest_profiles
    WHERE id = p_guest_profile_id
      AND tenant_id = p_tenant_id
  ),
  current_tier_info AS (
    SELECT tier_name, tier_order, points_threshold
    FROM loyalty_tiers
    WHERE tenant_id = p_tenant_id
      AND tier_name = (SELECT loyalty_tier FROM guest_info)
  ),
  next_tier_info AS (
    SELECT tier_name, points_threshold
    FROM loyalty_tiers
    WHERE tenant_id = p_tenant_id
      AND tier_order = (SELECT tier_order + 1 FROM current_tier_info)
  )
  SELECT
    gi.loyalty_tier,
    gi.loyalty_points,
    nti.tier_name,
    GREATEST(0, COALESCE(nti.points_threshold, 0) - gi.loyalty_points)
  FROM guest_info gi
  CROSS JOIN current_tier_info cti
  LEFT JOIN next_tier_info nti ON true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on loyalty_tiers and loyalty_tier_benefits
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tier_benefits ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY loyalty_tiers_tenant_isolation
  ON loyalty_tiers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY loyalty_tier_benefits_tenant_isolation
  ON loyalty_tier_benefits
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- === 0038_user_notification_preferences.sql ===
-- User notification preferences (weekly partner report, digest opt-in)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

-- === 0039_hotel_etuna_room_types.sql ===
-- Canonical Hotel Etuna room types: Standard (A/B/C), Executive Room, Premiere Room
-- Maps legacy seed rows ET-101 … ET-501 by room_number; safe to re-run (idempotent labels).

UPDATE rooms
SET
  room_type = 'Standard Room (Type A)',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'],
  updated_at = NOW()
WHERE room_number = 'ET-101'
   OR room_type IN ('Standard Room', 'Standard Room — Type A', 'Standard Room - Type A');

UPDATE rooms
SET
  room_type = 'Standard Room (Type B)',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'],
  updated_at = NOW()
WHERE room_number = 'ET-201'
   OR room_type IN ('Luxury Room', 'Standard Room (Type B)', 'Standard Room — Type B');

UPDATE rooms
SET
  room_type = 'Standard Room (Type C)',
  max_occupancy = 3,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed', 'Single bed'],
  updated_at = NOW()
WHERE room_number = 'ET-301'
   OR room_type IN ('Family Room', 'Standard Room (Type C)', 'Standard Room — Type C');

UPDATE rooms
SET
  room_type = 'Executive Room',
  max_occupancy = 2,
  amenities = ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Work Desk', 'VIP Toiletries', 'Lounge Access'],
  updated_at = NOW()
WHERE room_number = 'ET-401'
   OR room_type IN ('Executive Suite', 'Executive Room');

UPDATE rooms
SET
  room_type = 'Premiere Room',
  max_occupancy = 4,
  amenities = ARRAY[
    'WiFi', 'Aircon', 'TV', 'Mini fridge', 'Minibar', 'Coffee/Tea', 'Mosquito Net',
    'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'
  ],
  updated_at = NOW()
WHERE room_number = 'ET-501'
   OR room_type IN ('Premier Room', 'Premiere Room', 'Premiere Room');

-- Align guest preference labels where legacy names were stored
UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type A)', updated_at = NOW()
WHERE preferred_room_type = 'Standard Room';

UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type B)', updated_at = NOW()
WHERE preferred_room_type = 'Luxury Room';

UPDATE guest_profiles
SET preferred_room_type = 'Standard Room (Type C)', updated_at = NOW()
WHERE preferred_room_type = 'Family Room';

UPDATE guest_profiles
SET preferred_room_type = 'Executive Room', updated_at = NOW()
WHERE preferred_room_type IN ('Executive Suite', 'Executive Room');

UPDATE guest_profiles
SET preferred_room_type = 'Premiere Room', updated_at = NOW()
WHERE preferred_room_type IN ('Premier Room', 'Premiere Room');

-- === 0040_hotel_etuna_room_inventory.sql ===
-- 0040: Hotel Etuna 35 guest rooms (generated from inventory module)

UPDATE rooms r SET status = 'out_of_order', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id AND p.slug = 'hotel-etuna' AND r.room_number LIKE 'ET-%';

INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '5', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '6', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '8', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '17', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '19', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '21', 'Standard Room (Type A)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '7', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '9', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '10', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '11', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '12', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '13', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '14', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '15', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '16', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '18', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '20', 'Standard Room (Type B)', 2, 800.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Two single beds'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '2', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '3', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '4', 'Standard Room (Type C)', 3, 1200.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Double bed and single bed'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, '22', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E1', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E2', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E3', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E4', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E5', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E6', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E8', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E9', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E10', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E11', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E12', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E13', 'Executive Room', 2, 1000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Executive layout', 'Work Desk', 'VIP Toiletries', 'Lounge Access'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E7', 'Premiere Room', 4, 2000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Premiere layout', 'Mini fridge', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();
INSERT INTO rooms (property_id, room_number, room_type, max_occupancy, base_rate, currency, amenities, status)
SELECT p.id, 'E14', 'Premiere Room', 4, 2000.00, 'NAD', ARRAY['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk', 'Premiere layout', 'Mini fridge', 'Private Balcony', 'Lounge', '2 Bathrooms', 'Bathrobe'], 'available'
FROM properties p WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  status = 'available',
  updated_at = NOW();

-- === 0041_rooms_inventory_kind.sql ===
-- 0041: inventory_kind + pricing_metadata on rooms; facility rows

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS inventory_kind varchar(32) NOT NULL DEFAULT 'guest_room';

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS pricing_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN rooms.inventory_kind IS 'guest_room | conference | campsite';
COMMENT ON COLUMN rooms.pricing_metadata IS 'Session windows, per-person campsite rates, etc.';

UPDATE rooms r
SET inventory_kind = 'guest_room', pricing_metadata = '{}'::jsonb
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.room_number NOT IN ('CONFERENCE-HALL', 'CAMPSITE');

INSERT INTO rooms (
  property_id,
  room_number,
  room_type,
  max_occupancy,
  base_rate,
  currency,
  amenities,
  status,
  inventory_kind,
  pricing_metadata
)
SELECT
  p.id,
  'CONFERENCE-HALL',
  'Conference Hall / Facilities',
  200,
  1200.00,
  'NAD',
  ARRAY['Projector', 'Sound System', 'WiFi', 'Catering space', 'Parking'],
  'available',
  'conference',
  '{"sessionStart":"08:00","sessionEnd":"17:00","pricePerSession":1200,"currency":"NAD"}'::jsonb
FROM properties p
WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  inventory_kind = 'conference',
  pricing_metadata = EXCLUDED.pricing_metadata,
  status = 'available',
  updated_at = NOW();

INSERT INTO rooms (
  property_id,
  room_number,
  room_type,
  max_occupancy,
  base_rate,
  currency,
  amenities,
  status,
  inventory_kind,
  pricing_metadata
)
SELECT
  p.id,
  'CAMPSITE',
  'Campsite',
  50,
  1200.00,
  'NAD',
  ARRAY['Whole-site hire', 'Braai area', 'Ablutions', 'Parking'],
  'available',
  'campsite',
  '{"namibianPp":250,"nonNamibianPp":400,"siteMinimum":1200,"prorateFromMinimum":true,"currency":"NAD"}'::jsonb
FROM properties p
WHERE p.slug = 'hotel-etuna'
ON CONFLICT (property_id, room_number) DO UPDATE SET
  room_type = EXCLUDED.room_type,
  max_occupancy = EXCLUDED.max_occupancy,
  base_rate = EXCLUDED.base_rate,
  amenities = EXCLUDED.amenities,
  inventory_kind = 'campsite',
  pricing_metadata = EXCLUDED.pricing_metadata,
  status = 'available',
  updated_at = NOW();

-- === 0042_bookings_service_kind.sql ===
-- 0042: booking_kind + pricing_details for accommodation, conference, campsite

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_kind varchar(32) DEFAULT 'accommodation';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pricing_details jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN bookings.booking_kind IS 'accommodation | conference | campsite';
COMMENT ON COLUMN bookings.pricing_details IS 'Campsite guest counts, conference sessionDate, audit fields';

UPDATE bookings
SET booking_kind = 'accommodation'
WHERE booking_kind IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_kind ON bookings (booking_kind);
CREATE INDEX IF NOT EXISTS idx_rooms_inventory_kind ON rooms (inventory_kind);

-- === 0043_facility_internal_keys.sql ===
-- Facilities are singular; room_number is internal DB key only.

UPDATE rooms r
SET room_number = 'facility:conference', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.inventory_kind = 'conference'
  AND r.room_number <> 'facility:conference';

UPDATE rooms r
SET room_number = 'facility:campsite', updated_at = NOW()
FROM properties p
WHERE r.property_id = p.id
  AND p.slug = 'hotel-etuna'
  AND r.inventory_kind = 'campsite'
  AND r.room_number <> 'facility:campsite';

COMMIT;
