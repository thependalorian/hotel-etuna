/**
 * Canonical Etuna Restaurant & bar hours (single source of truth).
 * Location: lib/dining/restaurant-hours.ts
 */

export type HoursSlot = { open: string; close: string };

export const ETUNA_RESTAURANT_HOURS = {
  /** Breakfast buffet and light meals */
  breakfast: { open: '07:00', close: '10:00' },
  /** Kitchen: lunch, dinner, and in-restaurant orders */
  service: { open: '10:00', close: '22:00' },
  /** Bar (same service window as kitchen) */
  bar: { open: '10:00', close: '22:00' },
} as const satisfies Record<string, HoursSlot>;

function formatSlot(slot: HoursSlot): string {
  return `${slot.open} - ${slot.close}`;
}

export const restaurantHoursLabels = {
  breakfast: formatSlot(ETUNA_RESTAURANT_HOURS.breakfast),
  lunchDinner: formatSlot(ETUNA_RESTAURANT_HOURS.service),
  bar: formatSlot(ETUNA_RESTAURANT_HOURS.bar),
} as const;

/** Stored on restaurants.opening_hours (JSON) */
export function getRestaurantOpeningHoursJson() {
  return {
    breakfast: { ...ETUNA_RESTAURANT_HOURS.breakfast },
    service: { ...ETUNA_RESTAURANT_HOURS.service },
    bar: { ...ETUNA_RESTAURANT_HOURS.bar },
  };
}

export const restaurantHoursSummary =
  `Breakfast ${restaurantHoursLabels.breakfast}. Lunch, dinner, and bar orders ${restaurantHoursLabels.lunchDinner}.`;

export const restaurantMenuHoursBlurb =
  `Breakfast and light meals are served from **${restaurantHoursLabels.breakfast}**. ` +
  `Lunch, dinner, and bar service run **${restaurantHoursLabels.lunchDinner}**.`;
