/**
 * Migration: Corporate Accounts for Hotel Etuna
 * Version: 0023
 * Agent: A7
 * Purpose: Add corporate billing capability - accounts, contacts, and booking linkage
 * 
 * Tables:
 * - corporate_accounts: Companies that book rooms and receive consolidated AR invoices
 * - corporate_contacts: Authorized contacts at corporate accounts (can book, approve invoices)
 * 
 * Extensions to bookings:
 * - corporate_account_id: Link booking to corporate account
 * - billing_party: 'guest' (default) or 'corporate'
 * - booker_guest_id: Who made the booking (may differ from guest staying)
 * - corporate_folio_blocked: Whether folio charges have been transferred to AR
 * - corporate_invoice_id: Link to monthly AR invoice (when generated)
 */

-- Corporate Accounts Table
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  vat_number VARCHAR(50),
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(3) DEFAULT 'NAM',
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  current_balance DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  email VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Corporate Contacts Table
CREATE TABLE IF NOT EXISTS corporate_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  can_authorize_bookings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add corporate billing columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS corporate_account_id UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_party VARCHAR(50) DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS booker_guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corporate_folio_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS corporate_invoice_id UUID;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_tenant_id ON corporate_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON corporate_accounts(status);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_company_name ON corporate_accounts(company_name);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_deleted_at ON corporate_accounts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_corporate_contacts_account_id ON corporate_contacts(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corporate_contacts_email ON corporate_contacts(email);
CREATE INDEX IF NOT EXISTS idx_corporate_contacts_deleted_at ON corporate_contacts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_bookings_corporate_account_id ON bookings(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_bookings_billing_party ON bookings(billing_party);
CREATE INDEX IF NOT EXISTS idx_bookings_corporate_invoice_id ON bookings(corporate_invoice_id);

-- Constraints
ALTER TABLE corporate_contacts
  ADD CONSTRAINT unique_primary_contact_per_account
  UNIQUE (corporate_account_id, is_primary) 
  DEFERRABLE INITIALLY DEFERRED;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_corporate_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER corporate_accounts_updated_at_trigger
BEFORE UPDATE ON corporate_accounts
FOR EACH ROW
EXECUTE FUNCTION update_corporate_accounts_updated_at();

CREATE TRIGGER corporate_contacts_updated_at_trigger
BEFORE UPDATE ON corporate_contacts
FOR EACH ROW
EXECUTE FUNCTION update_corporate_accounts_updated_at();
