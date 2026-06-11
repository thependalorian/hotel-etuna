-- Booking deposit percent column (TASK #17)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC(5,2) DEFAULT 30;

COMMENT ON COLUMN bookings.deposit_percent IS 'Percentage of total_amount required as deposit at checkout (default 30)';
