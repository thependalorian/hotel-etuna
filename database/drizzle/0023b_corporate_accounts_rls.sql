/**
 * Migration: Row-Level Security for Corporate Accounts
 * Version: 0023b
 * Agent: A7
 * Purpose: Restrict corporate account access to authorized CRM staff only
 * 
 * Policies:
 * - corporate_accounts: SELECT/INSERT/UPDATE/DELETE for staff, manager, owner roles only
 * - corporate_contacts: SELECT/INSERT/UPDATE/DELETE for staff, manager, owner roles only
 * - Tenant isolation: All queries filtered by tenant_id matching user's tenant
 */

-- Enable RLS on corporate tables
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_contacts ENABLE ROW LEVEL SECURITY;

-- Corporate Accounts Policies

-- SELECT: Staff, manager, owner can view accounts in their tenant
CREATE POLICY corporate_accounts_staff_select ON corporate_accounts
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('staff', 'manager', 'owner')
    )
  );

-- INSERT: Staff, manager, owner can create accounts in their tenant
CREATE POLICY corporate_accounts_staff_insert ON corporate_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('staff', 'manager', 'owner')
    )
  );

-- UPDATE: Staff, manager, owner can update accounts in their tenant
CREATE POLICY corporate_accounts_staff_update ON corporate_accounts
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('staff', 'manager', 'owner')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('staff', 'manager', 'owner')
    )
  );

-- DELETE: Manager, owner only (soft delete via updated_at preferred)
CREATE POLICY corporate_accounts_manager_delete ON corporate_accounts
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'owner')
    )
  );

-- Corporate Contacts Policies

-- SELECT: Staff, manager, owner can view contacts for accounts in their tenant
CREATE POLICY corporate_contacts_staff_select ON corporate_contacts
  FOR SELECT TO authenticated
  USING (
    corporate_account_id IN (
      SELECT id FROM corporate_accounts
      WHERE tenant_id IN (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND role IN ('staff', 'manager', 'owner')
      )
    )
  );

-- INSERT: Staff, manager, owner can create contacts for accounts in their tenant
CREATE POLICY corporate_contacts_staff_insert ON corporate_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    corporate_account_id IN (
      SELECT id FROM corporate_accounts
      WHERE tenant_id IN (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND role IN ('staff', 'manager', 'owner')
      )
    )
  );

-- UPDATE: Staff, manager, owner can update contacts for accounts in their tenant
CREATE POLICY corporate_contacts_staff_update ON corporate_contacts
  FOR UPDATE TO authenticated
  USING (
    corporate_account_id IN (
      SELECT id FROM corporate_accounts
      WHERE tenant_id IN (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND role IN ('staff', 'manager', 'owner')
      )
    )
  )
  WITH CHECK (
    corporate_account_id IN (
      SELECT id FROM corporate_accounts
      WHERE tenant_id IN (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND role IN ('staff', 'manager', 'owner')
      )
    )
  );

-- DELETE: Manager, owner only
CREATE POLICY corporate_contacts_manager_delete ON corporate_contacts
  FOR DELETE TO authenticated
  USING (
    corporate_account_id IN (
      SELECT id FROM corporate_accounts
      WHERE tenant_id IN (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND role IN ('manager', 'owner')
      )
    )
  );
