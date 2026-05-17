/**
 * Structured slots persisted on ai_conversations.context (JSONB).
 * Location: lib/types/sofia-conversation-context.ts
 */

export type RestaurantReservationFlowState = {
  flow: 'restaurant_reservation';
  partySize?: number;
  reservationDate?: string;
  reservationTime?: string;
  dietaryRestrictions?: string;
  specialRequests?: string;
  guestEmail?: string;
  depositCents?: number;
  currency?: string;
  adumoPayUrl?: string;
  paymentSessionId?: string;
  bookingCode?: string;
  diningReservationId?: string;
  status?: 'collecting' | 'awaiting_deposit' | 'confirmed' | 'cancelled';
};

export type SofiaConversationContextJson = {
  restaurantReservation?: RestaurantReservationFlowState;
  [key: string]: unknown;
};
