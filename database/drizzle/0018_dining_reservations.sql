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
