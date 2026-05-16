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
