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
