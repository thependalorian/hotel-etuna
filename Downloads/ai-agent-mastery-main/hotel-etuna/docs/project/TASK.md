# Hotel Etuna — Tasks

## Phase 1: Foundation (P0)

- [ ] Set `SINGLE_TENANT_MODE=false`, `HUB_TENANT_ID`, `DEFAULT_PROPERTY_ID` in `.env`.
- [ ] Ensure Neon `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are configured.
- [ ] Remove `@supabase/supabase-js` imports/usages from runtime code.
- [ ] Add image storage abstraction (`Vercel Blob` or `Cloudinary`) for partner/property media.
- [ ] Update middleware for hub/partner tenant context injection from JWT.
- [ ] Create `scripts/seed-hotel-etuna.ts` (hub tenant, property, admin, room types, restaurant basics).
- [ ] Verify app boots and authenticated routes resolve tenant context.

## Phase 2: Branding & Public Site (P0)

- [ ] Extend `tailwind.config.ts` with khaki/terracotta/sage palette and typography tokens.
- [ ] Update global styles and theme variables.
- [ ] Replace Buffr logos/labels with Hotel Etuna branding in shared layout components.
- [ ] Build landing sections in `app/page.tsx` (Hero, Story, Rooms, Dining, Tours, Reviews, Booking, Partners).
- [ ] Create/align public routes: `/rooms`, `/dining`, `/tours`, `/about`, `/contact`, `/partners`, `/[partnerSlug]`.

## Phase 3: Partner Network (P0)

- [x] Add migration fields: `tenant_type`, `parent_tenant_id`, `commission_percent`, `commission_amount`.
- [ ] Enforce RLS on tenant-scoped tables for partner isolation.
- [ ] Implement `POST /api/partners/invite`.
- [ ] Implement `POST /api/partners/claim-invite`.
- [ ] Implement `GET /api/partners/[id]` public listing payload.
- [ ] Implement `/admin/partners` management page (invite, commission %, deactivate).
- [ ] Implement partner dashboard layout/routes (`app/(partner)/*`) with limited nav.

## Phase 4: Sofia & Communications (P1)

- [ ] Keep Sofia AI strictly hub-only; confirm partner lockouts.
- [ ] Add explicit middleware 403 for partner calls to `/api/sofia/*`, `/api/ai/*`, `/api/crm/*`.
- [ ] Build Hotel Etuna branded email base wrapper.
- [ ] Migrate booking/check-in/check-out emails to new Hotel Etuna wrapper.
- [ ] Ingest Hotel Etuna hub knowledge into Qdrant (`scripts/ingest-etuna-knowledge.ts`).
- [ ] Set up `concierge@hoteletuna.com` IMAP/SMTP paths.

## Phase 5: Partner UX Hardening (P1)

- [ ] Ensure no Sofia widget appears on partner public pages.
- [ ] Replace partner page AI touchpoints with contact form or phone action.
- [ ] Ensure partner dashboard contains no CRM/AI links or components.

## Phase 6: Data Migration & Testing (P2)

- [ ] Build CSV guest import tool for hub CRM.
- [ ] Add integration tests for invite/claim/isolation/commission.
- [ ] Add E2E tests for partner onboarding and booking flows.
- [ ] Run full suite on Neon test DB and record outputs.

## Phase 7: Guest Experience Engine (P1)

- [ ] Build push notification infrastructure (service worker, VAPID, subscription storage, send endpoints).
- [ ] Create `lib/services/notifications/PushNotificationService.ts`.
- [ ] Add `public/service-worker.js`.
- [ ] Add `POST /api/notifications/subscribe`.
- [ ] Add `POST /api/notifications/send`.
- [ ] Integrate push triggers into booking lifecycle transitions.
- [ ] Build `app/(guest)/my-stay/page.tsx` for mobile check-in/out and in-stay controls.
- [ ] Wire check-in flow to identity/KYC/document capture + booking status transitions.
- [ ] Add guest service request UI and route requests into support tickets.
- [ ] Add housekeeping/maintenance intent routing in Sofia for hub guests.

## Phase 8: Revenue & Loyalty Engine (P1)

- [ ] Build guest-facing digital dining UI with categories/photos/dietary filters.
- [ ] Connect room-service ordering to `OrderService` and booking guest context.
- [ ] Extend `CrmOutreachService` with proactive in-stay upsell triggers.
- [ ] Add templates for late checkout, room upgrades, tours, and in-stay offers.
- [ ] Build loyalty dashboard elements in guest stay UI.
- [ ] Add push + email offer delivery pipeline for proactive upsells.
- [ ] Add E2E tests for menu ordering, upsell acceptance, and loyalty visibility.

---

## Validation Commands

```bash
npx tsc --noEmit
npm run lint
npm run test:db
npm test
npm run test:e2e
npm run build
```
