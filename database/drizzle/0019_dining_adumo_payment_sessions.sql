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
