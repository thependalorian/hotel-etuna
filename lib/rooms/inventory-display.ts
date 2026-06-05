/**
 * Labels for guest rooms vs bookable facilities (conference / campsite).
 * Location: lib/rooms/inventory-display.ts
 *
 * Guest rooms have physical room numbers (5, 14, E7, …).
 * Facilities are singular — one conference hall, one campsite — with no public "room number".
 */

export type InventoryKind = 'guest_room' | 'conference' | 'campsite' | string | null | undefined;

export function isFacilityInventoryKind(kind: InventoryKind): boolean {
  return kind === 'conference' || kind === 'campsite';
}

export function isGuestInventoryKind(kind: InventoryKind): boolean {
  return !isFacilityInventoryKind(kind);
}

/** Internal `rooms.room_number` for facility rows (not shown to guests). */
export function facilityDbRoomNumber(kind: 'conference' | 'campsite'): string {
  return `facility:${kind}`;
}

export const LEGACY_FACILITY_DB_ROOM_NUMBERS = ['CONFERENCE-HALL', 'CAMPSITE'] as const;

export function isLegacyFacilityDbRoomNumber(roomNumber: string): boolean {
  return (LEGACY_FACILITY_DB_ROOM_NUMBERS as readonly string[]).includes(roomNumber);
}

type InventoryLabelInput = {
  roomType: string;
  roomNumber?: string | null;
  inventoryKind?: InventoryKind;
};

/** Staff / receipt listing title — never "Room CONFERENCE-HALL". */
export function getInventoryListingTitle(room: InventoryLabelInput): string {
  if (isFacilityInventoryKind(room.inventoryKind)) {
    return room.roomType;
  }
  const num = room.roomNumber?.trim();
  return num ? `${room.roomType} — Room ${num}` : room.roomType;
}

export function shouldShowGuestRoomNumber(kind: InventoryKind): boolean {
  return isGuestInventoryKind(kind);
}
