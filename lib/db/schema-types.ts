/**
 * Canonical DB types — inferred from Drizzle schema (use in app code).
 * Location: lib/db/schema-types.ts
 *
 * Canonical DB types — use this module (or Drizzle infer from schema.ts) for all app code.
 */

export type {
  Booking,
  BookingCharge,
  Guest,
  NewBookingCharge,
  User,
} from '@/lib/db/schema';

export type {
  AiConversation,
  AiMessage,
  NewAiConversation,
  NewAiMessage,
} from '@/lib/db/schema';

export {
  bookingChargeStatusEnum,
  bookingChargeTypeEnum,
  bookingStatusEnum,
  loyaltyTierEnum,
} from '@/lib/db/schema';
