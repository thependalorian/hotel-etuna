/**
 * Resolve Buffr tenant from Meta WhatsApp phone_number_id.
 *
 * Purpose: Multi-tenant routing for /api/webhooks/whatsapp.
 * Location: /lib/services/whatsapp/tenantWhatsappLookup.ts
 */

import { db } from '@/lib/db';
import { tenantWhatsappSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type TenantWhatsappRouting = {
  tenantId: string;
  phoneNumberId: string;
  defaultPropertyId: string | null;
  accessToken: string | null;
};

export async function getTenantWhatsappByPhoneNumberId(
  phoneNumberId: string
): Promise<TenantWhatsappRouting | null> {
  const [row] = await db
    .select({
      tenantId: tenantWhatsappSettings.tenantId,
      phoneNumberId: tenantWhatsappSettings.phoneNumberId,
      defaultPropertyId: tenantWhatsappSettings.defaultPropertyId,
      accessToken: tenantWhatsappSettings.accessToken,
    })
    .from(tenantWhatsappSettings)
    .where(eq(tenantWhatsappSettings.phoneNumberId, phoneNumberId))
    .limit(1);

  if (!row) return null;
  return {
    tenantId: row.tenantId,
    phoneNumberId: row.phoneNumberId,
    defaultPropertyId: row.defaultPropertyId,
    accessToken: row.accessToken,
  };
}
