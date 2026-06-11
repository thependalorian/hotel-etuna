-- F&B print dispatch jobs (kitchen ticket board)
-- Aligns with lib/db/schema.ts fnbPrintJobs

DO $$ BEGIN
  CREATE TYPE print_job_status AS ENUM ('pending', 'printing', 'printed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE print_station_type AS ENUM ('kitchen', 'bar', 'pastry', 'front_desk', 'back_office');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS fnb_print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  order_id uuid REFERENCES restaurant_orders(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  station print_station_type NOT NULL,
  status print_job_status NOT NULL DEFAULT 'pending',
  printer_id varchar(100),
  ticket_type varchar(50) NOT NULL DEFAULT 'order_ticket',
  ticket_data jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  printed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_property_id ON fnb_print_jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_order_id ON fnb_print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_station ON fnb_print_jobs(station);
CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_status ON fnb_print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_created_at ON fnb_print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_fnb_print_jobs_station_status ON fnb_print_jobs(station, status);
