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
