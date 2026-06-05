/**
 * Conference hall and campsite pricing + availability checks.
 * Location: lib/services/booking/FacilityBookingPricing.ts
 */

import { HOTEL_ETUNA_FACILITY_RATES } from '@/lib/constants/hotel-etuna-room-types';

export type CampsitePricingInput = {
  namibianGuests: number;
  nonNamibianGuests: number;
};

export function calculateConferenceTotal(): number {
  return HOTEL_ETUNA_FACILITY_RATES.conferenceSession;
}

export function calculateCampsiteTotal(input: CampsitePricingInput): number {
  const namibian = Math.max(0, Math.floor(input.namibianGuests));
  const nonNamibian = Math.max(0, Math.floor(input.nonNamibianGuests));
  const perPerson = namibian * HOTEL_ETUNA_FACILITY_RATES.campsiteNamibianPp
    + nonNamibian * HOTEL_ETUNA_FACILITY_RATES.campsiteNonNamibianPp;
  return Math.max(HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum, perPerson);
}

export function campsiteGuestTotal(input: CampsitePricingInput): number {
  return Math.max(0, Math.floor(input.namibianGuests)) + Math.max(0, Math.floor(input.nonNamibianGuests));
}
