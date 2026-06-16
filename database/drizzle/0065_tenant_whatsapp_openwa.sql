-- Dual WhatsApp provider: Meta Cloud API + OpenWA (per-tenant rows)
ALTER TABLE tenant_whatsapp_settings
  ADD COLUMN IF NOT EXISTS provider varchar(16) NOT NULL DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS openwa_session_id varchar(128),
  ADD COLUMN IF NOT EXISTS openwa_webhook_secret text,
  ADD COLUMN IF NOT EXISTS openwa_api_base_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE tenant_whatsapp_settings
  ALTER COLUMN phone_number_id DROP NOT NULL;

ALTER TABLE tenant_whatsapp_settings
  DROP CONSTRAINT IF EXISTS tenant_whatsapp_settings_phone_number_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_whatsapp_meta_phone_number_id
  ON tenant_whatsapp_settings (phone_number_id)
  WHERE provider = 'meta' AND phone_number_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_whatsapp_openwa_session_id
  ON tenant_whatsapp_settings (openwa_session_id)
  WHERE provider = 'openwa' AND openwa_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_whatsapp_tenant_provider_active
  ON tenant_whatsapp_settings (tenant_id, provider)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_provider
  ON tenant_whatsapp_settings (provider);
