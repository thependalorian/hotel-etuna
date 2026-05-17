/**
 * Enish-inspired restaurant reservation slots: party size, deposit, booking code, OTP cancel.
 * Location: lib/services/sofia/RestaurantReservationFlowService.ts
 */

import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db, diningReservations, restaurants, properties } from '@/lib/db';
import type { RestaurantReservationFlowState, SofiaConversationContextJson } from '@/lib/types/sofia-conversation-context';
import { SofiaConversationContextService } from '@/lib/services/sofia/SofiaConversationContextService';

const BASE_DEPOSIT_CENTS = Number(process.env.RESTAURANT_DEPOSIT_BASE_CENTS ?? 5000);
const PER_GUEST_CENTS = Number(process.env.RESTAURANT_DEPOSIT_PER_GUEST_CENTS ?? 2500);
const MIN_PARTY = 1;
const MAX_PARTY = 20;

export function computeDepositCents(partySize: number): number {
  const size = Math.min(MAX_PARTY, Math.max(MIN_PARTY, partySize));
  if (size <= 2) return BASE_DEPOSIT_CENTS;
  return BASE_DEPOSIT_CENTS + (size - 2) * PER_GUEST_CENTS;
}

export function generateBookingCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function parsePartySize(text: string): number | undefined {
  const m =
    text.match(/\b(?:party of|table for|for)\s+(\d{1,2})\b/i) ||
    text.match(/\b(\d{1,2})\s+(?:guests?|people|diners)\b/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n >= MIN_PARTY && n <= MAX_PARTY ? n : undefined;
}

function parseDate(text: string): string | undefined {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dmy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})\b/);
  if (dmy) {
    const [, d, mo, y] = dmy;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return undefined;
}

function parseTime(text: string): string | undefined {
  const contextual =
    text.match(/\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
    text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (!contextual) return undefined;
  let hour = Number(contextual[1]);
  const minute = contextual[2] ? Number(contextual[2]) : 0;
  const meridiem = contextual[3]?.toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export class RestaurantReservationFlowService {
  private contextSvc = new SofiaConversationContextService();

  mergeSlotsFromMessage(
    state: RestaurantReservationFlowState | undefined,
    userMessage: string,
    guestEmail?: string | null
  ): RestaurantReservationFlowState {
    const next: RestaurantReservationFlowState = {
      flow: 'restaurant_reservation',
      status: state?.status ?? 'collecting',
      ...state,
    };
    const party = parsePartySize(userMessage);
    if (party) next.partySize = party;
    const date = parseDate(userMessage);
    if (date) next.reservationDate = date;
    const time = parseTime(userMessage);
    if (time) next.reservationTime = time;
    if (guestEmail) next.guestEmail = guestEmail;
    if (/\bvegetarian\b/i.test(userMessage)) next.dietaryRestrictions = 'vegetarian';
    if (/\bvegan\b/i.test(userMessage)) next.dietaryRestrictions = 'vegan';
    if (/\bgluten[- ]?free\b/i.test(userMessage)) next.dietaryRestrictions = 'gluten-free';
    if (next.partySize) {
      next.depositCents = computeDepositCents(next.partySize);
      next.currency = next.currency ?? 'NAD';
    }
    return next;
  }

  isReadyForDeposit(state: RestaurantReservationFlowState | undefined): boolean {
    return Boolean(
      state?.partySize &&
        state.reservationDate &&
        state.reservationTime &&
        state.depositCents &&
        state.status !== 'confirmed'
    );
  }

  formatContextForPrompt(ctx: SofiaConversationContextJson): string {
    const r = ctx.restaurantReservation;
    if (!r) return '';
    const lines = ['Active restaurant reservation flow (use to avoid re-asking):'];
    if (r.partySize) lines.push(`- Party size: ${r.partySize}`);
    if (r.reservationDate) lines.push(`- Date: ${r.reservationDate}`);
    if (r.reservationTime) lines.push(`- Time: ${r.reservationTime}`);
    if (r.dietaryRestrictions) lines.push(`- Dietary: ${r.dietaryRestrictions}`);
    if (r.depositCents) lines.push(`- Deposit due: ${r.currency ?? 'NAD'} ${(r.depositCents / 100).toFixed(2)}`);
    if (r.bookingCode) lines.push(`- Booking code: ${r.bookingCode}`);
    if (r.status) lines.push(`- Status: ${r.status}`);
    return lines.join('\n') + '\n';
  }

  async syncAfterTurn(input: {
    tenantId: string;
    sessionId: string;
    guestId?: string;
    propertyId?: string;
    stayBookingId?: string;
    userMessage: string;
    intent: string;
    guestEmail?: string | null;
  }): Promise<RestaurantReservationFlowState | undefined> {
    const isRestaurant =
      input.intent === 'booking_restaurant' ||
      /\b(restaurant|reservation|table for|dinner booking)\b/i.test(input.userMessage);
    if (!isRestaurant) return undefined;

    const current = await this.contextSvc.getContext(input.tenantId, input.sessionId);
    const merged = this.mergeSlotsFromMessage(
      current.restaurantReservation,
      input.userMessage,
      input.guestEmail
    );

    if (this.isReadyForDeposit(merged) && !merged.bookingCode && input.guestId) {
      const restaurantId = await this.resolveRestaurantId(input.tenantId, input.propertyId);
      if (restaurantId) {
        const bookingCode = generateBookingCode();
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const [reservation] = await db
          .insert(diningReservations)
          .values({
            tenantId: input.tenantId,
            restaurantId,
            guestId: input.guestId,
            sessionId: input.sessionId,
            partySize: merged.partySize!,
            reservationDate: merged.reservationDate!,
            reservationTime: merged.reservationTime!,
            depositCents: merged.depositCents!,
            currency: merged.currency ?? 'NAD',
            bookingCode,
            otpHash,
            otpExpiresAt,
            status: 'awaiting_deposit',
            metadata: {
              dietaryRestrictions: merged.dietaryRestrictions,
              guestEmail: merged.guestEmail,
              ...(input.stayBookingId ? { stay_booking_id: input.stayBookingId } : {}),
            },
          })
          .returning({ id: diningReservations.id });

        merged.bookingCode = bookingCode;
        merged.diningReservationId = reservation?.id;
        merged.status = 'awaiting_deposit';
        (merged as RestaurantReservationFlowStateWithOtp)._otpPlaintextForEmail = otp;
      }
    }

    const { _otpPlaintextForEmail, ...persisted } = merged as RestaurantReservationFlowStateWithOtp;
    await this.contextSvc.mergeContext(input.tenantId, input.sessionId, {
      restaurantReservation: persisted,
    });
    return { ...persisted, ...(_otpPlaintextForEmail ? { _otpPlaintextForEmail } : {}) };
  }

  private async resolveRestaurantId(tenantId: string, propertyId?: string): Promise<string | null> {
    if (propertyId) {
      const [row] = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(and(eq(properties.tenantId, tenantId), eq(restaurants.propertyId, propertyId)))
        .limit(1);
      return row?.id ?? null;
    }
    const [row] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .innerJoin(properties, eq(restaurants.propertyId, properties.id))
      .where(eq(properties.tenantId, tenantId))
      .limit(1);
    return row?.id ?? null;
  }
}

/** OTP plaintext only exists in-memory for one email send — not stored in DB context. */
export type RestaurantReservationFlowStateWithOtp = RestaurantReservationFlowState & {
  _otpPlaintextForEmail?: string;
};
