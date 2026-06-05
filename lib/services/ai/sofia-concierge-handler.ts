/**
 * Shared Sofia concierge HTTP handler — single pipeline for all chat API routes.
 * Location: lib/services/ai/sofia-concierge-handler.ts
 *
 * Wires: validation → role mapping → pricing gate → SofiaConciergeService → ai_conversations / ai_messages.
 */

import { SofiaConciergeService } from '@/lib/services/ai/SofiaConciergeService';
import type { UserRole } from '@/lib/services/ai/DataFilterService';
import type { AIConversationChannel, AIRequest, AIResponse } from '@/lib/types/ai';
import { isStaffRole, isPlatformAdminRole } from '@/lib/auth/roles';
import { securityLogger } from '@/lib/utils/security-logger';

export const SOFIA_SENSITIVE_PRICING_PATTERN =
  /\b(price|pricing|rate|rates|cost|costs|nad|availability|available|book|booking)\b/i;

const concierge = new SofiaConciergeService();

export function mapSessionRoleToSofiaUserRole(role: string | null | undefined): UserRole {
  if (isStaffRole(role) || isPlatformAdminRole(role)) {
    return 'admin';
  }
  const r = (role ?? '').toLowerCase();
  if (r === 'guest' || r === 'user') {
    return 'guest';
  }
  return 'public';
}

/** Standard response when unauthenticated users ask for gated pricing/booking data. */
export function sofiaPricingGateResponse(): AIResponse {
  return {
    response: 'For pricing and availability, please sign up - it only takes a minute!',
    confidence: 1,
    intent: 'auth_required_for_pricing',
    entities: {},
    suggestions: ['Sign up to view room rates', 'Sign in to check availability'],
    actions: [],
  };
}

export function shouldApplySofiaPricingGate(
  message: string,
  sofiaRole: UserRole
): boolean {
  return sofiaRole === 'public' && SOFIA_SENSITIVE_PRICING_PATTERN.test(message);
}

export type ProcessSofiaConciergeInput = {
  message: string;
  sessionId: string;
  tenantId: string;
  sessionRole?: string | null;
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  language?: string;
  channel?: AIConversationChannel;
  emailData?: AIRequest['emailData'];
};

export function buildSofiaAiRequest(input: ProcessSofiaConciergeInput): AIRequest {
  return {
    message: input.message,
    context: {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      propertyId: input.propertyId,
      guestId: input.guestId,
      bookingId: input.bookingId,
    },
    language: input.language,
    channel: input.channel ?? 'WEB',
    emailData: input.emailData,
  };
}

/**
 * Process a user message through the full Sofia stack (RAG, KB, CRM memory, persistence).
 */
export async function processSofiaConciergeMessage(
  input: ProcessSofiaConciergeInput,
  userRoleOverride?: UserRole
): Promise<AIResponse> {
  const userRole = userRoleOverride ?? mapSessionRoleToSofiaUserRole(input.sessionRole);

  if (shouldApplySofiaPricingGate(input.message, userRole)) {
    return sofiaPricingGateResponse();
  }

  return concierge.processMessage(buildSofiaAiRequest(input), userRole);
}

/** Resolve guest id by email for a tenant (public widget / property pages). */
export async function findOrCreateGuestIdByEmail(
  tenantId: string,
  email: string
): Promise<string | undefined> {
  const { db, guests } = await import('@/lib/db');
  const { eq, and } = await import('drizzle-orm');

  try {
    const [existing] = await db
      .select({ id: guests.id })
      .from(guests)
      .where(and(eq(guests.tenantId, tenantId), eq(guests.email, email)))
      .limit(1);
    if (existing) return existing.id;

    const [created] = await db
      .insert(guests)
      .values({ tenantId, email })
      .returning({ id: guests.id });
    return created?.id;
  } catch (error) {
    securityLogger.error('[sofia-concierge-handler] findOrCreateGuestIdByEmail:', error);
    return undefined;
  }
}

export function getSofiaConciergeService(): SofiaConciergeService {
  return concierge;
}
