/**
 * Resolve tenant WhatsApp routing for the Meta Cloud API provider.
 *
 * Purpose: Multi-tenant routing for WhatsApp webhooks.
 * Location: /lib/services/whatsapp/tenantWhatsappLookup.ts
 */

import { db } from '@/lib/db';
import { tenantWhatsappSettings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export type WhatsappProvider = 'meta';

export type TenantWhatsappRouting = {
  tenantId: string;
  provider: WhatsappProvider;
  phoneNumberId: string | null;
  defaultPropertyId: string | null;
  accessToken: string | null;
};

function mapRow(row: {
  tenantId: string;
  provider: string | null;
  phoneNumberId: string | null;
  defaultPropertyId: string | null;
  accessToken: string | null;
}): TenantWhatsappRouting {
  return {
    tenantId: row.tenantId,
    provider: 'meta',
    phoneNumberId: row.phoneNumberId,
    defaultPropertyId: row.defaultPropertyId,
    accessToken: row.accessToken,
  };
}

export async function getTenantWhatsappByPhoneNumberId(
  phoneNumberId: string
): Promise<TenantWhatsappRouting | null> {
  const [row] = await db
    .select({
      tenantId: tenantWhatsappSettings.tenantId,
      provider: tenantWhatsappSettings.provider,
      phoneNumberId: tenantWhatsappSettings.phoneNumberId,
      defaultPropertyId: tenantWhatsappSettings.defaultPropertyId,
      accessToken: tenantWhatsappSettings.accessToken,
    })
    .from(tenantWhatsappSettings)
    .where(
      and(
        eq(tenantWhatsappSettings.phoneNumberId, phoneNumberId),
        eq(tenantWhatsappSettings.provider, 'meta'),
        eq(tenantWhatsappSettings.isActive, true)
      )
    )
    .limit(1);

  if (!row) return null;
  return mapRow(row);
}

/** Active WhatsApp provider row for a tenant (Meta Cloud API). */
export async function getActiveWhatsappProviderForTenant(
  tenantId: string,
  preferred?: WhatsappProvider
): Promise<TenantWhatsappRouting | null> {
  void preferred;
  const rows = await db
    .select({
      tenantId: tenantWhatsappSettings.tenantId,
      provider: tenantWhatsappSettings.provider,
      phoneNumberId: tenantWhatsappSettings.phoneNumberId,
      defaultPropertyId: tenantWhatsappSettings.defaultPropertyId,
      accessToken: tenantWhatsappSettings.accessToken,
    })
    .from(tenantWhatsappSettings)
    .where(
      and(
        eq(tenantWhatsappSettings.tenantId, tenantId),
        eq(tenantWhatsappSettings.provider, 'meta'),
        eq(tenantWhatsappSettings.isActive, true)
      )
    );

  const meta = rows.find((r) => r.provider === 'meta');
  return meta ? mapRow(meta) : null;
}
