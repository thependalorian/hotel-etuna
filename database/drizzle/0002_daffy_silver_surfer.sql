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