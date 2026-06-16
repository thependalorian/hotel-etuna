/**
 * Resolve tenant WhatsApp routing for Meta and OpenWA providers.
 *
 * Purpose: Multi-tenant routing for WhatsApp webhooks.
 * Location: /lib/services/whatsapp/tenantWhatsappLookup.ts
 */

import { db } from '@/lib/db';
import { tenantWhatsappSettings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export type WhatsappProvider = 'meta' | 'openwa';

export type TenantWhatsappRouting = {
  tenantId: string;
  provider: WhatsappProvider;
  phoneNumberId: string | null;
  openwaSessionId: string | null;
  openwaWebhookSecret: string | null;
  openwaApiBaseUrl: string | null;
  defaultPropertyId: string | null;
  accessToken: string | null;
};

function mapRow(row: {
  tenantId: string;
  provider: string | null;
  phoneNumberId: string | null;
  openwaSessionId: string | null;
  openwaWebhookSecret: string | null;
  openwaApiBaseUrl: string | null;
  defaultPropertyId: string | null;
  accessToken: string | null;
}): TenantWhatsappRouting {
  return {
    tenantId: row.tenantId,
    provider: (row.provider === 'openwa' ? 'openwa' : 'meta') as WhatsappProvider,
    phoneNumberId: row.phoneNumberId,
    openwaSessionId: row.openwaSessionId,
    openwaWebhookSecret: row.openwaWebhookSecret,
    openwaApiBaseUrl: row.openwaApiBaseUrl,
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
      openwaSessionId: tenantWhatsappSettings.openwaSessionId,
      openwaWebhookSecret: tenantWhatsappSettings.openwaWebhookSecret,
      openwaApiBaseUrl: tenantWhatsappSettings.openwaApiBaseUrl,
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

export async function getTenantWhatsappByOpenwaSessionId(
  sessionId: string
): Promise<TenantWhatsappRouting | null> {
  const [row] = await db
    .select({
      tenantId: tenantWhatsappSettings.tenantId,
      provider: tenantWhatsappSettings.provider,
      phoneNumberId: tenantWhatsappSettings.phoneNumberId,
      openwaSessionId: tenantWhatsappSettings.openwaSessionId,
      openwaWebhookSecret: tenantWhatsappSettings.openwaWebhookSecret,
      openwaApiBaseUrl: tenantWhatsappSettings.openwaApiBaseUrl,
      defaultPropertyId: tenantWhatsappSettings.defaultPropertyId,
      accessToken: tenantWhatsappSettings.accessToken,
    })
    .from(tenantWhatsappSettings)
    .where(
      and(
        eq(tenantWhatsappSettings.openwaSessionId, sessionId),
        eq(tenantWhatsappSettings.provider, 'openwa'),
        eq(tenantWhatsappSettings.isActive, true)
      )
    )
    .limit(1);

  if (!row) return null;
  return mapRow(row);
}

/** Active WhatsApp provider row for a tenant (prefers OpenWA when both exist). */
export async function getActiveWhatsappProviderForTenant(
  tenantId: string,
  preferred?: WhatsappProvider
): Promise<TenantWhatsappRouting | null> {
  const rows = await db
    .select({
      tenantId: tenantWhatsappSettings.tenantId,
      provider: tenantWhatsappSettings.provider,
      phoneNumberId: tenantWhatsappSettings.phoneNumberId,
      openwaSessionId: tenantWhatsappSettings.openwaSessionId,
      openwaWebhookSecret: tenantWhatsappSettings.openwaWebhookSecret,
      openwaApiBaseUrl: tenantWhatsappSettings.openwaApiBaseUrl,
      defaultPropertyId: tenantWhatsappSettings.defaultPropertyId,
      accessToken: tenantWhatsappSettings.accessToken,
    })
    .from(tenantWhatsappSettings)
    .where(
      and(eq(tenantWhatsappSettings.tenantId, tenantId), eq(tenantWhatsappSettings.isActive, true))
    );

  if (rows.length === 0) return null;

  if (preferred) {
    const match = rows.find((r) => r.provider === preferred);
    if (match) return mapRow(match);
  }

  const openwa = rows.find((r) => r.provider === 'openwa');
  if (openwa) return mapRow(openwa);
  const meta = rows.find((r) => r.provider === 'meta');
  return meta ? mapRow(meta) : null;
}

export function resolveOpenWaApiBaseUrl(routing: TenantWhatsappRouting): string | null {
  const fromRow = routing.openwaApiBaseUrl?.trim();
  if (fromRow) return fromRow.replace(/\/$/, '');
  const fromEnv = process.env.OPENWA_API_URL?.trim();
  return fromEnv ? fromEnv.replace(/\/$/, '') : null;
}

export function resolveOpenWaApiKey(): string | null {
  const key = process.env.OPENWA_API_KEY?.trim();
  return key || null;
}
