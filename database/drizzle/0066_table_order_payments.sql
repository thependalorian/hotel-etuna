-- Table ordering (QR dine-in): payment method/status + who-placed-it tracking + order total.
-- Supports Adumo online, add-to-bill, cash, and swipe; orders are placed by a logged-in
-- account (registered user or hotel guest) and dispatched to F&B + front desk.
-- Forward-idempotent: ADD COLUMN IF NOT EXISTS only.

ALTER TABLE restaurant_orders
  ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'add_to_bill',  -- adumo | add_to_bill | cash | swipe
  ADD COLUMN IF NOT EXISTS payment_status varchar(20) DEFAULT 'unpaid',       -- unpaid | pending | paid
  ADD COLUMN IF NOT EXISTS placed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name varchar(255),
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'NAD';

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_placed_by ON restaurant_orders (placed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_payment_status ON restaurant_orders (payment_status);
