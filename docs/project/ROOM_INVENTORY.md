# Hotel Etuna — Room & Facility Inventory (OS reference)

**Last updated:** 2026-06-04

## Source of truth

| Layer | Path |
|-------|------|
| Constants & rates | `lib/constants/hotel-etuna-room-types.ts` |
| Physical units + facility metadata | `lib/data/hotel-etuna-room-inventory.ts` |
| Public marketing (5 cards) | `lib/data/room-type-catalog.ts` → `getHubRoomTypeCatalog()` |
| All guest units (35) | `lib/data/rooms.ts` → `getHubGuestRooms()` |
| Facilities rows | `lib/data/rooms.ts` → `getHubFacilityRooms()` / `getFacilityRoomByKind()` |
| Display copy & tours | `lib/rooms/room-display.ts` |
| Facility pricing | `lib/services/booking/FacilityBookingPricing.ts` |
| Bookings | `lib/services/booking/BookingService.ts` (`createBooking`, `createFacilityBooking`) |
| API | `app/api/bookings/route.ts` (accommodation \| conference \| campsite) |
| Seed | `scripts/seed-hotel-etuna.ts` |
| Migrations | `database/drizzle/0040_*`, `0041_*`, `0042_*` |

## Public routes

- `/` and `/rooms` — **guest room types only**: five marketing cards via `getHubRoomTypeCatalog()` (Standard A/B/C, Executive, Premiere). Conference and campsite never appear here.
- `/facilities` — hub linking to bookable facilities
- `/facilities/conference` — session booking (auth → `/login?redirect=...`)
- `/facilities/campsite` — date range + guest counts
- `proxy.ts` — `/facilities` on `PUBLIC_ROUTES`

**Counts:** 35 numbered **guest rooms** (five marketing types) + **one** conference hall + **one** campsite. Facilities do not have guest room numbers; `rooms.room_number` stores internal keys `facility:conference` and `facility:campsite` after migration `0043`.

Guest vs facility rows are split in `lib/data/rooms.ts` by `inventory_kind` only. Display labels: `lib/rooms/inventory-display.ts` (`getInventoryListingTitle`).

## Knowledge & RAG

- `data/hotel-etuna-knowledge/room-descriptions.md`
- `data/hotel-etuna-knowledge/hotel-etuna-facts.md`
- Re-ingest: `npm run rag:seed`

## Wired surfaces (dashboard / BI / accounting / Sofia)

| Surface | Path / module |
|---------|----------------|
| Booking kind helpers | `lib/bookings/booking-kind.ts` |
| Ops calendar + filters | `components/features/booking/BookingsOperationsHub.tsx`, `/bookings` |
| Staff create tabs | `app/(dashboard)/bookings/new/page.tsx`, `NewBookingTabs.tsx` |
| Folio charges by kind | `lib/services/folio/FolioService.ts` → `ensureBookingChargeForBooking` |
| Lifecycle emails | `lib/services/booking/bookingLifecycleSideEffects.ts` (accommodation-only hospitality) |
| Analytics occupancy | `lib/services/analytics/AnalyticsService.ts` (guest_room + accommodation) |
| Intelligence digest | `lib/services/platform/IntelligenceReportService.ts` |
| P&L split | `lib/services/accounting/HospitalityAccountingService.ts`, `HospitalityAccountingPanel.tsx` |
| Sofia / KB | `lib/services/ai/KnowledgeBaseService.ts`, `SofiaConciergeService.ts` |
| Facility availability API | `app/api/bookings/facility-availability/route.ts` |

## Verify

```bash
npm run lint
npx tsc --noEmit
npm run test:db:migrations
npx vitest run tests/unit/facility-booking-pricing.test.ts tests/unit/room-inventory-split.test.ts tests/unit/booking-kind-filters.test.ts
npm run test:seed
npm run rag:seed
npm run build
# Hub integration (requires HUB_TENANT_ID + migrated DB):
npx vitest run tests/integration/rooms.test.ts -t "Hub room"
```
