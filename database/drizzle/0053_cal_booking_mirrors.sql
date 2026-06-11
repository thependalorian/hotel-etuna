-- 0053: Cal.com booking mirrors (webhook idempotency store)
-- Purpose: Persist Cal.com webhook payloads for Hotel Etuna scheduling integration

CREATE TABLE IF NOT EXISTS cal_booking_mirrors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cal_uid VARCHAR(255) NOT NULL UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  webhook_received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_booking_mirrors_property ON cal_booking_mirrors(property_id);
CREATE INDEX IF NOT EXISTS idx_cal_booking_mirrors_booking ON cal_booking_mirrors(booking_id);
CREATE INDEX IF NOT EXISTS idx_cal_booking_mirrors_status ON cal_booking_mirrors(status);
