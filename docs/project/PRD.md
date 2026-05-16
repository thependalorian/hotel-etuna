# Hotel Etuna — Product Requirements Document (PRD)

**Version:** 2.8.0  
**Date:** May 16, 2026  
**Auditor:** Product Team  
**Status:** **In production** (Vercel + Neon). All core features complete. This is the consolidated single source of truth for all product requirements.  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. System design canon: **`SYSTEM_DESIGN_MASTER_GUIDE.md`** (repo root), inlined in PRD §6.6 / §4.3.2 / §11.5–11.6. All product features and requirements consolidated from scattered reports into this document.

---

## 1. Product Summary

Hotel Etuna is a **hub‑and‑spoke hospitality platform** built on the Buffr Host core, featuring:

- A **flagship property** (Hotel Etuna) with full PMS, CRM, F&B, and staff operations
- A **public‑facing guest website** with **gated content** (descriptions visible, prices/booking require login) for booking rooms, viewing amenities, dining menus, and AI‑powered concierge (Sofia)
- A **B2B referral partner network** enabling trusted properties (JayLa Accommodation, Aquarius Airbnb Windhoek) to join the platform
- **Self‑service partner portals** for independent property management while earning Hotel Etuna commissions

**Core Architecture:** Hotel Etuna operates as the **hub tenant** with full platform capabilities. Referral partners are **lightweight partner tenants** with isolated self‑service dashboards, public listing pages, and **no AI features**. All bookings flow through the platform with commission tracking.

**Positioning:** Hotel Etuna is the **operating system for one flagship property** that extends its brand and reach by curating a network of trusted lodging partners in Windhoek, creating a comprehensive hospitality ecosystem.

**Out of scope (May 2026):** Curated **tours** are not a public product surface — no `/tours` route, nav links, booking CTAs, or Sofia knowledge doc. Concierge may still answer general area questions from `local-area.md`; excursion sales are reception/concierge offline only unless product scope changes.

---

## 2. User Personas & Target Segments

### 2.1 Primary User Personas

#### Corporate & Government Travellers (40% target mix)
**Profile:** Decision-makers, project managers, government officials visiting Oshana Region for meetings, projects, or official business.

**Needs:**
- Predictable WiFi and desk workspace
- Breakfast windows that accommodate early departures
- Invoice hygiene for expense reporting
- Proximity to administrative offices and Trade Fair Centre
- Professional, quiet environment

**Pain Points:**
- Inconsistent service quality at competitors
- Poor WiFi reliability
- Slow check-in processes
- Lack of corporate rate agreements

**How We Win:** Consistent service standards, dedicated corporate rate cards, proactive B2B sales outreach, fast check-in/out, reliable technology infrastructure.

#### Trade Fair & Conference Attendees (20% target mix)
**Profile:** Business visitors attending Ongwediva Trade Fair, regional conferences, or exhibitions.

**Needs:**
- Walking distance to Trade Fair Centre (~500m)
- Multi-night packages with competitive rates
- Early breakfast for early fair starts
- Secure parking
- Group booking coordination

**Pain Points:**
- Hotels fully booked during fair season
- Premium pricing without added value
- Long walks from distant properties

**How We Win:** Pre-sold packages, fair proximity messaging, structured group rates, booking priority for repeat fair attendees.

#### Families & Leisure Travellers (20% target mix)
**Profile:** Namibian families traveling domestically, regional tourists exploring northern Namibia.

**Needs:**
- Family Room accommodations
- Pool access and child-safe environment
- Flexible dining (breakfast buffet + room service)
- Safe parking and secure premises

**Pain Points:**
- Limited family-friendly accommodation options
- Concerns about safety and security
- Lack of organized activities

**How We Win:** Dedicated Family Room tier, visible security messaging, warm family service culture aligned with "He takes care of us" positioning.

#### International Visitors (20% target mix)
**Profile:** International tourists on northern Namibia itineraries, often combining Etosha, Ovamboland cultural sites, and regional exploration.

**Needs:**
- Clear payment options (NAD, Rand, card)
- English communication
- Airport shuttle transparency
- Local area guidance and concierge referrals
- Cultural authenticity without "poverty tourism"

**Pain Points:**
- Unclear pricing (hidden fees, currency confusion)
- Transportation logistics
- Generic "African" theming that lacks local authenticity

**How We Win:** Transparent pricing, flat-rate airport shuttle (N$250), authentic Oshiwambo cultural positioning, English + local language mix.

### 2.2 Anti-Personas (Who We're Not For)

**Budget Backpackers:** Hotel Etuna does not compete on lowest price. Travelers seeking hostel-level rates should explore alternatives.

**Luxury-Expectation International Chains:** We do not offer global loyalty programs (Marriott Bonvoy, Hilton Honors) or multi-property portfolios. We compete on care and local authenticity, not scale.

**Long-Term Corporate Housing:** While we serve business travelers, we are not equipped for month-long corporate housing needs (full kitchens, laundry, workspace).

### 2.3 Booking Behavior & Channel Mix

| Segment | Primary Channels | Booking Window | Price Sensitivity |
|---------|-----------------|----------------|-------------------|
| Corporate | Direct (CRM), Phone, Email | 1-7 days advance | Low (expense accounts) |
| Trade Fair | Direct, OTAs | 30-90 days advance | Medium (seeking packages) |
| Families | OTAs, Website, Referrals | 7-30 days advance | Medium-High |
| International | OTAs, Website | 14-60 days advance | Medium |

**Target Direct Booking Share:** 50% (currently <20%, per PRD baseline).

**Primary OTAs:** Booking.com, Airbnb (for partner listings), Google Hotel Ads.

---

## 3. Core Capabilities (In Scope)

### 2.1 Hotel Etuna (Hub Tenant) — Core Operations

| Domain | Requirements |
|--------|----------------|
| **PMS** | Complete property management for Hotel Etuna: 5 room types (Standard, Luxury, Family, Executive Suite, Premier), dynamic rates (editable via admin), availability calendar, online booking flow, booking lifecycle (confirmed → checked‑in → checked‑out → completed/cancelled). Hub admin can view all bookings (own + partners) for commission reporting. |
| **Restaurant** | Etuna Restaurant: **12 menu categories**, **~110+ live items** in Neon (`menu_categories` + `cms_menu_items`; catalog `lib/data/etuna-restaurant-menu-catalog.ts` for seed/reference). **Public digital menu book** on `/dining` (§3.1.1). Table QR dine‑in, **in‑room room service** (checked‑in only) on **stay folio** (`booking_charges`), order lifecycle (pending → preparing → served). **Hours:** breakfast **07:00–10:00**; lunch, dinner & bar orders **10:00–22:00** (`lib/dining/restaurant-hours.ts`). **Signature dishes:** Full Breakfast, King Klip, Oxtail, Lamb Curry, Etuna Chicken Mushroom pizza. **F&B inventory:** SKU-level stock + low-stock alerts (`database/drizzle/0011_fnb_inventory.sql`, `lib/services/inventory/InventoryService.ts`). APIs: `GET /api/public/room-qr/[code]`, `GET/POST /api/guest/stays/[bookingId]/folio|orders|settle`. |
| **Guest CRM** | Comprehensive guest profiles, preferences, **CRM memory** (facts, relationship edges), contact history, marketing consent. **`guest_profiles`** holds **loyalty tier/points** (permanent); **`booking_charges`** holds **per‑stay folio** (room + F&B + settlement) — not duplicated. **Loyalty program:** Earn 1 point per N$10 spent on folio settlement; redeem 100 points = N$50 folio adjustment. `/api/crm/*` endpoints accessible by hub admin across all properties. |
| **Staff & Dashboard** | Role‑based access for Hotel Etuna staff (owner, manager, front‑desk, housekeeping, kitchen). Audit logging for all sensitive actions. Staff dashboard is hub‑specific and includes partner management features. |
| **Communications** | Sofia AI voice/web chat, WhatsApp webhook, support tickets. Email automation (booking confirmations, check‑in reminders, post‑stay thank you). **Hub tenant only** — partners do not have Sofia AI or email automation. |
| **Support** | Platform support tickets for hotel staff and partners. Integrated issue tracker for bug reports, feature requests. Hub admin can view all support tickets. |
| **Compliance & Risk** | Consumer rights / cyber incident lifecycles; **KYC/KYB for Hotel Etuna and all partners**. Court‑admissible audit themes. All regulatory requirements (PSD‑12, PSD‑4, ETA 2019) apply platform‑wide. |
| **AI (Sofia)** | **Hub‑exclusive AI concierge** with knowledge base for Hotel Etuna only. RAG over Hotel Etuna property documents, guest preferences, CRM memory. **Knowledge base contains 4 documents** (hotel facts, room descriptions, restaurant menu, local area info), **~9 semantic chunks**, **OpenAI text-embedding-3-small (1536d)**, stored in **Qdrant vector database**. Human escalation for low confidence or policy keywords. **Partners do not have access to Sofia AI or any AI features.** Sofia enforces gated content: will not disclose prices or availability to unauthenticated users, instead prompts sign‑up. **Ingestion script: `scripts/ingest-hotel-etuna-knowledge.ts`** with semantic chunking (~800 chars, 100-char overlap), batch embedding generation, retry logic, and idempotent upserts. |
| **Guest‑Facing Website** | Public homepage with hero, **room photo tours** (`/rooms`, `/rooms/[slug]` — §3.1.2), restaurant menu book (`/dining` — §3.1.1), photo gallery, contact page, **plus** a "Referral Partners" section showcasing partner properties. Fully branded with Hotel Etuna visual identity. **✅ Database‑driven** — all content pulled live from Neon DB. **✅ Review approval workflow** (`is_public` toggle in admin dashboard at `/crm/reviews` — filter by status, sort by date/rating, real-time optimistic UI updates). **✅ Gated content model** — prices/booking hidden until login; room tours and menu browse are public. **✅ ISR caching: 5-minute revalidation** for performance. **Contact details verified:** 5544 Valley Street, Ongwediva; +264 65 231 177; +264 81 802 4833; check-in 14:00, check-out 11:00. **All room slugs:** `standard-room`, `luxury-room`, `family-room`, `executive-suite`, `premier-room`. |
| **Platform** | Hub‑and‑spoke multi‑tenancy with `tenant_type` distinction. Hub admin has elevated permissions. Domain: `hoteletuna.com` with partner subpages at `/partners/[slug]`. |

#### 3.1.1 Public digital menu book (`/dining`)

| Layer | Implementation |
|-------|----------------|
| **Data** | `getCompleteMenu()` (`lib/data/dining.ts`) loads **only** from Neon — no runtime catalog fallback. `serializePublicMenu()` (`lib/dining/serialize-public-menu.ts`) builds the client payload; `is_available = true` filter applied. |
| **Images** | Dish photos from `cms_menu_items.image_url`. Seeded/validated via `npm run seed:menu-images` / `validate:menu-images` / `seed:menu-images:full` (`scripts/seed-menu-images.ts`, `lib/data/menu-item-image-urls.ts`, **480×360** thumbs; Unsplash + Wikimedia; `next.config.ts` remote patterns). |
| **Guest favourites** | Top dishes from **order analytics (90 days)** — `MenuPopularityService` + `featuredMenuItemIds` passed into serializer (not hardcoded dish names). |
| **UX** | `PublicMenuBoard` → optional **Guest favourites** horizontal strip, then **one full-menu book** (`MenuBookFullMenu`) with **all categories and items** in display order. **No category tabs, search bar, or dish-count helper** above the book. |
| **Page turn** | `MenuPageTurner` — 3D spread turn (click corner, drag, ← →). Cover: full-menu title + section index on back. Content pages chunked per category (`lib/dining/menu-book-pagination.ts`): **food = 4 items per face (2×2 grid with thumbnails)**; **drinks = compact list (8 per face, no thumbnails)**. Tap tile → `MenuBookItemDetailDialog`. |
| **Components** | `PublicMenuBoard`, `MenuBookFullMenu`, `MenuBookFullMenuCoverFace`, `MenuPageTurner`, `MenuBookItemsFace`, `MenuBookItemTile`, `MenuBookItemDetailDialog`, `MenuBookContinueFace`, `PublicMenuFeaturedCard`. Pagination/helpers: `lib/dining/menu-book-pagination.ts`. CMS form: `BasicInfoForm` (create + edit). |
| **CMS** | Staff edit name, description, price, `image_url`, availability at `/menu/[itemId]/edit` → `PATCH /api/menu/[itemId]` (`MenuService.updateMenuItem`). Restaurant menu UI links to same editor. |
| **Ordering** | Public `/dining` is **view-only** (browse + prices). Banner + CTA: sign in to order (`publicCopy.gated.menuBrowseOnly`). Checked-in guests order via guest stay / folio flows (authenticated). |

**Operator notes:** After bulk menu or image changes, run `npm run seed:menu-images:full` on Neon, or set image URLs in CMS. Homepage/landing dining teaser may still gate prices; `/dining` shows **full menu with NAD prices** for all visitors.

#### 3.1.2 Public room photo tours (`/rooms`, `/rooms/[slug]`)

| Layer | Implementation |
|-------|----------------|
| **Data** | `getHubRooms()` / `getRoomBySlug()` (`lib/data/rooms.ts`) — resolves hub property via **`resolvePublicHubProperty()`** (same as landing), then loads `rooms` excluding maintenance/out-of-order (case-insensitive). `export const dynamic = 'force-dynamic'` on `/rooms` pages. Public copy/tour stops: **`lib/rooms/room-display.ts`**. |
| **Listing UX** | `/rooms`: `PublicRoomsBrowseBanner` (guests — rates masked, sign in to book), `PublicRoomsSignedInBanner` (signed-in — same tours, rates + booking on each detail page), `RoomsIncludedStrip`, **`RoomsFilmstrip`** (no prices on cards; **Take the tour** → `/rooms/[slug]#tour`; guests see “Rates hidden — sign in to view”). |
| **Detail UX** | **Same `RoomPhotoTour` for everyone** (guests and signed-in). Guests: `RoomBookingCard` shows `publicCopy.gated.viewRates` (no NAD amounts); availability block hidden behind sign-in. Signed-in: live rates in card, **`LandingBookingWidget`** at `#booking`, CTA **Complete your booking** scrolls to widget. |
| **Gating** | Public pages never render room `baseRate` in tour UI. Homepage room cards + filmstrip link to `#tour`; prices only after login (`getServerSession` on `/` and `/rooms`). Booking completion requires account. |
| **Premier** | Six stops: overview, lounge, master bedroom, twin room, bathroom, balcony. Sleeps **4** (private lounge + master + twin configuration). Seed: `scripts/seed-hotel-etuna.ts` — `max_occupancy = 4`, amenities include **Mini fridge**. |
| **Images** | Prefer `rooms.images[]` when set; otherwise hospitality fallbacks under `/images/hospitality/*` per slug in `room-display.ts`. Replace with property photography via CMS/DB when available. |
| **Components** | `RoomPhotoTour`, `RoomsFilmstrip`, `RoomsIncludedStrip`, `PublicRoomsBrowseBanner`, `RoomBookingCard`. |
| **Tests** | `tests/unit/room-display.test.ts` — Premier occupancy override, six tour stops, included-amenities strip. |

**Operator notes:** Re-run `npx tsx scripts/seed-hotel-etuna.ts` after occupancy/amenity seed changes so Neon `max_occupancy` updates on conflict.

### 3.2 B2B Referral Partner Network

> **⚠️ CRITICAL: Sofia AI & ML/AI Features Are EXCLUSIVE to Hotel Etuna**
>
> Partners receive a **basic self‑service listing platform** with property management, booking tracking, and commission reports. They do **NOT** receive:
> - Sofia AI concierge or chat widgets
> - Email automation or AI‑generated content
> - CRM access or guest memory features
> - Knowledge base or RAG capabilities
> - Any ML/AI‑powered features whatsoever
>
> Partner public listing pages display a simple contact form or phone number instead of AI chat. All AI endpoints are middleware‑blocked for partner tenants.

|| Domain | Requirements |
|--------|----------------|
| **Partner Management** | Hub admin can invite external properties (JayLa Accommodation — 4 self‑catering rooms; Aquarius Luxurious Penthouse — 1 double room) via email. Each invite creates a **Partner Tenant** with isolated access to only their property, rooms, rates, images, and bookings. RLS policies enforce complete tenant isolation. **Seeding script: `scripts/seed-partners.ts`** with idempotent seeding, support for `--dry` and `--force` flags. **JayLa:** 4 rooms (Standard Studio N$650, Family Unit N$850, Deluxe Suite N$950, Twin Room N$750), 3-star, 39 Andimba Toivo ya Toivo Street, Windhoek. **Aquarius:** 1 room (Double Room N$450), 2-star homestay, Kingfisher Street, Fisher Court, Windhoek. **Partner admin credentials:** `owner@jayla.nam` and `owner@aquarius.nam` / `Test1234!`. |
| **Self‑Service Portal** | Partners authenticate via `/partner` route and land on a white‑labeled dashboard. They can manage: property name, description, photos, room types, rates, availability calendar, and view their bookings. No access to hub features or other partners. **Dashboard route: `/partner/dashboard`**. **Navigation restricted to:** Dashboard, My Property, Rooms, Bookings, Settings — no Sofia/CRM/Platform Admin access. **Layout file: `app/(partner)/layout.tsx`**. |
| **Invite & Onboarding** | Hub admin clicks **"Invite Partner"** in the dashboard, enters partner email and property name. System generates a unique invite token, sends branded email with sign‑up link. Partner claims invite, sets password, auto‑creates their tenant (`type=partner`) and property record. |
| **Public Listings** | Each partner gets a public profile page at `/partners/[slug]` (e.g., `/partners/jayla`). Displays: hero image gallery, property description, room listings with pricing, photo gallery, amenities, booking widget (pre‑filled with partner's propertyId), contact form. **No Sofia AI chat widget** — simple contact form instead. **Gated content:** Partner prices hidden until user logs in. **API endpoints:** `GET /api/partners` (list all active partners, cached 10 min), `GET /api/partners/[slug]` (partner detail with rooms, cached 5 min). **Public pages:** `app/partners/page.tsx` (directory), `app/partners/[slug]/page.tsx` (detail). |
| **Booking & Commission** | All bookings processed centrally. Commission model: configurable percentage (default 10%) on partner bookings. `commission_amount` calculated at booking time. Hub admin dashboard shows aggregated commissions per partner, filterable by date range. |
| **AI Exclusivity** | **Sofia AI is exclusive to Hotel Etuna (hub tenant only).** All AI endpoints (`/api/sofia/*`, `/api/ai/*`, `/api/crm/*`) are restricted to hub tenant only via middleware enforcement. Partners cannot access CRM, knowledge base, or any AI features. **Middleware returns 403 Forbidden** for partner attempts to access hub-only routes. |

### 3.3 Room Inventory & Amenities (Hotel Etuna)

**Room tiers and pricing verified against database:**

|| Room Type | Slug | Base Rate | Max Occupancy | Key Amenities (Verified) |
|---|-----------|------|-----------|---------------|------------------------|
| 1 | Standard Room | `standard-room` | NAD 1,200/night | 2 guests | WiFi, Air Conditioning, TV, Minibar, Coffee/Tea, Mosquito Net, Desk |
| 2 | Luxury Room | `luxury-room` | NAD 1,800/night | 2 guests | WiFi, Air Conditioning, TV, Minibar, Coffee/Tea, Mosquito Net, Sitting Area, Bathrobe |
| 3 | Family Room | `family-room` | NAD 2,500/night | 4 guests | WiFi, Air Conditioning, TV, Minibar, Coffee/Tea, Mosquito Net, Extra Bedding, Garden Access |
| 4 | Executive Suite | `executive-suite` | NAD 3,000/night | 2 guests | WiFi, Air Conditioning, Work Desk, VIP Toiletries, Lounge Access, Mosquito Net |
| 5 | Premier Room | `premier-room` | NAD 3,800/night | **4 guests** | WiFi, Air Conditioning, TV, **Mini fridge**, Minibar, Coffee/Tea, Private Balcony, **Private lounge**, **Master + twin bedrooms**, 2 Bathrooms, Bathrobe |

**Fictional amenities removed during frontend audit:**
- ❌ "Private Pool" (Premier Room) — does not exist
- ❌ "Butler Service" (Premier Room) — not offered
- ❌ "Spa Bath" (Premier Room) — not available
- ❌ Generic "Queen Bed" / "King Bed" claims without verification
- ❌ "Bathtub" claims for standard rooms
- ❌ "2 Bedrooms" claim for Family Room (misleading)

**Amenity standardization across property:**
- **Shared amenities:** Outdoor pool, free parking, 24/7 security, braai area, restaurant, conference facilities
- **Standard in all rooms:** **Mini fridge**, WiFi, air conditioning, TV, mosquito net protection
- **Premium tiers:** Bathrobes (Luxury, Premier), VIP toiletries (Executive, Premier), lounge access (Executive, Premier)
- **Contact-verified:** Address (5544 Valley Street), phones (+264 65 231 177, +264 81 802 4833), check-in 14:00, check-out 11:00

> Partner network requirements are defined once in **§3.2** (do not duplicate here).

### 3.4 Guest folio & in-stay billing

#### In production (folio ledger)

| Concept | Implementation |
|---------|----------------|
| **Folio vs profile** | `guest_profiles` = loyalty & lifetime stats. `booking_charges` = one stay’s running bill (room, F&B, tax, payments). |
| **Room rate** | `bookings.payment_status` + optional `room` charge line (`settled` when room prepaid, `open` when pay on arrival). |
| **Room service** | Only when `booking.status = checked_in`. Creates `restaurant_orders` (`order_type = room_service`) + open `fnb` folio line. |
| **Settlement** | `POST /api/guest/stays/[bookingId]/settle` — cash live; card via **Adumo Virtual** (`/api/payments/virtual/initiate` → hosted page → `/payment/success` + webhook) when `ADUMO_JWT_SECRET` configured. Sets `bookings.folio_closed_at`. |
| **Room QR** | `GET /api/public/room-qr/[code]` resolves active checked-in booking for the room. |

Migration: `database/drizzle/0009_booking_charges_folio.sql`.  
Code: `lib/services/folio/FolioService.ts`, `app/api/guest/stays/[bookingId]/*`, `app/api/public/room-qr/[code]/route.ts`.

#### Architecture options (decisions)

| Decision | Option A | Option B | **Recommendation** |
|----------|----------|----------|-------------------|
| **Stay ledger** | Dedicated `booking_charges` table (room, fnb, tax, payment lines) | Extend `restaurant_orders` only (`payment_status`, `charged_to_room`) | **Option A (chosen).** Supports minibar, laundry, adjustments, and room-rate lines without overloading F&B schema. `restaurant_orders` remains kitchen/ops; folio is accounting. |
| **Room payment vs incidentals** | Single `bookings.payment_status` | Split ledger: `room` line settled at check-in; `fnb` open until checkout | **Split ledger.** `payment_status` = room deposit/prepay flag; `booking_charges` tracks what is still owed at checkout. |
| **When to pay incidentals** | Checkout only | Any time during stay (partial or full `settle`) + final checkout | **Both.** Partial and full settlement via `booking_charges` payment lines; folio closes when balance reaches zero. |
| **Room service auth** | Trust guest login + `bookingId` in URL | Room QR → resolve booking + session must match guest email | **QR + session.** Public QR returns `bookingId`; order API enforces guest email match and `checked_in`. |
| **Loyalty** | Accrue on folio settlement | Accrue per order / per night | **On folio settlement** (and proportional on partial pay). Redemption via `POST /api/guest/loyalty/redeem`. |
| **Card settlement** | Reuse `POST /api/payments/initiate` + link to `bookingId` | New thin wrapper on `FolioService.settleFolio` | **Wrapper.** Keep PSD-12 path in existing payment routes; folio service records `payment` line + transaction after gateway success. |

#### Deployment verification (Neon production)

P0 folio capabilities are **implemented in codebase** (see **In production** above). After each deploy, confirm they are **applied on Neon production** (migrations + smoke), not only present in git.

| Verify | Capability | Evidence in repo | Operator check (Neon / prod) |
|--------|------------|------------------|------------------------------|
| ☐ | Migration `0009` + RLS `0010` | `database/drizzle/0009_booking_charges_folio.sql`, `0010_booking_charges_rls.sql` | `\d booking_charges`; RLS enabled; hub tenant policies active |
| ☐ | Guest stay UI + APIs | `app/guest/**`, `app/api/guest/stays/**` | Guest login → `/guest/stays` → folio, order, settle (cash/card) |
| ☐ | Staff folio on booking detail | `components/features/bookings/BookingFolioSection.tsx` | Hub booking detail → cash/card settle, line items, balance |
| ☐ | Room QR + folio hook | `app/api/public/room-qr/[code]`, `BookingService` room charge line | Scan room QR → resolves checked-in booking; room service posts to folio |
| ☐ | Loyalty redeem + accrual | `POST /api/guest/loyalty/redeem`, `FolioService` | Points on settlement; redeem adjusts folio |
| ☐ | Sofia folio context | `SofiaConciergeService` | Active stay balance surfaced in concierge chat |
| ☐ | Checkout folio guard | `bookingLifecycleSideEffects.ts` | Check-out with open balance logs/warns |
| ☐ | Partner isolation | `proxy.ts` `HUB_ONLY_API_PREFIXES` | Partner tenant **403** on `/api/guest/stays/*`, `/api/guest/loyalty/*` |

#### Folio backlog (true gaps only)

| Priority | Item | Notes |
|----------|------|-------|
| **P2** | Optional `tax` charge lines on folio | Phase 2 — NamRA split streams (see payment timing table) |
| **P2** | Open-banking PIS (NamQR pay initiation) | NamQR **desk QR + manual EFT record** live; bank PIS not in scope yet |

#### Payment timing (product rules)

| Charge type | Typical payment moment | System behaviour |
|-------------|------------------------|------------------|
| **Room** | Before stay or at check-in | `bookings.payment_status = paid` → `room` charge `settled`; else `open` until front desk cash PATCH |
| **F&B / room service** | During stay or at checkout | Open `fnb` lines; guest or staff calls `settle` |
| **Tax / fees** | At settlement | **Two VAT streams:** (1) **Hotel Etuna** — NamRA returns on guest room/F&B; `/reports/property-vat`, `/reports/accounting` (P&L, trial balance, journal from folio). (2) **Buffr** — VAT on platform invoices only; input VAT on Client books. Optional `tax` charge lines — Phase 2 |
| **Loyalty** | After settlement | Points += `floor(amount/10)` on `guest_profiles` (tunable in `FolioService`) |

#### API contract (guest stay)

| Method | Path | Auth | Body / response |
|--------|------|------|-----------------|
| GET | `/api/public/room-qr/[code]` | Public | **200:** `{ data: { bookingId, roomNumber, orderApiPath, folioApiPath } }` |
| GET | `/api/guest/stays/[bookingId]/folio` | Guest (email match) or hub staff | **200:** `{ data: { openChargesTotal, lines[], folioClosedAt, ... } }` |
| POST | `/api/guest/stays/[bookingId]/orders` | Same | **Body:** `{ items: [{ menuItemId, quantity }], roomNumber?, specialInstructions? }` — **201:** order + folio line |
| POST | `/api/guest/stays/[bookingId]/settle` | Same | **Body:** `{ paymentMethod: "cash" \| "card", amountPaid? }` — **200:** `{ outstanding, transactionReference, pointsEarned }` |

Errors: `400` not checked in / invalid amount; `403` wrong guest; `404` booking/QR invalid; `402` card payment failed.

Technical detail and file map: `docs/project/PLANNING.md` § Guest folio architecture.

### 3.5 Payment rails (Namibia — Adumo Virtual + cash)

Hotel Etuna uses **Namibia NPS-aligned rails** (no Stripe). **Card payments** use **Adumo Online Virtual** (hosted payment page) only — guests never enter PAN on `hoteletuna.com` (**SAQ A** posture). **RealPay is out of scope** (no partner payouts or debit-order collections in product).

| Rail | Direction | Use | Status |
|------|-----------|-----|--------|
| **Adumo Virtual** | Inbound (card) | Booking deposit, folio card settle | **Live** (when `ADUMO_*` configured) |
| **Cash + reconciliation** | Inbound | Front desk, shift close | **Live** |
| **NamQR / EFT / open banking** | Inbound | Desk QR, manual EFT, future PIS | **NamQR desk + manual record live**; open banking PIS planned |

#### 3.5.1 Adumo Virtual (hosted payment page)

**Flow:** App creates JWT + `payment_sessions` row → browser **form POST** to Adumo → guest pays on Adumo page → redirect to `RedirectSuccessfulURL` / `RedirectFailedURL` with `_RESPONSE_TOKEN` → confirm via API + optional **webhook** (`notificationURL` in JWT).

| Step | Adumo | Hotel Etuna |
|------|-------|-------------|
| Initialise | `POST …/product/payment/v1/initialisevirtual` | `POST /api/payments/virtual/initiate` (alias: `/api/payments/adumo/initiate`) |
| Pay | Hosted page (3DS on Adumo) | `components/payments/AdumoVirtualPaymentForm.tsx` |
| Return | Query: `_RESULT`, `_RESPONSE_TOKEN`, `_MERCHANTREFERENCE`, `_TRANSACTIONINDEX` | `/payment/success`, `/payment/failed` → `AdumoPaymentReturn` |
| Confirm | Validate JWT (`mref`, `amount`, `cuid`, `auid`, `result`) | `POST /api/payments/virtual/confirm` |
| Webhook | Async notification | `POST /api/webhooks/adumo` |

**Purposes:** `booking_deposit` (updates `bookings.payment_status`, `transactions`, `booking_charges` payment line) · `folio_settle` (calls `FolioService.settleFolio` with `gatewayTransactionId`).

**Env (test):** `ADUMO_BASE_URL=https://staging-apiv3.adumoonline.com`, `ADUMO_MERCHANT_UID`, `ADUMO_APPLICATION_UID`, `ADUMO_JWT_SECRET`, `ADUMO_REDIRECT_SUCCESS_URL`, `ADUMO_REDIRECT_FAIL_URL`, `ADUMO_WEBHOOK_URL`. Test Merchant UID / JWT secret per Adumo Virtual docs; 3DS Application UID `23ADADC0-DA2D-4DAC-A128-4845A5D71293`.

**Code:** `lib/config/adumo.ts`, `lib/services/payment/AdumoVirtualService.ts`, `lib/services/payment/completeAdumoVirtualPayment.ts`, `payment_sessions` table (`database/drizzle/0012_adumo_virtual_payment_sessions.sql`).

**Deprecated:** `AdumoEnterpriseService` (server-posted PAN) — not used for guest checkout.

#### 3.5.2 Flow matrix

| Flow | Cash | Adumo Virtual |
|------|------|----------------|
| Booking deposit | `PATCH /api/bookings/[id]/payment` | `AdumoVirtualPaymentForm` + `booking_deposit` |
| Folio settle | `POST …/settle` `paymentMethod: cash` | Initiate virtual → confirm → `folio_settle` |
| Reconciliation | `/payments/reconciliation` | — |
| NamQR desk | `/payments/desk` (sidebar **Payments desk**) | `POST /api/payments/namqr/generate` + `confirm` |
| Manual EFT / e-wallet / bank deposit | `/payments/desk` (right panel) | `POST /api/payments/manual` — **not** NamQR (use generate/confirm) |
| Cash reconciliation | `/payments/reconciliation` (sidebar) | Booking-level cash by check-in date only — excludes NamQR/EFT/manual folio |

**NamQR v5.0 (BoN May 2025):** Regulatory source `mba-agent/documents/mba-agent/regulatory/namibia/namibia_qr_code_standards.md`. Compliance: `lib/compliance/namqr/standards.ts`, `lib/compliance/namqr/nrtc-payload.ts` (tag **17** NRTC — desk QR). Tag **26** / IPP: `encodeNamQrPayloadV5` in `lib/services/qr/namqr-core.ts`. Desk flow: `HospitalityNamQrPaymentService` → `NamQRService`; folio confirm via `settleOffPlatformFolio.ts` → `FolioService` (same path as `POST /api/payments/manual` with `applyToFolio`). APIs: `POST /api/payments/namqr/generate`, `POST /api/payments/namqr/confirm`. UI: `/payments/desk`. Settlement: Nedbank `11000481744` (`lib/platform/settlement-accounts.ts`).

**Rail priority:** P0 cash + Adumo Virtual; **P1 NamQR desk (live)**; **P2 manual EFT / e-wallet record (live)**; P3 open banking PIS.

#### 3.5.3 Platform commercial model (Buffr ↔ Hotel Etuna)

Hotel Etuna runs on **Buffr Financial Services** infrastructure. Money and contracts split into two legal roles — do not conflate them in code, copy, or reconciliation.

| Role | Legal entity | Responsibility |
|------|----------------|----------------|
| **Platform operator** | Buffr Financial Services CC | Hosts the app; **Adumo merchant of record** (applies, pays Adumo acquirer fees); monthly **platform invoice** to the property |
| **Property operator** | Etuna Guesthouse and Tours CC | **Guest revenue** (room, F&B, incidentals); bank account for guest collections; pays Buffr subscription + processing/service fees |

**Registered settlement accounts (Namibia):**

| Party | Bank | Account name | Account no. | Branch / Swift |
|-------|------|--------------|-------------|----------------|
| **Hotel Etuna (guest collections)** | Nedbank Namibia | ETUNA GUESTHOUSE AND TOURS CC | 11000481744 | 461089 / NEDSNANX |
| **Buffr (platform billing)** | Bank Windhoek | BUFFR FINANCIAL SERVICES CC | 8050377860 | 485-673 / BWLINANX |

Store these in **tenant/property settlement profile** (admin-only), not in guest-facing env vars. Adumo `ADUMO_*` credentials belong to **Buffr’s** Adumo application; settlement routing to Hotel Etuna’s Nedbank account is configured with Adumo (see phases below).

**Money flows (target state):**

```mermaid
flowchart LR
  Guest[Guest]
  Adumo[Adumo Virtual]
  EtunaBank[Hotel Etuna Nedbank]
  BuffrBank[Buffr Bank Windhoek]
  PMS[Hotel Etuna PMS]

  Guest -->|cash at desk| PMS
  Guest -->|card deposit / folio| Adumo
  Adumo -->|settlement T+?| EtunaBank
  PMS -->|monthly invoice EFT| BuffrBank
```

| Stream | Who receives funds | Buffr charges |
|--------|----------------------|---------------|
| Cash | Hotel Etuna (front desk) | None on the rail; optional reporting only |
| Card (Adumo) | **Hotel Etuna** (target) | **Processing fee** on settled card volume (accrue from `transactions`; invoice monthly) |
| NamQR / EFT (future) | Hotel Etuna (QR / reference uses property account) | Optional per-tx or flat service fee |
| Platform subscription | Buffr | Fixed monthly (`tenants.monthly_price` / fee schedule) |
| Adumo acquirer cost | Buffr pays Adumo | Cost to Buffr; may be **marked up** inside processing fee (commercial policy) |

**Guest-facing rule:** Receipts and payment UI state that **room and stay charges are for Hotel Etuna**; card processing is “secure payment” — not “paid to Buffr” unless legally required on the Adumo page.

**Implementation phases:**

| Phase | Card settlement | Platform billing |
|-------|-------------------|------------------|
| **P0 (now)** | Buffr Adumo merchant; `payment_sessions` + `transactions` tag `bookingId` / `tenant_id`; property bank on file for EFT/NamQR copy | Manual monthly invoice from reports; `tenants.subscription_*` fields |
| **P1** | Adumo portal: **settlement account** = Hotel Etuna Nedbank OR sub-merchant for Etuna; webhook still hits Buffr app | **Implemented:** `0013_platform_billing.sql`, `PlatformBillingService`, `/payments/platform-billing`, accrual on Adumo confirm |
| **P2** | Auto reconciliation: Adumo settlement file vs `transactions` | Issued invoices, PDF, mark-paid, Buffr admin dashboard |

**Ledger rules (application logic):**

1. **Guest payment** (`transactions` type `booking_payment` / folio settle): `beneficiary = property`, `tenant_id` = Hotel Etuna hub tenant; never post guest room revenue as Buffr income.
2. **Platform fee**: On Adumo confirm (or nightly job), compute `platform_fee_amount` from tenant fee schedule; store on `transactions` or `platform_fee_accruals` — **do not reduce** guest-paid amount on the guest receipt.
3. **Monthly invoice** (`platform_invoices`): Lines = subscription + sum(processing fees) + optional line items; **payment due to Buffr Bank Windhoek**; separate from guest Adumo flow.
4. **`payment_sessions`**: Add `beneficiary` (`property` \| `platform`) default `property`; Adumo JWT metadata may include property reference for support.

**Schema (P1 live):** `settlement_accounts`, `platform_fee_schedules`, `platform_invoices`, `platform_invoice_lines`, `platform_fee_accruals` — migration `database/drizzle/0013_platform_billing.sql`. API: `/api/platform/billing/*`. UI: `/payments/platform-billing`.

**Out of scope:** Buffr using guest card proceeds to net-settle its invoice without explicit property consent and audit trail; RealPay payouts.

See `docs/project/PLANNING.md` § Payment strategy → Platform commercial model.

**Commercial legal draft (Proposal & SLA):** `docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md` (v1.3) — Buffr ↔ Etuna; **§4.5 dual VAT** (Etuna property NamRA reporting + Buffr platform invoices); **§8.7 tax**; UI `/reports/property-vat`; code: `lib/platform/namibia-tax.ts`, `PropertyVatService`.

---

## 4. Technical Stack & Infrastructure

### 4.1 Core Technologies

|| Category | Technology | Version/Notes |
||----------|------------|---------------|
| **Frontend** | Next.js | 16 (App Router) | React Server Components, streaming, ISR |
| **UI Framework** | React | 18 | Server + Client Components |
| **Language** | TypeScript | Strict mode | Zero compilation errors enforced |
| **Styling** | Tailwind CSS | 3.x | Custom Hotel Etuna theme (`hoteletuna`) |
| **Component Library** | DaisyUI | Latest | Pre-themed with nude/khaki/terracotta palette |
| **Backend** | Next.js API Routes | — | Serverless functions on Vercel |
| **Database** | Neon | Serverless Postgres | Connection pooling for serverless |
| **ORM** | Drizzle ORM | Latest | Type-safe queries, migrations in `database/drizzle/` |
| **Vector DB** | Qdrant | Cloud/Self-hosted | Sofia AI knowledge base (`sofia_knowledge` collection) |
| **Authentication** | Stack Auth + NextAuth.js | — | Stack Auth primary, NextAuth fallback |
| **AI/LLM** | Multi-provider | — | DeepSeek → Anthropic → Groq (fallback chain) |
| **Embeddings** | OpenAI | `text-embedding-3-small` | 1536 dimensions, batch processing |
| **Email** | Nodemailer | — | Namecheap PrivateEmail SMTP |
| **Deployment** | Vercel | — | Auto-deploy from `main` branch |
| **Domain** | `hoteletuna.com` | — | Vercel DNS, SSL auto-provisioned |

### 4.2 Database schema (authoritative)

**Source of truth:** `lib/db/schema.ts` (Drizzle ORM, Neon PostgreSQL).  
**Migrations:** `database/drizzle/0000`–`0010`.  
**Legacy (do not use for schema):** `lib/db/database.types.ts` (Supabase snapshot; missing `booking_charges`, AML, fraud, KYC, CRM, etc.).

| Metric | Value |
|--------|-------|
| Tables | **81** |
| PostgreSQL enums (`pgEnum`) | **22** (several operational columns remain `varchar`) |
| RLS policies | Auto on all tables with `tenant_id` + special policies (see below) |
| Views / triggers | None in migrations |

**Regenerate types:** use Drizzle `$inferSelect` / `drizzle-kit`; not `database.types.ts`.

#### 4.2.1 Session variables (RLS)

| Setting | Purpose |
|---------|---------|
| `app.tenant_id` | Active tenant UUID for row filter |
| `app.tenant_type` | `hub` \| `partner` — hub bypasses tenant_id filter on tenant-scoped tables |

**Default policy (`tenant_access_<table>`):** row visible if `tenant_id = app.tenant_id` **OR** `app.tenant_type = 'hub'`.

**Special policies:**

| Table | Rule |
|-------|------|
| `tenants` | Row `id` matches session tenant OR hub |
| `partner_invites` | **Hub only** (`hub_only_partner_invites`) |
| `cash_reconciliations`, `booking_charges` | Dedicated hub/partner policy (migrations `0008`, `0010`) |

**Tables without `tenant_id`:** isolated via parent FKs + app queries — e.g. `user_sessions`, `two_factor_auth`, `partner_invites`, `property_settings`, `rooms`, `room_rates`, `room_qr_codes`, `booking_rooms`, `menu_categories`, `restaurant_order_items`, `ai_messages`, `ob_participants` (global registry).

#### 4.2.2 Enums (PostgreSQL)

| Enum | Values | Used on |
|------|--------|---------|
| `tenant_type` | hub, partner | `tenants.type` |
| `booking_charge_type` | room, fnb, tax, adjustment, payment | `booking_charges.charge_type` |
| `booking_charge_status` | open, settled, refunded | `booking_charges.status` |
| `kyc_tier` | lite_kyc_*, full_kyc_*, none | `kyc_profiles`, `transaction_limits`, `kyc_upgrade_prompts` |
| `kyc_status` | pending, in_review, approved, rejected, expired, suspended | `kyc_profiles.kyc_status` |
| `kyc_document_type` | national_id, passport, … | `kyc_documents.document_type` |
| `transaction_limit_type` | daily, monthly, per_transaction | `transaction_limits.limit_type` |
| Others | aml_*, room_status, booking_status, loyalty_tier, order_*, ai_* | Defined in schema; many columns still `varchar` for flexibility |

#### 4.2.3 CHECK constraints

| Table | Rule |
|-------|------|
| `tenants` | `commission_percent` 0–100; hub has no parent; partner requires `parent_tenant_id` |
| `bookings` | `commission_amount IS NULL OR >= 0` |

#### 4.2.4 Table inventory by domain

**Core — tenancy & auth (6)**  
`tenants`, `users`, `user_sessions`, `two_factor_auth`, `system_settings`, `partner_invites`

**Property & inventory (6)**  
`properties`, `tenant_whatsapp_settings`, `property_settings`, `rooms`, `room_rates`, `room_qr_codes`

**Bookings & folio (5)**  
`guests`, `bookings`, `booking_rooms`, `booking_charges`, `cash_reconciliations`

**Payments (4)**  
`payment_methods`, `transactions`, `trust_accounts`, `trust_accounts_psd3`

**Staff & compliance workflows (4)**  
`staff`, `staff_shifts`, `compliance_verification_cases`, `compliance_verification_documents`

**Restaurant / F&B (6)**  
`restaurants`, `menu_categories`, `cms_menu_items`, `restaurant_tables`, `restaurant_orders`, `restaurant_order_items`

**CRM & loyalty (6)**  
`guest_profiles`, `guest_reviews`, `crm_graph_edges`, `crm_guest_memory_facts`, `crm_outreach_touches`, `crm_consent_events`

**Sofia AI & CMS (9)**  
`ai_conversations`, `ai_messages`, `sofia_email_logs`, `sofia_incoming_emails`, `sofia_email_threads`, `sofia_email_inbox_config`, `sofia_voice_sessions`, `cms_content`, `cms_media`

**Audit, support, logs (4)**  
`audit_trail`, `system_logs`, `support_tickets`, `support_ticket_replies`

**Open banking & NamQR (5)**  
`ob_participants`, `ob_consent_tokens`, `ob_api_transactions`, `namqr_codes`, `consumer_rights_requests`, `cybersecurity_incidents`

**AML/CFT (9)**  
`aml_pep_database`, `aml_guest_pep_flags`, `aml_transaction_alerts`, `aml_monitoring_rules`, `aml_suspicious_transaction_reports`, `aml_due_diligence_records`, `aml_transaction_velocity`, `aml_geographic_patterns`

**Fraud (6)**  
`fraud_risk_profiles`, `fraud_device_fingerprints`, `fraud_alerts`, `fraud_detection_rules`, `fraud_cases`, `fraud_statistics`

**KYC & limits (6)**  
`kyc_profiles`, `kyc_documents`, `transaction_limits`, `daily_transaction_tracking`, `monthly_balance_tracking`, `kyc_upgrade_prompts`

**PSD / BoN / retention (5)**  
`payment_security_audit`, `bon_incident_reports`, `electronic_signatures`, `payment_performance_metrics`, `record_retention_audit`

#### 4.2.5 Core table columns (reference)

<details>
<summary><strong>tenants</strong> — hub/partner tree</summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar(255) NN | |
| type | tenant_type NN | default `hub` |
| parent_tenant_id | uuid FK → tenants | partner only |
| commission_percent | numeric(5,2) | default 10.00 |
| subdomain, domain, status, subscription_* | varchar | |
| created_at, updated_at | timestamptz | |

</details>

<details>
<summary><strong>users</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| email | varchar(255) NN UQ | |
| password_hash | varchar(255) NN | |
| role | varchar(50) | default `user` |
| is_platform_admin | boolean | |
| email_verified, OTP fields | | registration flow |

</details>

<details>
<summary><strong>properties</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | |
| slug | varchar UQ | public URLs |
| name, type, address, city, country | | country default Namibia |
| currency | varchar(3) | default NAD |
| check_in_time, check_out_time | time | 14:00 / 11:00 |
| amenities, images | text[] | |
| has_restaurant_features, is_enterprise | boolean | |

</details>

<details>
<summary><strong>guests</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | |
| email | varchar NN UQ | |
| first_name, last_name, phone | | |
| marketing_consent, is_signed_up | boolean | |
| preferences | jsonb | |

</details>

<details>
<summary><strong>bookings</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id, property_id, guest_id | uuid FK | |
| booking_reference | varchar UQ | |
| status | varchar | pending → checked_out |
| check_in_date, check_out_date | date NN | |
| total_amount | numeric(10,2) NN | |
| commission_amount | numeric(12,2) | partner bookings |
| payment_status, payment_method | varchar | cash/card |
| folio_closed_at | timestamptz | closes folio (0009) |
| amount_tendered, change_given, receipt_number | | cash (0007) |

</details>

<details>
<summary><strong>booking_charges</strong> (folio ledger)</summary>

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id, booking_id | uuid FK NN | |
| charge_type | booking_charge_type | room, fnb, tax, adjustment, payment |
| description | text NN | |
| amount | numeric(12,2) NN | |
| status | booking_charge_status | open, settled, refunded |
| reference_id | uuid | optional link to order/txn |
| created_by | uuid FK → users | |
| settled_at | timestamptz | |

</details>

<details>
<summary><strong>guest_profiles</strong> (loyalty — not folio)</summary>

| Column | Type | Notes |
|--------|------|-------|
| guest_id | uuid FK UQ per tenant | |
| loyalty_tier, loyalty_points | | bronze default |
| total_spent, booking_count | | |
| marketing_consent | boolean | |

</details>

*Full column definitions for all 81 tables: `lib/db/schema.ts`. AML/fraud/KYC tables are 15–25 columns each with jsonb audit fields.*

#### 4.2.6 Foreign-key hub (text)

```
tenants ──┬── users, system_settings, properties, guests, bookings, staff, CRM, AML, fraud, KYC
          ├── partner_invites → users
          └── parent_tenant_id → tenants (hub/partner tree)

properties ── rooms ── room_rates, room_qr_codes
          └── restaurants ── menu_categories ── cms_menu_items
                           └── restaurant_tables, restaurant_orders ── restaurant_order_items

guests ── bookings ── booking_rooms, booking_charges, transactions
      └── guest_profiles, guest_reviews, kyc_profiles, payment_methods, CRM tables

ai_conversations ── ai_messages
support_tickets ── support_ticket_replies
compliance_verification_cases ── compliance_verification_documents
ob_participants ← ob_consent_tokens ← ob_api_transactions
```

#### 4.2.7 Migration chronology

| Migration | Change |
|-----------|--------|
| 0000 | Baseline (~74 tables) |
| 0001 | `restaurant_order_items` |
| 0002 | `crm_consent_events` |
| 0003 | Partner network: `tenant_type`, `partner_invites`, `bookings.commission_amount` |
| 0004–0006 | Tenant RLS; hub bypass via `app.tenant_type` |
| 0007–0008 | Cash payments; `cash_reconciliations` |
| 0009–0010 | `booking_charges`, `folio_closed_at`, folio RLS |
| 0011 | F&B inventory SKUs, stock levels, low-stock alerts (`database/drizzle/0011_fnb_inventory.sql`) |
| 0012 | Adumo Virtual `payment_sessions` |
| 0013–0014 | Platform billing + invoice VAT |

*Drizzle journal may only list 0000–0002; 0003–0014 applied via Neon/psql.*

### 4.3 API Architecture


#### 4.3.1 Auth legend (API mapping)

| Label | Meaning |
|-------|---------|
| **Public** | No session; whitelisted in `proxy.ts` |
| **Session** | Stack Auth / NextAuth via `withApiAuth` |
| **Role** | Session + owner \| manager \| admin |
| **Platform admin** | `isPlatformAdmin()` |
| **Cron** | `Authorization: Bearer $CRON_SECRET` |
| **Webhook** | Provider signature / verify token |
| **2FA header** | `x-2fa-verified: true` for payment initiate/complete |
| **Open API** | Handler trusts body/query `tenantId` (sensitive) |

**External stores:** Qdrant (RAG), Mem0 (CRM memory), Adumo (payments), Stack Auth, SMTP.

**Route count:** **136** handlers under `app/api/**/route.ts` (`find app/api -name route.ts | wc -l`, verified May 16, 2026).

**Endpoint categories:**

|| Category | Routes | Auth | Tenant Scope |
||----------|--------|------|--------------|
| **Hub-only AI/CRM** | `/api/sofia/*`, `/api/ai/*`, `/api/crm/*` | Required | Hub tenant only (403 for partners) |
| **Partner Management** | `/api/admin/partners/*` | Required (admin) | Hub tenant only |
| **Shared Booking** | `/api/bookings/*` | Required | Tenant-scoped RLS |
| **Shared Property** | `/api/properties/*` | Optional | Tenant-scoped RLS |
| **Public Partner** | `/api/partners`, `/api/partners/[slug]` | None | Public, filtered by `status=active` |
| **Public Menu** | `/api/public/menu` | None | Public |
| **Guest Stay** | `/api/guest/stays/[bookingId]/*` | Required | Guest email + booking match |
| **Room QR** | `/api/public/room-qr/[code]` | None | Public, returns booking ID if checked-in |

**Middleware protection:**
- Tenant isolation enforced via root `proxy.ts` (Next.js 16 network boundary; replaces legacy `middleware.ts`)
- Hub-only routes return 403 for partners
- Public routes whitelisted
- Session validation via Stack Auth / NextAuth

#### 4.3.2 REST API conventions (system design)

Aligned with **`SYSTEM_DESIGN_MASTER_GUIDE.md`** (repo root, Part 3). Hotel Etuna applies:

| Rule | Hotel Etuna application |
|------|-------------------------|
| **Resource nouns, plural paths** | `/api/bookings`, `/api/partners`, `/api/crm/reviews` — no verb paths |
| **HTTP semantics** | `GET` read-only (idempotent); `POST` create; `PATCH` partial update; `DELETE` remove |
| **Status codes** | `200/201/204` success; `400` validation; `401` unauthenticated; `403` forbidden (tenant/role); `404` missing; `429` rate limit; `500` server (no stack traces to client) |
| **Stateless requests** | Session/JWT + `tenant_id` on every protected route; no server-side sticky sessions beyond auth cookie |
| **Nested resources** | `/api/guest/stays/[bookingId]/folio`, `/api/bookings/[id]/payment` |
| **Pagination / filters** | List endpoints support `limit`, `offset` or date filters where volume grows (reviews, bookings, reconciliation) |
| **Consistency** | Single error JSON shape via API middleware; auth via `withApiAuth` / `proxy.ts` — not per-route copy-paste |
| **Security on every route** | Auth + tenant scope + rate limits on sensitive paths (see §6.2) |
| **GET must not mutate** | Booking state changes only via `POST`/`PATCH`/`PUT` |

**Protocol choices (out of scope unless product changes):** GraphQL and gRPC are not used; public site and admin use REST over HTTPS. Sofia chat may use streaming later; today it is request/response JSON.

### 4.4 Knowledge Base (Sofia AI)

**Documents ingested:**
1. `hotel-etuna-facts.md` — Core property info, contact, amenities
2. `room-descriptions.md` — All 5 room types with amenities
3. `restaurant-menu.md` — Full menu with prices
4. `local-area.md` — Location, transport, local tips

> **Removed (v2.7.2):** `tours-guide.md` — delete from repo and **re-run ingestion** so Qdrant does not serve stale tour chunks.

**Processing pipeline:**
```
Markdown files → Semantic chunking (~800 chars, 100-char overlap)
→ OpenAI embeddings (text-embedding-3-small, 1536d)
→ Qdrant upsert (collection: sofia_knowledge, tenant_id filter)
```

**Ingestion stats:**
- **Total documents:** 4
- **Chunks generated:** ~9
- **Embeddings:** ~9 vectors
- **Storage:** ~14 KB in Qdrant
- **Ingestion time:** ~15-30 seconds
- **Script:** `scripts/ingest-hotel-etuna-knowledge.ts`

**RAG search flow:**
1. User asks Sofia a question
2. Question → OpenAI embedding
3. Qdrant vector search (top 5 chunks, cosine similarity)
4. LLM prompt construction (context + question)
5. Multi-provider LLM generates answer (DeepSeek → Anthropic → Groq)

### 4.5 Environment Variables Required

**Critical for production:**
```bash
# Hub Identification
HUB_TENANT_ID=<uuid>
DEFAULT_PROPERTY_ID=<uuid>

# Database
DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
DATABASE_URL_UNPOOLED=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb

# Qdrant (Sofia AI)
QDRANT_URL=https://xxx.cloud.qdrant.io:6333
QDRANT_API_KEY=<api-key>

# OpenAI (Embeddings + LLM)
OPENAI_API_KEY=sk-...

# Authentication
NEXT_PUBLIC_STACK_PROJECT_ID=<stack-project-id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<stack-key>
STACK_SECRET_SERVER_KEY=<stack-secret>

# SMTP (Email automation)
SMTP_HOST=mail.privateemail.com
SMTP_USER=concierge@hoteletuna.com
SMTP_PASS=<smtp-password>

# NextAuth fallback
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://hoteletuna.com
```

**Payment gateways (Namibia):** Adumo Virtual only — see `.env.example` (`ADUMO_JWT_SECRET`, `ADUMO_WEBHOOK_URL`, redirect URLs).

**Optional providers:**
- `ANTHROPIC_API_KEY` (Claude fallback)
- `GROQ_API_KEY` (Groq fallback)
- `DEEPSEEK_API_KEY` (Primary LLM)

### 4.6 Repository structure

Generated from project root (`hotel-etuna/`) with:

```bash
tree -I 'node_modules|.next|.git|coverage|playwright-report|test-results' -L 3 --dirsfirst -F --charset ascii
```

**Excluded:** `node_modules`, `.next`, `.git`, `coverage`, `playwright-report`, `test-results`, build artifacts. **Depth:** 3. **Counts at generation:** 193 directories, 283 files.

#### Top-level map

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router — public marketing, auth, guest hub, partner portal, dashboard, API routes |
| `components/` | React UI — `features/` by domain, `ui/` primitives, `shared/` chrome, `brand/`, `sections/landing/` |
| `lib/` | Server/client logic — `db/`, `services/`, `auth/`, `copy/`, `integrations/`, `utils/`, `types/` |
| `database/drizzle/` | SQL migrations (`0000`–`0010`) + Drizzle meta |
| `data/hotel-etuna-knowledge/` | Sofia RAG source markdown (**4 files** — no `tours-guide.md`) |
| `docs/project/` | **Canonical docs:** `PRD.md`, `PLANNING.md`, `TASK.md` |
| `docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md` | Full brand & market strategy |
| `public/` | Static assets — `brand/`, `images/`, PWA `manifest.json`, `sw.js` |
| `scripts/` | Seeds, ingestion, verification, dev cache (`clean-dev-cache.mjs`) |
| `tests/` | Vitest — `integration/`, `sofia/`, `workflows/`, `api/`, `unit/` |
| `e2e/` | Playwright specs |
| `proxy.ts` | Auth, RBAC, rate limit, tenant routing (Next.js 16 network boundary) |
| `lib/auth/middleware.ts` | Auth helpers used by `proxy.ts` (not the root boundary file) |

#### `app/` route groups (depth 1)

| Group / area | Routes | Audience |
|--------------|--------|----------|
| `(auth)/` | `login`, `register`, `forgot-password`, `reset-password`, `verify-email` | Guests & staff sign-in |
| Public pages | `/`, `/about`, `/contact`, `/dining`, `/rooms`, `/rooms/[slug]` | Marketing |
| `guest/` | `/guest`, `/guest/stays/[bookingId]`, `/guest/room` | Checked-in guest folio & room service |
| `partners/`, `public-properties/` | Partner directory & legacy public property URLs | Referral network |
| `partner/` | Partner self-service dashboard | Partner tenants |
| `(dashboard)/` | PMS, CRM, restaurant, compliance, Sofia, admin platform | Hub staff |
| `api/` | REST handlers (`bookings`, `crm`, `guest`, `payments`, `sofia`, …) | Clients & integrations |
| `legal/` | Privacy, terms, cookies, security | Compliance pages |

#### `lib/services/` (domain services)

| Folder | Responsibility |
|--------|------------------|
| `ai/`, `sofia/` | LLM router, Sofia concierge, email, voice |
| `booking/`, `folio/` | Reservations, stay folio, room charges, loyalty hooks |
| `crm/` | Guests, outreach, graph memory, consent |
| `restaurant/`, `menu/` | F&B orders, tables, QR |
| `property/`, `room/` | Properties, rooms, availability |
| `payment/`, `openbanking/` | Adumo, NAM QR, initiation |
| `compliance/`, `fraud/`, `security/` | KYC/KYB, AML, 2FA, incidents |
| `cms/`, `documents/` | Content, RAG ingest, e-sign |
| `analytics/`, `platform/` | Dashboard stats, support tickets |

#### Full tree (depth 3)

```
./
|-- app/
|   |-- (auth)/
|   |   |-- forgot-password/
|   |   |-- login/
|   |   |-- register/
|   |   |-- reset-password/
|   |   `-- verify-email/
|   |-- (dashboard)/
|   |   |-- admin/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- bookings/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- dashboard/
|   |   |-- design-system-demo/
|   |   |-- fraud/
|   |   |-- menu/
|   |   |-- payments/
|   |   |-- profile/
|   |   |-- properties/
|   |   |-- restaurant/
|   |   |-- settings/
|   |   |-- sofia/
|   |   |-- staff/
|   |   |-- error.tsx
|   |   |-- layout.tsx
|   |   `-- not-found.tsx
|   |-- (partner)/
|   |   `-- dashboard/
|   |-- about/
|   |   `-- page.tsx
|   |-- api/
|   |   |-- admin/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- auth/
|   |   |-- bon/
|   |   |-- bookings/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- cron/
|   |   |-- dashboard/
|   |   |-- debug/
|   |   |-- documents/
|   |   |-- fraud/
|   |   |-- guest/
|   |   |-- guests/
|   |   |-- menu/
|   |   |-- partners/
|   |   |-- payments/
|   |   |-- properties/
|   |   |-- public/
|   |   |-- qr/
|   |   |-- restaurant/
|   |   |-- rooms/
|   |   |-- settings/
|   |   |-- sofia/
|   |   |-- staff/
|   |   |-- support/
|   |   |-- user/
|   |   `-- webhooks/
|   |-- contact/
|   |   `-- page.tsx
|   |-- dining/
|   |   `-- page.tsx
|   |-- guest/
|   |   |-- room/
|   |   |-- stays/
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- handler/
|   |   `-- [...stack]/
|   |-- legal/
|   |   |-- cookies/
|   |   |-- privacy/
|   |   |-- security/
|   |   `-- terms/
|   |-- offline/
|   |   `-- page.tsx
|   |-- partner/
|   |   |-- bookings/
|   |   |-- dashboard/
|   |   |-- my-property/
|   |   |-- rates/
|   |   |-- rooms/
|   |   |-- settings/
|   |   `-- layout.tsx
|   |-- partners/
|   |   |-- [slug]/
|   |   `-- page.tsx
|   |-- public-properties/
|   |   |-- [slug]/
|   |   `-- search/
|   |-- rooms/
|   |   |-- [slug]/
|   |   `-- page.tsx
|   |   `-- page.tsx
|   |-- unauthorized/
|   |   `-- page.tsx
|   |-- favicon.ico
|   |-- globals.css
|   |-- layout.tsx
|   |-- loading.tsx
|   |-- not-found.tsx
|   |-- page-dynamic.tsx
|   |-- page-static-backup.tsx
|   `-- page.tsx
|-- components/
|   |-- analytics/
|   |   `-- PostHogPageView.tsx
|   |-- brand/
|   |   |-- HotelEtunaLogo.tsx
|   |   `-- HotelEtunaMarkIcon.tsx
|   |-- compliance/
|   |   |-- AMLDashboard.tsx
|   |   |-- AlertDetailModal.tsx
|   |   `-- PEPManagement.tsx
|   |-- features/
|   |   |-- admin/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- auth/
|   |   |-- booking/
|   |   |-- bookings/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- dashboard/
|   |   |-- fraud/
|   |   |-- guest/
|   |   |-- menu/
|   |   |-- property/
|   |   |-- restaurant/
|   |   |-- rooms/
|   |   |-- settings/
|   |   |-- sofia/
|   |   `-- staff/
|   |-- partners/
|   |   `-- PartnerAvailabilityWidget.tsx
|   |-- providers/
|   |   |-- AuthGateProvider.tsx
|   |   |-- OfflineBanner.tsx
|   |   |-- PostHogProvider.tsx
|   |   |-- ServiceWorkerRegistration.tsx
|   |   |-- SessionProviderWrapper.tsx
|   |   |-- SessionTimeoutWrapper.tsx
|   |   `-- StackProviderWrapper.tsx
|   |-- sections/
|   |   `-- landing/
|   |-- shared/
|   |   |-- EmptyState.tsx
|   |   |-- ErrorBoundary.tsx
|   |   |-- ErrorDisplay.tsx
|   |   |-- Footer.tsx
|   |   |-- Header.tsx
|   |   |-- LoadingSpinner.tsx
|   |   |-- MessageAlert.tsx
|   |   |-- NotFoundState.tsx
|   |   |-- NoticeState.tsx
|   |   |-- PageHeader.tsx
|   |   |-- PublicFooter.tsx
|   |   |-- PublicHero.tsx
|   |   |-- Sidebar.tsx
|   |   |-- StatusBadge.tsx
|   |   `-- WorkflowStatusActions.tsx
|   |-- ui/
|   |   |-- Alert.tsx
|   |   |-- Avatar.tsx
|   |   |-- Button.tsx
|   |   |-- Card.tsx
|   |   |-- Form.tsx
|   |   |-- ImagePlaceholder.tsx
|   |   |-- Input.tsx
|   |   |-- Modal.tsx
|   |   |-- PropertyAvatar.tsx
|   |   |-- ScrollProgress.tsx
|   |   |-- Select.tsx
|   |   |-- SofiaAvatar.tsx
|   |   |-- Table.tsx
|   |   |-- Tabs.tsx
|   |   |-- Textarea.tsx
|   |   |-- Toast.tsx
|   |   |-- Toaster.tsx
|   |   |-- index.ts
|   |   `-- use-toast.tsx
|   |-- DashboardErrorBoundary.tsx
|   |-- ErrorBoundary.tsx
|   |-- PlatformToastProvider.tsx
|   |-- ProblemSolutionTabs.tsx
|   `-- RootErrorBoundary.tsx
|-- data/
|   `-- hotel-etuna-knowledge/
|       |-- hotel-etuna-facts.md
|       |-- local-area.md
|       |-- restaurant-menu.md
|       |-- room-descriptions.md
|-- database/
|   `-- drizzle/
|       |-- meta/
|       |-- 0000_equal_lifeguard.sql
|       |-- 0001_broad_firebird.sql
|       |-- 0002_daffy_silver_surfer.sql
|       |-- 0003_hotel_etuna_partner_network.sql
|       |-- 0004_hotel_etuna_tenant_rls_policies.sql
|       |-- 0005_hotel_etuna_partner_constraints.sql
|       |-- 0006_fix_rls_recursion_with_tenant_type.sql
|       |-- 0007_cash_payments_and_reconciliation.sql
|       |-- 0008_reconcile_neon_baseline.sql
|       |-- 0009_booking_charges_folio.sql
|       `-- 0010_booking_charges_rls.sql
|-- docs/
|   |-- project/
|   |   |-- PLANNING.md
|   |   |-- PRD.md
|   |   `-- TASK.md
|   |-- reports/
|   `-- REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md
|-- e2e/
|   |-- helpers/
|   |   |-- db-otp.ts
|   |   `-- load-env.ts
|   |-- auth-journey.spec.ts
|   |-- authentication.spec.ts
|   |-- design-system.spec.ts
|   |-- homepage.spec.ts
|   `-- navigation.spec.ts
|-- lib/
|   |-- auth/
|   |   |-- client.ts
|   |   |-- config.ts
|   |   |-- jwks.ts
|   |   |-- middleware.ts
|   |   |-- platform-admin.ts
|   |   |-- stack-auth.ts
|   |   `-- tenant-context.ts
|   |-- cache/
|   |   `-- redis-rate-limit.ts
|   |-- compliance/
|   |   |-- audit-filters.ts
|   |   |-- compliance-snapshot.ts
|   |   |-- payments-by-rail.ts
|   |   |-- record-audit.ts
|   |   |-- regulatory-context.ts
|   |   `-- with-admin-rate-limit.ts
|   |-- config/
|   |   |-- adumo.ts
|   |   |-- constants.ts
|   |   `-- deepseek.ts
|   |-- copy/
|   |   |-- auth.ts
|   |   |-- brand.ts
|   |   |-- guest.ts
|   |   |-- index.ts
|   |   `-- public.ts
|   |-- cron/
|   |   `-- email-inbox-monitor.ts
|   |-- data/
|   |   |-- dining.ts
|   |   |-- partners.ts
|   |   `-- rooms.ts
|   |-- db/
|   |   |-- connection.ts
|   |   |-- database.types.ts
|   |   |-- index.ts
|   |   |-- rows.ts
|   |   `-- schema.ts
|   |-- hooks/
|   |   `-- useTenant.ts
|   |-- integrations/
|   |   |-- whatsapp/
|   |   |-- embeddings-alternative.ts
|   |   |-- embeddings-deepseek.ts
|   |   |-- embeddings-voyage.ts
|   |   |-- linear.ts
|   |   |-- mem0.ts
|   |   `-- qdrant.ts
|   |-- middleware/
|   |   `-- require2FA.ts
|   |-- monitoring/
|   |   |-- capture-client-exception.ts
|   |   `-- posthog-server.ts
|   |-- payments/
|   |   |-- namibia-payment-rails.ts
|   |   `-- transaction-metadata.ts
|   |-- services/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- booking/
|   |   |-- calendar/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- documents/
|   |   |-- folio/
|   |   |-- fraud/
|   |   |-- menu/
|   |   |-- openbanking/
|   |   |-- payment/
|   |   |-- platform/
|   |   |-- property/
|   |   |-- qr/
|   |   |-- restaurant/
|   |   |-- room/
|   |   |-- security/
|   |   |-- sofia/
|   |   |-- staff/
|   |   `-- whatsapp/
|   |-- types/
|   |   |-- ai.ts
|   |   |-- analytics.ts
|   |   |-- booking.ts
|   |   |-- cms.ts
|   |   |-- crm.ts
|   |   |-- folio.ts
|   |   |-- guest.ts
|   |   |-- property.ts
|   |   |-- restaurant.ts
|   |   `-- staff.ts
|   |-- utils/
|   |   |-- api-error-message.ts
|   |   |-- api-helpers.ts
|   |   |-- api-url.ts
|   |   |-- cn.ts
|   |   |-- date.ts
|   |   |-- errors.ts
|   |   |-- formatting.ts
|   |   |-- public-property.ts
|   |   |-- rate-limit.ts
|   |   |-- security-logger.ts
|   |   |-- slugify.ts
|   |   |-- status-normalize.ts
|   |   |-- tenant-validation.ts
|   |   `-- validation.ts
|   |-- validation/
|   |   `-- entity-ids.ts
|   |-- workflows/
|   |   |-- domainTransitions.ts
|   |   |-- genericLifecycleGraph.ts
|   |   |-- graphReducers.ts
|   |   |-- hospitalityMarketingWorkflows.ts
|   |   `-- kycKybGraph.ts
|   |-- formatters.ts
|   `-- posthog.ts
|-- public/
|   |-- brand/
|   |   |-- hotel-etuna-mark-reference.png
|   |   `-- hotel-etuna-mark.svg
|   |-- icons/
|   |   |-- icon-maskable.svg
|   |   `-- icon.svg
|   |-- images/
|   |   |-- flags/
|   |   |-- hospitality/
|   |   `-- namibia/
|   |-- manifest.json
|   `-- sw.js
|-- scripts/
|   |-- db/
|   |   |-- audit-neon-baseline.ts
|   |   `-- verify-tenant-rls.ts
|   |-- analyze-database-schema.ts
|   |-- check-sofia-inbox-detailed.ts
|   |-- check-sofia-inbox.ts
|   |-- clean-dev-cache.mjs
|   |-- cleanup-dry-violations.sh*
|   |-- create-sofia-email-logs-table.ts
|   |-- create-test-user.ts
|   |-- debug-auth.ts
|   |-- debug-login.ts
|   |-- ingest-hotel-etuna-knowledge.ts
|   |-- migrate-user-to-stack-auth.ts
|   |-- reset-schema.sh*
|   |-- reset-test-user.ts
|   |-- run-email-inbox-migration.ts
|   |-- run-email-verification-migration.ts
|   |-- run-is-enterprise-migration.ts
|   |-- run-migration.js
|   |-- run-qr-codes-migration.ts
|   |-- run-resort-to-airbnb-migration.ts
|   |-- seed-hotel-etuna.ts
|   |-- seed-partners.ts
|   |-- setup-and-fetch-emails.ts
|   |-- setup-test-restaurant.ts
|   |-- smoke-user-journeys.ts
|   |-- test-all-crud-operations.ts
|   |-- test-api-crud-operations.ts
|   |-- test-auth-endpoints.ts
|   |-- test-auth-flow.ts
|   |-- test-email.ts
|   |-- test-image-helper.ts
|   |-- test-llm-keys.sh
|   |-- test-routes.js*
|   |-- test-sofia-crud.ts
|   |-- test-without-auth.ts
|   |-- verify-api-endpoints.js*
|   |-- verify-db.ts
|   |-- verify-system-design.js*
|   `-- verify-user.ts
|-- tests/
|   |-- api/
|   |   |-- dashboard.test.ts
|   |   `-- properties.test.ts
|   |-- fixtures/
|   |   `-- test-helpers.ts
|   |-- integration/
|   |   |-- booking-lifecycle-hooks.test.ts
|   |   |-- bookings.test.ts
|   |   |-- crm-consent.test.ts
|   |   |-- crm-outreach.test.ts
|   |   |-- database.test.ts
|   |   |-- folio-guest-stay.test.ts
|   |   |-- kyc-upgrade-prompts-api.test.ts
|   |   |-- properties.test.ts
|   |   |-- restaurant-menu-orders.test.ts
|   |   |-- reviews-api.test.ts
|   |   |-- rooms.test.ts
|   |   |-- sofia-email-inbox.test.ts
|   |   |-- staff.test.ts
|   |   `-- support-tickets.test.ts
|   |-- seed/
|   |   `-- working-seed.ts
|   |-- setup/
|   |   |-- load-env.ts
|   |   `-- test-setup.ts
|   |-- smoke/
|   |   `-- compliance-fraud-db.smoke.test.ts
|   |-- sofia/
|   |   |-- rag-activation.test.ts
|   |   |-- sofia-chat-comprehensive.test.ts
|   |   |-- sofia-chat.test.ts
|   |   |-- sofia-email.test.ts
|   |   `-- sofia-knowledge-base.test.ts
|   |-- unit/
|   |   |-- guest-marketing-segment.test.ts
|   |   |-- llm-provider-router.test.ts
|   |   |-- posthog-analytics.test.ts
|   |   `-- rag-chunk.test.ts
|   |-- utils/
|   |   |-- auth-helpers.ts
|   |   |-- db-schema-check.ts
|   |   `-- test-helpers.ts
|   `-- workflows/
|       |-- ci-workflow.test.ts
|       |-- cron-workflow.test.ts
|       |-- deploy-workflow.test.ts
|       `-- security-workflow.test.ts
|-- types/
|   |-- daisyui.d.ts
|   `-- qrcode.d.ts
|-- README.md
|-- database-schema-analysis.txt
|-- docker-compose.override.yml.example
|-- docker-compose.yml
|-- drizzle.config.ts
|-- eslint.config.mjs
|-- next-auth.d.ts
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- playwright.config.ts
|-- postcss.config.mjs
|-- proxy.ts
|-- stack.ts
|-- tailwind.config.ts
|-- test-sofia-email-send.ts
|-- tsconfig.json
|-- vercel.json
|-- vitest.config.ts
`-- vitest.smoke.config.ts

193 directories, 283 files
```

*Regenerate after major structural changes: increase `-L` or run `tree` on a single path (e.g. `app/api`, `lib/services`).*

### 4.7 API ↔ database ↔ frontend mapping

Complete route inventory: `app/api/**/route.ts` (**136** handlers; verify: `find app/api -name route.ts | wc -l`). Clients may call `/api/v1/...` via `apiUrl()` (rewrites in `next.config.ts`).

#### Bookings & guest stay

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/bookings` | POST | Role | `guests`, `bookings`, `booking_rooms`, `rooms` | `BookingForm`, `public-properties/.../book` |
| `/api/bookings/availability` | GET, POST | Public | `bookings`, `booking_rooms`, `rooms`, `properties` | `LandingBookingWidget`, `PartnerAvailabilityWidget` |
| `/api/bookings/[id]/status` | PATCH | Role | `bookings`, `booking_rooms`, `rooms` | `bookings/[id]` → `WorkflowStatusActions` |
| `/api/bookings/[id]/payment` | PATCH, GET | Session | `bookings`, `audit_trail`, `booking_charges` | `CashPaymentModal`, `BookingCashPaymentSection` |
| `/api/guest/stays` | GET | Session (guest email) | `bookings`, `guests`, `properties`, `booking_rooms`, `rooms`, `booking_charges` | `guest/page` → `GuestStaysList` |
| `/api/guest/stays/[bookingId]/folio` | GET | Session + stay | `booking_charges`, `bookings`, `guests` | `GuestFolioPanel`, `BookingFolioSection` |
| `/api/guest/stays/[bookingId]/menu` | GET | Session + stay | `restaurants`, `menu_categories`, `cms_menu_items` | `GuestFolioPanel` |
| `/api/guest/stays/[bookingId]/orders` | POST | Session + stay | `restaurant_orders`, `restaurant_order_items`, `booking_charges` | `GuestFolioPanel` |
| `/api/guest/stays/[bookingId]/settle` | POST | Session + stay | `booking_charges`, `transactions`, `bookings` | `GuestFolioPanel`, `BookingFolioSection` |
| `/api/guest/loyalty/redeem` | POST | Session + stay | `guest_profiles`, `booking_charges` | `GuestFolioPanel` |
| `/api/public/room-qr/[code]` | GET | Public | `room_qr_codes`, `bookings`, `booking_rooms`, `rooms` | `guest/room` → `GuestRoomQrClient` |

**Resolved (May 2026):** `GET /api/bookings?propertyId=&startDate=` — calendar list handler on `/api/bookings`.

#### Auth

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/auth/[...nextauth]` | GET, POST | Public | `users`, `tenants` | All dashboard (session) |
| `/api/auth/register` | POST | Public | `users`, `tenants`, `sofia_email_logs` | `(auth)/register` |
| `/api/auth/verify-email` | POST | Public | `users` | `(auth)/verify-email` |
| `/api/auth/resend-otp` | POST | Public | `users` | verify-email page |
| `/api/auth/forgot-password` | POST | Public | `users` | `(auth)/forgot-password` |
| `/api/auth/reset-password` | POST | Public | `users` | `(auth)/reset-password` |

#### CRM & reviews

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/crm/guests` | GET, POST | Role | `guests` | `crm/page`, `crm/reviews` |
| `/api/crm/guests/[id]` | GET, PUT | Session | `guests` | `crm/guests/[id]` |
| `/api/crm/guests/[id]/consent` | GET, POST | Role | `crm_consent_events`, `guests` | `GuestCrmMemoryPanel` |
| `/api/crm/guests/[id]/memory` | GET, POST | Role | `crm_guest_memory_facts`, `crm_graph_edges` | `GuestCrmMemoryPanel` |
| `/api/crm/outreach` | GET, POST | Role | `crm_outreach_touches` | `GuestCrmMemoryPanel` |
| `/api/crm/outreach/[id]` | PATCH | Role | `crm_outreach_touches` | `GuestCrmMemoryPanel` |
| `/api/crm/reviews` | GET | Session | `guest_reviews`, `guests`, `properties` | `crm/reviews` |
| `/api/crm/reviews/[id]` | PATCH | Session | `guest_reviews` | `crm/reviews` |
| `/api/crm/rag/ingest` | POST | Role | `properties`; vectors → **Qdrant** | `crm/knowledge` → `CrmRagIngestPanel` |
| `/api/guests`, `/api/guests/[id]` | * | * | Re-export of `/api/crm/guests*` | Legacy alias |

*Partner roles: **403** on `/api/crm/*`, `/api/sofia/*`, `/api/ai/*`, `/api/guest/*` (`proxy.ts`).*

#### Sofia & AI

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/sofia/chat` | POST | Optional session | Sofia LLM (minimal DB) | `dashboard` → `SofiaChat` |
| `/api/public/sofia/chat` | POST | Public | `guests`, `properties` | `public-properties/[slug]` → `PublicSofiaChat` |
| `/api/sofia/email` | POST | Session | `sofia_email_logs`, `properties`, `users` | `sofia/email` |
| `/api/sofia/voice/webhook` | POST | Webhook | `sofia_voice_sessions` | External provider |
| `/api/ai/concierge` | POST, GET | Session | `ai_conversations`, `ai_messages`, `bookings`, `guests` | `ai/page` → `SofiaConciergeChat` |
| `/api/webhooks/whatsapp` | GET, POST | Webhook | `tenant_whatsapp_settings`, `guests`, `ai_*` | Meta only |

#### Payments

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/payments/initiate` | POST | 2FA header | `payment_security_audit`, `fraud_*`, `audit_trail` | Gateway / internal |
| `/api/payments/complete` | GET | 2FA header | `bookings`, `properties`, `tenants` | Payment return URL |
| `/api/payments/3ds-callback` | POST, GET | Callback | `bookings`, transactions | 3DS redirect |
| `/api/payments/reconciliation` | GET, POST | Session | `cash_reconciliations`, `bookings` | `payments/reconciliation` |
| `/api/payments/namqr/generate` | POST | Session (staff) | `namqr_codes` | `payments/desk`, booking folio |
| `/api/payments/namqr/confirm` | POST | Session (staff) | `transactions`, `booking_charges`, `namqr_codes` | `payments/desk`, booking folio |
| `/api/payments/manual` | POST | Session (staff) | `transactions`, `booking_charges` | `payments/desk` |

#### Restaurant & menu

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/restaurant/menu` | GET, POST | Role | `restaurants`, `menu_categories`, `cms_menu_items` | `restaurant/menu` |
| `/api/restaurant/orders` | GET, POST | Role | `restaurant_orders`, `restaurant_order_items` | `restaurant/orders` |
| `/api/restaurant/orders/[id]/status` | PATCH | Role | `restaurant_orders` | `OrderCard` |
| `/api/restaurant/details` | GET | Session | `restaurants` | restaurant pages |
| `/api/restaurant/tables` | GET, POST | Role | `restaurant_tables` | `restaurant/tables` |
| `/api/menu` | GET, POST | Role | `cms_menu_items`, `menu_categories` | `menu/page`, `menu/new` |
| `/api/public/restaurant/menu/[slug]` | GET | Public | `properties`, `restaurants`, menu tables | `public-properties/.../menu` |
| `/api/public/restaurant/orders` | POST | Public | `restaurant_orders`, `guests`, tables | QR dine-in |

**Resolved (May 2026):** `PATCH/DELETE /api/menu/[itemId]` — `app/api/menu/[itemId]/route.ts`.

#### Properties, rooms, CMS

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/properties` | GET, POST | Role | `properties` | dashboard, crm, restaurant, properties |
| `/api/properties/[id]` | GET, PUT, DELETE | Role | `properties` | `PropertyForm`, `PropertyCard` |
| `/api/properties/[id]/rooms` | POST | Session | `rooms` | `CreateRoomForm` |
| `/api/rooms` | GET, POST | Role | `rooms` | `dashboard/rooms` |
| `/api/rooms/available` | GET | Session | `rooms`, `bookings`, `booking_rooms` | `NewBookingPage` |
| `/api/cms/content` | GET, POST | Role | `cms_content` | `CmsDashboard`, `ContentEditor` |
| `/api/cms/media` | GET, POST | Role | `cms_media` | `MediaUploader`, galleries |
| `/api/public/properties/[slug]` | GET | Public | `properties` | SSR via `PropertyService` |

#### Dashboard, analytics, settings

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/dashboard/stats` | GET | Role | `properties`, `bookings`, `restaurant_orders`, `guests` | `dashboard/page` |
| `/api/dashboard/activity` | GET | Session | `bookings`, `restaurant_orders`, rooms | `dashboard/page` |
| `/api/analytics` | GET, POST | Session | bookings, guests, reviews, staff, orders | `analytics/page` |
| `/api/settings` | GET, POST | Session | `tenants`, `users` | `settings/page` |
| `/api/user/profile` | GET | Session | `users`, `tenants` | `profile/page` |

#### Staff

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/staff` | GET, POST | Role | `staff`, `compliance_verification_cases` | `staff/page`, `staff/new` |
| `/api/staff/stats` | GET | Session | Mock JSON (no DB) | — |

**Resolved (May 2026):** `/api/staff/[id]` (GET/PATCH/DELETE); `/api/staff/shifts`; `/api/staff/[id]/shifts`.

#### Compliance, fraud, partners, platform admin

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/compliance/kyc-cases*` | GET, POST, … | Role | `compliance_verification_*` | `compliance/kyc/*` |
| `/api/compliance/soc2` | GET | Hub tenant + role (owner, manager, admin) | `audit_trail`, `users`, `cybersecurity_incidents` (export sample) | `compliance/soc2` — `action=status\|full-report\|export`; **not** CPA attestation |
| `/api/compliance/soc2/audit` | GET | Same as above | Same (orchestrator) | Alias for `action=full-report` with `from`/`to` query params |
| `/api/compliance/aml/*` | * | Open API | `aml_*` | `AMLDashboard`, `PEPManagement` (components exist; limited page mount) |
| `/api/compliance/psd/*` | * | Open API | `payment_security_audit`, `bon_incident_reports` | Integrations |
| `/api/fraud/alerts` | GET, PATCH | Open | `fraud_alerts` | `fraud/page` |
| `/api/fraud/statistics` | GET | Open | `fraud_statistics` | `fraud/page` |
| `/api/fraud/analyze` | POST, GET | Open | `fraud_risk_profiles`, `transactions` | Payment init |
| `/api/partners`, `/api/partners/[slug]` | GET | Public | `properties`, `rooms`, `tenants` | `partners/*` (SSR + API) |
| `/api/admin/partners/invite` | POST | Role | `partner_invites` | Hub onboarding |
| `/api/admin/partners/claim-invite` | POST | Public | `partner_invites`, `tenants`, `users`, `properties` | Partner signup |
| `/api/admin/platform/*` | * | Platform admin | `tenants`, `users`, `properties`, `audit_trail`, `support_tickets` | `admin/platform/*` |

#### Support, QR, documents, cron

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/support/tickets` | GET, POST | Session | `support_tickets` | Platform admin routes |
| `/api/qr`, `/api/qr/[id]`, `/api/qr/scan` | * | Session / Public | `namqr_codes`, `room_qr_codes` | Scripts, scan clients |
| `/api/documents/sign` | POST, GET, PATCH | Open | `electronic_signatures` | E-sign flows |
| `/api/bon/v1/common/token`, `par` | POST | OB client | `ob_api_transactions` | Bank integration |
| `/api/cron/*` | GET | Cron | bookings, sofia email, health | Vercel cron only |

#### Page → primary API (quick index)

| Page | Main APIs |
|------|-----------|
| `/`, `/rooms/[slug]` | `/api/bookings/availability` |
| `/guest`, `/guest/stays/[id]`, `/guest/room` | `/api/guest/stays*`, `/api/public/room-qr/[code]` |
| `/bookings`, `/bookings/[id]` | `/api/bookings`, status, payment, folio |
| `/crm/*` | `/api/crm/*`, `/api/properties` |
| `/restaurant/*` | `/api/restaurant/*`, `/api/cms/media` |
| `/dashboard`, `/analytics`, `/settings`, `/profile` | `/api/dashboard/*`, `/api/analytics`, `/api/settings`, `/api/user/profile` |
| `/fraud` | `/api/fraud/statistics`, `/api/fraud/alerts` |
| `/admin/platform/*` | `/api/admin/platform/*` |
| Auth pages | `/api/auth/*` |


---

## 5. Gated Content Strategy (Authentication Wall)

### 3.1 Rationale

Hotel Etuna uses a **gated content model** to:
- Build a qualified guest database
- Protect rate integrity from competitors
- Increase conversion (registered users book more)
- Provide personalized pricing and recommendations post-login

### 3.2 Public Page Visibility Matrix (Unauthenticated)

| Page | Visible Content | Hidden Content | Primary CTA |
|------|----------------|----------------|-------------|
| **Landing (/)** | Hero, story, room **names & images** (no prices), dining overview (no prices), approved reviews, partner cards, footer. | Room prices, booking form (replaced with "Sign in to check"), menu prices. | "View Rooms" → `/rooms`<br>"Sign Up to See Prices" on room cards. |
| **/rooms** | **Photo-tour filmstrip** — same **Take the tour** CTA for all visitors; no prices on cards. Signed-in banner explains rates on detail pages. | NAD rates, booking form. | Guests: sign-in banner. All: **Take the tour** → `/rooms/[slug]#tour`. |
| **/rooms/[slug]** | **`RoomPhotoTour`** (identical UX signed-in or guest), description, highlights, amenities, capacity. | Guests: nightly rate, **`#booking`** widget. | Guests: **Sign in** on card + banner. Signed-in: rates + **Complete your booking** → `#booking`. |
| **/dining** | Restaurant overview; **digital menu book** (all categories/items), dish photos, names, descriptions, **NAD prices**; guest favourites strip (analytics). Page-turn UX (click, drag, ← →). | In-page room-service ordering (folio) for guests not checked in. | "Sign In to Order Online" / reservation CTA in hours section. |
| **/partners & /partners/[slug]** | Partner property info, images, descriptions, room types. | Partner prices, partner booking widget. | "Sign In to View Partner Rates & Book". |
| **Sofia AI Chat** | Public visitors can ask general questions (e.g., "Do you have a pool?", "What time is check‑in?"). Sofia **must not** disclose room rates, availability, or take booking requests from unauthenticated users. | Prices, availability, booking. | Sofia replies: *"For pricing and availability, please sign up — it only takes a minute!"* |

### 3.3 Post-Login Experience

**After login**, all prices, availability, and booking/ordering widgets become visible. The system redirects the user back to the page they were on before login (via a `redirect` query parameter).

**Login Flow:**
1. User clicks "Sign In to View Prices" on `/rooms`
2. Redirects to `/login?redirect=/rooms`
3. After successful auth, returns to `/rooms` with prices visible
4. All booking widgets become active

### 3.4 Implementation Requirements

| Component | Requirement |
|-----------|-------------|
| **AuthGate Context** | React Context exposing `isAuthenticated` (from session). All price displays check this before rendering. |
| **Landing Page** | Replace price lines with "Sign in to view prices". Hide booking widget, show "Sign in to check availability" card. |
| **Room Pages** | Hide prices when `!isAuthenticated`. Replace booking button with "Sign In" CTA. |
| **Dining Page** | Full menu book with prices on `/dining` (see §3.1.1). Reservation/order CTA uses `publicCopy.gated.orderOnline` when unauthenticated. Landing/home dining teasers may still hide prices per product policy. |
| **Partner Pages** | Apply same gating: hide partner room prices, replace booking widget with sign‑in prompt. |
| **Sofia AI** | System prompt: *"Never disclose prices or availability to unauthenticated users. Instead, invite them to sign up."* Chat widget visible to all, but responses change based on auth state. |
| **Login Redirect** | After successful login, read `redirect` query param and return user to original page. Default to `/dashboard` if no redirect. |

### 3.5 Verification Checklist

- [x] Visit site in incognito → no prices visible, all CTAs lead to login
- [x] Log in → all prices, booking, and ordering features appear
- [x] Sofia chat responds with sign‑up invitation when asked about prices
- [x] Login redirect works correctly from all pages
- [x] Authenticated users see no "Sign in" CTAs (replaced with booking widgets)

---

## 6. Non‑Functional Requirements

### 6.1 Architecture & Data Isolation

- **Hub‑and‑Spoke Multi‑Tenancy:** Hotel Etuna = hub tenant with full access. Partners = lightweight tenants with strict RLS enforcement. 62 PostgreSQL RLS policies active. `tenant_type` enum distinguishes `hub` from `partner`. `parent_tenant_id` links partners to hub.
- **Database:** **Neon (serverless Postgres)** — connection pooling for serverless environments. Drizzle ORM handles all database interactions. No Supabase‑specific features used.
- **Vector Database:** **Qdrant** — collection `sofia_knowledge` with hub tenant namespace for Hotel Etuna property knowledge.

### 6.2 Security & Compliance

- **Authentication:** Stack Auth (or NextAuth) for all users. JWT tokens include `tenant_id` and `role` claims.
- **Authorization:** RBAC: `owner`, `manager`, `admin`, `staff`. Middleware enforces tenant isolation. Hub‑only routes (`/api/sofia/*`, `/api/crm/*`, `/api/ai/*`) return 403 for partners.
- **Rate Limiting:** Aggressive limits on partner invite endpoint (5 requests/hour). Standard limits on public APIs (100 requests/minute per IP).
- **Two‑Factor Authentication:** Required for all hub admin actions affecting payments, commissions, or partner management.
- **Data Protection:** GDPR and POPIA compliant. Marketing consent flags enforced in CRM queries. Audit trail logs all sensitive operations with old/new values, user ID, IP, timestamp.
- **Session Management:** 8‑hour absolute session max, 30‑minute inactivity timeout (with 2‑minute warning toast), rolling session extension on activity.

### 6.3 Branding & User Experience

| Surface | Theme |
|---------|-------|
| **Hotel Etuna Public Website** | Khaki‑rustic‑savannah palette: `khaki‑600` (#b8955a) primary CTA, `terracotta‑800` (#8b4a2e) headings, `sage‑green` (#9bae8a) nature accents. Playfair Display for headlines, Inter for body. |
| **Hub Admin Dashboard** | Same Hotel Etuna branding. "HE" badge in sidebar. No workspace switcher. All "Buffr Host" references replaced. |
| **Partner Portal** | Neutral, light palette. Partner property name in header. No Sofia/CRM navigation links. |
| **Partner Public Listings** | Hotel Etuna website wrapper with partner‑specific content. Partner logo and images. Contact form (not Sofia chat widget). |
| **Email Templates** | Hotel Etuna branded for hub emails. Simple transactional templates for partner booking confirmations. |

### 6.4 Performance & Reliability

- **Uptime Target:** 99.9% (aligned with PSD‑12)
- **AI Reliability:** Multi‑provider fallback (DeepSeek → Anthropic → Groq)
- **Caching:** ISR revalidation every 300 seconds on landing page
- **Image Handling:** Vercel Blob for property images; max 5MB per image, 20 images per property

### 6.5 Deployability

- **Hosting:** Vercel (Next.js App Router)
- **Domain:** `hoteletuna.com` with Vercel DNS
- **Environment Variables:** All secrets in Vercel project settings; `.env.local` for local development

### 6.6 System design standards (from master guide)

**Canonical reference:** `SYSTEM_DESIGN_MASTER_GUIDE.md` (repo root). Product-facing requirements below; implementation detail in **`PLANNING.md`**; verification in **`TASK.md`**.

#### 6.6.1 Scale posture (current product)

| Metric | Estimate | Design implication |
|--------|----------|------------------|
| Hub property | 1 flagship + ~2–5 partner properties | Single Neon database sufficient |
| Rooms (hub) | 5 room types | No sharding; index `property_id`, `tenant_id` |
| Daily bookings | Low hundreds (target) | Single-server + serverless scale-out on Vercel |
| Public reads | Landing, rooms, partners (ISR 300s) | Cache-aside via Next.js ISR + CDN |
| Sofia RAG | Low QPS, hub-only | Qdrant + embedding API; multi-provider LLM fallback |
| Storage growth | Reviews, bookings, audit trail | PostgreSQL ACID; retention policies TBD (GDPR) |

**Scaling path (when needed):** Vercel horizontal scale (stateless app) → Neon read replicas → Redis cache layer for hot reads → CDN for static assets. Consistent hashing / multi-region not required at current scale.

#### 6.6.2 CAP / PACELC choices

| Domain | Choice | Rationale |
|--------|--------|-----------|
| **Bookings & payments** | **Consistency** (CP under partition) | Commission, cash reconciliation, folio — must not double-charge or lose audit trail |
| **Public marketing content** | **Availability + latency** (AP for reads) | ISR allows brief staleness (5 min); acceptable for room copy and reviews |
| **Sofia knowledge index** | **Eventual consistency** | Ingestion lag OK; chat must not invent rates for unauthenticated users |
| **Partner directory** | **Availability** | Active partners list can be eventually consistent with admin toggles |

#### 6.6.3 Caching layers

```
Browser / CDN → Next.js ISR (public pages, 300s) → App (no shared in-memory cache) → Neon (source of truth) → Qdrant (RAG vectors)
```

| Layer | Strategy | Invalidation |
|-------|----------|----------------|
| Landing `/` | ISR `revalidate = 300` | TTL; `revalidatePath('/')` on review toggle |
| API responses | No default HTTP cache on auth routes | N/A |
| Embeddings / Qdrant | Write on ingest | Re-run `ingest-hotel-etuna-knowledge.ts` |
| Session | Cookie + server validation | 30m idle / 8h absolute (§6.2) |

#### 6.6.4 Design principles (product guardrails)

| Principle | Hotel Etuna rule |
|-----------|------------------|
| **KISS** | One hub tenant model; partners lightweight — no microservices split |
| **DRY** | Shared middleware (`proxy.ts`, `withApiAuth`), `lib/copy/`, `lib/data/rooms.ts` — not duplicate auth per route |
| **Boy Scout** | Touching a route: add validation, tenant check, structured errors |
| **Wrong abstraction** | Do not merge hub CRM with partner dashboard; folio ≠ guest marketing profile |
| **Ship stable** | Prefer idempotent SQL migrations (`IF NOT EXISTS`) over `drizzle-kit push` on prod |

#### 6.6.5 Security baseline (NFR cross-ref)

Maps to master guide **Part 6** and **Part 10 (AI Security Prompt Pack)** — full checklists in **`TASK.md`** § Security verification:

- Backend validation on every mutating API (not frontend-only)
- Parameterized SQL via Drizzle / Neon only
- RBAC + RLS (defense in depth)
- Rate limits on login, partner invite, payment initiate
- No secrets in client bundles; rotate if ever committed
- Audit trail for cash, payments, partner invites
- Pre-launch: run Master + Pre-Launch prompts (TASK.md) before major releases

---

## 7. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite‑only)
- Multi‑property management inside a partner tenant
- Full B2B outbound sales funnel
- External CRM as system of record
- Third‑party OTA integration (Booking.com, Expedia)
- Partner mobile app (responsive web only)
- Blockchain/crypto payments

---

## 8. Success Metrics

- Guests complete booking in <3 minutes with consistent state between website and back‑office
- **Sign‑up conversion rate:** ≥30% of visitors who click "View Prices" complete registration
- Partner onboarding works end‑to‑end (invite → claim → listing live)
- Commission tracking is 100% accurate and auditable
- Zero cross‑tenant data leakage (verified by RLS test script)
- Sofia remains unavailable to partners (middleware‑enforced 403)
- **Sofia enforces gating:** 100% of price/availability inquiries from unauthenticated users result in sign‑up prompt
- Sofia AI answers ≥70% of guest inquiries correctly
- Staff manage 100% of booking lifecycle digitally (zero spreadsheets)
- CRM captures ≥95% of guest interactions
- **Registered users book at 3x the rate of anonymous visitors**

---

## 9. Design Direction (Brand)

### 9.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `nude‑50` | `#fef7f0` | Page backgrounds |
| `nude‑100` | `#fceee0` | Card backgrounds |
| `nude‑200` | `#f8dcc0` | Borders, dividers |
| `nude‑300` | `#f2c49f` | Inactive states |
| `nude‑400` | `#e8a87a` | Secondary hover |
| `nude‑500` | `#d18b5c` | Base nude |
| `khaki‑600` | `#b8955a` | **Primary CTA** |
| `khaki‑700` | `#9a7d43` | CTA hover |
| `terracotta‑800` | `#8b4a2e` | Heading text |
| `terracotta‑900` | `#6d3722` | Deep text |
| `khaki‑sand` | `#c4a97d` | Badges/soft backgrounds |
| `sage‑green` | `#9bae8a` | Nature / secondary accents |

### 9.2 Typography

- **Body:** Inter (system‑ui stack), 16px base
- **Display:** Playfair Display (headlines, room names, hero text)
- **Mono:** JetBrains Mono (invoices, analytics, code)
- **Signature:** Dancing Script (limited personal touches)

### 9.3 Component Direction

- **Primary button:** `bg‑khaki‑600 hover:bg‑khaki‑700 text‑white`
- **Focus ring:** `ring‑2 ring‑khaki‑600 ring‑offset‑2`
- **Cards:** `shadow‑nude‑soft`, hover lifts with `shadow‑khaki‑medium`
- **Touch targets:** ≥44px on mobile
- **Hub sidebar:** Hotel Etuna "HE" badge + name
- **Partner dashboard:** Neutral palette, no Sofia/CRM navigation

### 9.4 Tone of Voice

- Warm, personal, knowledgeable — like a friend who grew up in northern Namibia
- Inclusive: "we" and "you", never the royal "Hotel Etuna allows"
- Oshiwambo sprinklings: "Moro" (Hello), "Wa lalapo?" (How are you?), "Nangalei po" (Goodbye)
- Tagline: *"He Takes Care of Us"*

### 9.5 Brand & rebrand strategy (living document)

Full questionnaire answers, competitor landscape, **Roger Martin / Playing to Win** cascade, **Four Seasons** strategic analogy (not visual mimicry), **MBA Project 9** systems lessons, **wordmark-first logo** direction, and SEO/checklist items: **`docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md`**. Update that document when brand decisions change; keep **§9.1–9.7** in this PRD aligned with production `tailwind.config.ts`, brand assets, and deployed UI.

### 9.6 Word copy (canonical module)

**Source of truth:** `lib/copy/` — import via `@/lib/copy` or submodules (`brand`, `auth`, `public`, `guest`).

| Module | Purpose |
|--------|---------|
| `brand.ts` | Tagline, lead line, proof points (trade fair, shuttle N$250, loyalty), **forbidden guest phrases** (e.g. “free forever”, SaaS onboarding) |
| `public.ts` | Homepage meta, partners section, shared trust indicators |
| `auth.ts` | Login/register — **guest & stay** voice, not Buffr SaaS |
| `guest.ts` | In-stay hub (`/guest/*`), folio + loyalty hints |

**Voice split:** Public/guest surfaces use **hotel-in-Ongwediva** copy. Hub **staff dashboard** may use operational language (PMS, Sofia). **Partner portal** stays neutral (no Etuna sermon). Sofia system prompt and `KnowledgeBaseService` describe the **property**, not a free software plan.

**Removed from guest-facing UI:** “Free Forever”, “no credit card required”, “setup in 5 minutes”, “hospitality management platform” as primary positioning.

**Facts alignment:** `data/hotel-etuna-knowledge/hotel-etuna-facts.md` + rebrand Part VI (room tiers from N$850, loyalty 100 pts = N$50).

### 9.7 Logo mark (monogram)

**Status:** Complete (May 16, 2026) — reference-traced SVG + frame weight tuned after visual review.

**Approved reference:** `public/brand/hotel-etuna-mark-reference.png` (source raster: `hotel-etuna.png`).

#### Structure

| Layer | Description |
|-------|-------------|
| **Roof** | Triangle; apex centred; base ~full width at `y ≈ 21.5` |
| **Gap** | Empty band between roof and base (`y ≈ 21.5–25.3`) |
| **E frame** | Top lintel, left/right pillars, bottom lintel (`currentColor` fill) |
| **E bars** | Two lower blocks; three negative vertical gaps |

**ViewBox:** `0 0 88 47` (≈ **1.88:1** — do not use square viewBox).  
**Sizing:** `HotelEtunaMarkIcon` sets `width={size}`, `height={Math.round(size * 47 / 88)}` via `HotelEtunaLogo`.

#### Frame dimensions (viewBox units, current)

| Element | Values |
|---------|--------|
| Top lintel | `x=3.8` `y=25.3` `w=80.2` `h=3.5` |
| Left pillar | `x=3.8` `y=28.8` `w=6.6` `h=14.4` |
| Right pillar | `x=78.1` `y=28.8` `w=5.9` `h=14.4` |
| Middle bars | `y=35.6` (unchanged) |
| Bottom lintel | `x=3.8` `y=43.2` `w=80.2` `h=3.6` |

*Trace from reference used thinner frame; thickened in two steps for legibility at header/PWA sizes.*

#### Assets & components

| Asset | Path |
|-------|------|
| Inline / themeable mark | `components/brand/HotelEtunaMarkIcon.tsx` |
| Wordmark lockup | `components/brand/HotelEtunaLogo.tsx` |
| Export SVG | `public/brand/hotel-etuna-mark.svg` |
| Reference PNG | `public/brand/hotel-etuna-mark-reference.png` |
| PWA icons | `public/icons/icon.svg`, `public/icons/icon-maskable.svg` |

**Usage:** Mark in **terracotta-900** on **nude-50**; pair with Playfair wordmark “Hotel Etuna”; optional tagline *He takes care of us* (`nude-700`). `HotelEtunaLogo` `onDark` for footers. No “& Tours” in lockup.

**Surfaces:** auth pages, `NavigationHeader`, `Sidebar`, `PublicFooter`, `app/guest/layout`.

#### Verification

- [ ] Aspect ratio and E frame at `sm` / `md` / `lg` logo sizes
- [ ] Match `hotel-etuna-mark-reference.png`
- [ ] PWA / maskable icons after install
- [ ] `onDark` footer variant

```bash
cd hotel-etuna && npm run build
```

**Deploy:** static assets + components — hard-refresh if cached SVG is stale.

---

## 10. Landing Page Structure (`app/page.tsx`)

**✅ DATABASE‑DRIVEN IMPLEMENTATION COMPLETE**

All sections are **database‑driven** (React Server Component with Drizzle ORM queries):

| # | Section | Data Source | Gated Content |
|---|---------|-------------|---------------|
| 1 | **Hero:** "He Takes Care of Us" — background image, CTA buttons | `properties` (hub) | None (public) |
| 2 | **Etuna Story:** Brand narrative, stats (5 rooms, pool, restaurant) | Static text + `rooms` count | None (public) |
| 3 | **Rooms:** 5 room type cards with names, images, amenities | `rooms` table | ✅ **Prices hidden** — "Sign in to view prices" CTA |
| 4 | **Dining:** Etuna Restaurant overview, teaser dishes (names; prices may be gated on home) | `restaurants` + `cms_menu_items` | ✅ Teaser gated; **full menu with prices** on `/dining` |
| 5 | **Guest Love:** Approved reviews only (`is_public = true`), aggregate rating | `guest_reviews` | None (public) |
| 6 | **Booking Widget:** Replaced with "Sign in to check availability" card | `properties` | ✅ **Entire widget hidden** — auth required |
| 7 | **Referral Partners:** JayLa + Aquarius cards | `tenants` (type=partner) + `properties` | None (names/images public) |
| 8 | **Footer:** Real address, phone, email, quick links | `properties` (hub) | None (public) |

**ISR Revalidation:** 300 seconds (5 minutes).

**Key Features:**
- ✅ All room data pulled from database (no hardcoded JSON)
- ✅ Menu items filtered by `is_available = true`
- ✅ Reviews filtered by `is_public = true` and hub tenant ID
- ✅ Active partners only (`status = 'active'`)
- ✅ Footer contact details from property table
- ✅ Average rating calculated from approved reviews
- ✅ Empty state handling ("No reviews yet. Be the first!")
- ✅ Guest name fallback ("Anonymous" if guest deleted)
- ✅ **Gated content:** Prices hidden until authentication (`lib/copy/public.ts`, public pages)

**Review Approval Workflow:**
- ✅ Admin dashboard at `/crm/reviews` with toggle functionality
- ✅ `PATCH /api/crm/reviews/[id]` endpoint to toggle `is_public`
- ✅ `GET /api/crm/reviews` endpoint for all reviews with guest/property joins
- ✅ Filter by status (all, approved, pending), sort by date/rating
- ✅ Real‑time optimistic UI updates
- ✅ NextAuth authentication + role‑based authorization (owner, manager, admin only)

**Documentation:**
- Landing page structure: **§10** (this document)
- Testing & smoke: **`TASK.md`** § Production smoke
- Summary: **`TASK.md`** § Verified Implementation Audit (May 16, 2026)

---

## 11. Technical Architecture

### 11.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hotel Etuna Platform                         │
│                  (Next.js + Vercel + Neon DB)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
     ┌────────▼────────┐             ┌───────▼────────┐
     │   Hub Tenant    │             │ Partner Tenant │
     │ (Hotel Etuna)   │             │ (JayLa, etc.)  │
     └─────────────────┘             └────────────────┘
              │                               │
     ┌────────▼────────┐             ┌───────▼────────┐
     │ Hub Dashboard   │             │ Partner Portal │
     │ - Full PMS      │             │ - My Property  │
     │ - CRM (all)     │             │ - Bookings     │
     │ - Partner Mgmt  │             │ - Rates        │
     │ - Commissions   │             │ - Photos       │
     └─────────────────┘             └────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                     ┌────────▼────────┐
                     │ Public Website  │
                     │ (Database‑driven│
                     │ + Gated Content)│
                     └─────────────────┘
```

### 11.2 Database (Neon Serverless Postgres)

- **34 tables** migrated from Buffr Host
- **6 additional migrations** for partner network (0003–0006)
- **62 RLS policies** enforcing tenant isolation
- **Key tables:** `tenants` (with `type`, `parent_tenant_id`, `commission_percent`), `properties`, `rooms`, `bookings` (with `commission_amount`), `guest_reviews` (with `is_public`), `partner_invites`

### 11.3 API Architecture

**Partner Network Endpoints:**
- `POST /api/admin/partners/invite` — Hub admin invites partner
- `POST /api/admin/partners/claim‑invite` — Partner claims invite token
- `GET /api/partners` — List active partners (public)
- `GET /api/partners/[slug]` — Partner detail (public)

**Review Management Endpoints:**
- `GET /api/crm/reviews` — Fetch all reviews with guest/property joins (auth)
- `PATCH /api/crm/reviews/[id]` — Toggle `is_public` flag (auth, role‑based)

**AI/CRM Endpoints (Hub‑Only):**
- `POST /api/sofia/knowledge/ingest` — Knowledge base ingestion
- `POST /api/sofia/chat` — AI chat (enforces gated content for unauthenticated users)
- All blocked for partners via middleware → 403

### 11.4 Sofia AI Architecture (Hub Only)

- **Qdrant** vector database for semantic search
- **LLM Provider Router:** DeepSeek → Anthropic → Groq (fallback chain)
- **Knowledge Base:** 5 Hotel Etuna documents (facts, rooms, restaurant, local area)
- **Chunking:** Semantic chunking with 800‑char target, 100‑char overlap
- **Embeddings:** Voyage AI `voyage-3` (1024‑dim) or OpenAI `text‑embedding‑3‑small` (1536‑dim); fallback to Ollama or Hugging Face
- **Multi‑Channel:** Web chat, email, WhatsApp, phone (all hub only)
- **Human Escalation:** Low confidence (<0.55) or policy keywords trigger staff notification
- **Gated Content Enforcement:** System prompt instructs Sofia to never disclose prices/availability to unauthenticated users, instead prompting sign‑up

### 11.5 Request flow (single-server model)

```
Guest/Staff Browser
        │ HTTPS
        ▼
   Vercel Edge / CDN
        │
        ▼
   Next.js App Router (RSC + API routes)
        │
        ├── proxy.ts (auth, tenant, hub-only 403)
        │
        ├──► Neon Postgres (Drizzle, RLS, pooled)
        ├──► Qdrant (Sofia vectors, tenant filter)
        ├──► LLM providers (DeepSeek → Anthropic → Groq)
        ├──► Vercel Blob (images)
        └──► SMTP / Stack Auth (external)
```

**Stateful vs stateless:** App tier is **stateless** (any Vercel instance can serve any request). Booking/folio **state** lives in Postgres; Sofia session context is request-scoped + optional Mem0 for CRM memory.

### 11.6 Data modeling rules (relational)

From master guide Part 2 — applied to this schema:

- **Nouns → tables:** `tenants`, `properties`, `rooms`, `bookings`, `guests`, `booking_charges`
- **Verbs → status columns / enums:** `booking.status`, `payment_status`, `is_public` on reviews
- **One-to-many:** `tenant_id` on child rows; never embed room lists in a JSON blob for querying
- **Many-to-many:** Junction tables (e.g. booking ↔ charges via `booking_charges`)
- **Split tables** when lifecycle differs (folio charges vs marketing `guest_profiles`)

**SQL vs NoSQL:** PostgreSQL (Neon) is the system of record. Qdrant is a **derived index** for RAG only — not authoritative for rates or availability.

---

## 12. Implementation Status (verified May 16, 2026)

Evidence: codebase inspection + `npx tsc --noEmit` (pass) + `npx tsx scripts/db/verify-tenant-rls.ts` (pass). Full checklist: **`TASK.md`** § Verified Implementation Audit.

### ✅ Complete (production)

| Area | Details | Verified |
|------|---------|----------|
| **Neon DB + RLS** | Hub/partner schema, 62+ policies | RLS script pass |
| **Public website** | DB-driven landing, gated pricing via `lib/copy/public.ts` | No `text-gray-*` on public `app/` routes |
| **API §4.7 gaps** | `GET /api/bookings`, `PATCH/DELETE /api/menu/[itemId]`, `/api/staff/[id]`, staff shifts | Route files present |
| **Cash + PWA + session** | Reconciliation, offline queue, 30m/8h timeout | Implemented per Phase 2–4 |
| **Security hardening** | CORS domain-locked, debug auth 404 in prod, `sanitizeErrorDetails` | Code review May 16 |
| **TypeScript** | Clean compile | `tsc` exit 0 |
| **Digital menu (`/dining`)** | DB-only menu, full-menu book, analytics favourites, image seed/validate scripts | §3.1.1 |
| **Scripts hygiene** | 33 ad-hoc scripts under `scripts/archive/` | `ls scripts/archive` |
| **E2E coverage** | 7 Playwright specs incl. `gated-pricing`, `public-components` | `e2e/*.spec.ts` |

### 🟡 In progress / operator action

| Item | Priority | Status |
|------|----------|--------|
| **RAG ingestion to Qdrant** | P0 | Config OK (`voyage-3` + 1024 per `.env.example`); run `scripts/ingest-hotel-etuna-knowledge.ts` when Voyage rate limits allow |
| **Production smoke** | P1 | Manual §0 on https://hoteletuna.com after each deploy |
| **npm audit (transitive)** | P1 | **0 critical** at `npm audit --audit-level=critical` (overrides in `package.json` for `fast-xml-parser`, `protobufjs`); **17** total advisories — run `npm audit fix` for non-breaking updates before release |
| **UI enhancements** | P2 | Extract `RoomCard`/`ReviewCard`; skeleton loaders; `globals.css` khaki focus rings |

---

## 13. Implementation Phases & Timeline

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE
- ✅ Neon database setup and migration
- ✅ Remove Supabase dependencies
- ✅ Hub tenant pre-seeding
- ✅ Hotel Etuna branding applied
- ✅ Public website launch (hub only)

### Phase 2: Partner Infrastructure (Weeks 3-4) ✅ COMPLETE
- ✅ Partner invite/claim flow
- ✅ Partner dashboard UI
- ✅ Tenant isolation middleware
- ✅ Commission calculation logic
- ✅ RLS policy enforcement

### Phase 3: Partner Listings & Bookings (Weeks 5-6) ✅ COMPLETE
- ✅ Public partner directory page
- ✅ Dynamic partner listing pages (`/partners/[slug]`)
- ✅ Unified booking widget with partner context
- ✅ Commission tracking in hub dashboard

### Phase 4: Database-Driven Content (Week 7) ✅ COMPLETE
- ✅ Landing page refactored to query database
- ✅ Review approval workflow implemented
- ✅ All room, restaurant, partner data dynamic

### Phase 5: Sofia Embedding Migration 🟡
- ✅ Voyage client + `EMBEDDING_MODEL=voyage-3` / `EMBEDDING_DIMENSIONS=1024` documented in `.env.example`
- ⏳ Full Qdrant upsert — operator runs ingestion script (external rate limits)

### Phase 6: Testing & Launch Hardening ✅
- ✅ Vitest suite (334 tests per last full run; re-verify: `npm run verify:production`)
- ✅ Playwright: gated-pricing + public-components specs added
- ✅ Sofia email FK fixture fix (tenant-scoped test data)

### Phase 7: Cleanup & Documentation Lock ✅
- ✅ Scripts archived (`scripts/archive/`, 33 files)
- ✅ Canonical docs: PRD / PLANNING / TASK only (+ rebrand + README)
- ✅ May 16 audit snapshots merged into §12 and TASK; redundant `docs/*_2026-05-16.md` removed

---

## 14. Change Control & Governance

### 14.1 PRD Updates

- **Material Changes:** Any scope addition/removal, architectural shift, or KPI modification requires PRD update in the same PR/commit as the implementation.
- **Non-Material Changes:** Bug fixes, UI polish, and minor copy changes do not require PRD updates but should be documented in `CHANGELOG.md`.
- **Approval Process:** Material changes require sign-off from Hotel Etuna management and engineering lead.

### 14.2 Partner Policy Changes

- **Commission Rate Adjustments:** Require 30-day notice to affected partners via email.
- **Terms of Service Updates:** Partners must acknowledge updated terms before next payout.
- **Feature Deprecation:** Minimum 90-day deprecation notice with migration path provided.

### 14.3 Technical Debt Management

- **Monthly Review:** Engineering team reviews technical debt backlog.
- **Quarterly Prioritization:** Balance new features with debt paydown (target: 20% of sprint capacity for debt).
- **Critical Debt:** Security vulnerabilities, performance bottlenecks, or RLS bypasses are P0 and addressed immediately.

### 14.4 Compliance & Audit

- **Quarterly Compliance Review:** Verify PSD-12, PSD-4, ETA 2019 adherence.
- **Annual Security Audit:** External penetration testing and vulnerability assessment.
- **Partner Verification:** KYC/KYB documentation reviewed annually per Bank of Namibia requirements.

---

## 15. Appendices

### Appendix A: Partner Invite Email Template

```
Subject: You're Invited to Join Hotel Etuna's Partner Network

Dear [Partner Name],

Hotel Etuna is building a curated network of trusted lodging partners in Windhoek, and we'd love to include [Property Name].

By joining our platform, you'll:
✓ Get featured on our website (hoteletuna.com)
✓ Access our easy-to-use booking management dashboard
✓ Reach Hotel Etuna's established guest network
✓ Receive booking notifications and commission reports
✓ Simple setup with no monthly fees

Commission: 10% on bookings made through our platform
(We handle booking collection; you manage guest communications directly)

Click here to get started: [Claim Invite Link]

Questions? Reply to this email or call us at +264 XXX XXXX.

Warm regards,
The Hotel Etuna Team
```

### Appendix B: Key Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| **Product Owner** | Hotel Etuna Management | Strategic direction, partner selection, KPI approval |
| **Engineering Lead** | TBD | Technical architecture, deployment, performance |
| **Design Lead** | TBD | Hub and partner UI/UX, branding consistency |
| **QA Lead** | TBD | Test strategy, E2E automation, compliance verification |
| **Partner Success Manager** | TBD | Partner onboarding, support, relationship management |

### Appendix C: Glossary

- **Hub Tenant:** Hotel Etuna's central tenant with elevated platform permissions
- **Partner Tenant:** Invited property with isolated self-service dashboard
- **Commission:** Percentage of partner booking revenue retained by Hotel Etuna
- **RLS:** Row Level Security (PostgreSQL feature for tenant isolation)
- **Neon:** Serverless PostgreSQL database provider
- **Sofia AI:** Multi-channel AI concierge with RAG knowledge base (exclusive to Hotel Etuna hub tenant; not available to partners)
- **Qdrant:** Vector database for Sofia's semantic search
- **Slug:** URL-friendly property identifier (e.g., `jayla-accommodation`)
- **Gated Content:** Content strategy where prices/booking are hidden until user authentication
- **ISR:** Incremental Static Regeneration (Next.js caching strategy)
- **AuthGate:** React Context managing authentication state for content gating
- **Adumo Virtual:** Namibian hosted card page (JWT form POST) — primary guest card rail

### Appendix D: External References

- **System Design Master Guide:** `SYSTEM_DESIGN_MASTER_GUIDE.md` (repo root) — foundations, DB/API design, scaling, CAP, security, AI security prompt pack; Hotel Etuna excerpts in PRD §6.6, §4.3.2, §11.5–11.6; PLANNING.md architecture sections; TASK.md verification
- **Buffr Host PRD:** `/Users/georgenekwaya/Downloads/ai-agent-mastery-main/buffr-host/PRD.md`
- **Neon Documentation:** https://neon.tech/docs
- **Bank of Namibia PSD-12:** Payment systems directive (compliance)
- **Adumo Virtual integration:** `initialisevirtual`, JWT request/response tokens — https://developers.adumoonline.com
- **Vercel Deployment Guide:** https://vercel.com/docs
- **Qdrant Documentation:** https://qdrant.tech/documentation
- **Testing & smoke:** `docs/project/TASK.md` § Production smoke  
- **Deployment:** `docs/project/TASK.md` § Deployment checklist  
- **Architecture:** `docs/project/PLANNING.md`  
- **Brand (full):** `docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md`

### Appendix E: Public Content Accuracy & Landing Structure

Public copy is aligned to seeded Neon data (no fictional amenities). Canonical facts:

| Area | Notes |
|------|--------|
| **Rooms** | Slugs: `standard-room`, `luxury-room`, `family-room`, `executive-suite`, `premier-room`; Premier Room must not advertise amenities absent from DB (e.g. private pool). |
| **Contact** | 5544 Valley Street, Ongwediva; +264 65 231 177; +264 81 802 4833; check-in 14:00, check-out 11:00. |
| **Etuna Restaurant** | Name “Etuna Restaurant”; breakfast **07:00–10:00**; lunch, dinner & bar **10:00–22:00**. |
| **Partners** | JayLa: four self-catering rooms; Aquarius: one double-room penthouse — copy matches tenant/property records. |
| **Tours** | **Not offered** on the public site or in RAG (v2.7.2). `/tours` must 404; no nav/footer links. |

**Gated content verification (manual):** Incognito — prices hidden on `/`, `/rooms`, `/dining`, `/partners`; login preserves `?redirect=`; Sofia refuses rate/availability prompts without auth (see Section 3).

---

## 14. Documentation canon (May 2026)

Project documentation is consolidated into **three files only**:

| File | Purpose |
|------|---------|
| **`docs/project/PRD.md`** | Product requirements, capabilities, design direction, appendices |
| **`docs/project/PLANNING.md`** | Architecture, phases, folio, word copy, dev hygiene |
| **`docs/project/TASK.md`** | Checklists, testing, deployment, open items |
| **`SYSTEM_DESIGN_MASTER_GUIDE.md`** (repo root) | Full system design course; Hotel Etuna excerpts only in the three files above |

Former scattered docs under `docs/reports/` and legacy checklists were **deleted** after consolidation (May 2026). **May 16, 2026:** agent audit reports (`SECURITY_*`, `CODING_RULES_*`, `COMPREHENSIVE_*`, `IMPLEMENTATION_GAPS_*`, `RAG_CONFIG_*`) were **merged into PRD §12, PLANNING § Verified Audit, and TASK § Verified Implementation Audit**, then **deleted** to avoid doc proliferation.

Do not add new project `.md` files — extend **PRD**, **PLANNING**, or **TASK** only (plus the shared master guide at repo root).

**Kept separate (not merged):** `docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md` (full brand strategy), `data/hotel-etuna-knowledge/*.md` (Sofia corpus), `README.md` (onboarding).

---

## 15. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-28 | Engineering Team | Initial PRD for single-tenant Hotel Etuna |
| 2.0.0 | 2026-04-28 | Engineering Team | Added B2B partner network, self-service portal, Neon DB migration, hub-and-spoke architecture, database-driven landing page, review approval workflow |
| **2.1.0** | **2026-04-28** | **Engineering Team** | **Added gated content strategy (Section 3): authentication wall for prices/booking, Sofia AI gated enforcement, sign-up conversion KPIs, implementation phases updated, restored full PRD detail** |
| **2.2.0** | **2026-04-28** | **Engineering Team** | **Aligned status with completed Phases 1-4 (public hardening, cash/reconciliation, PWA/offline, session security) and re-baselined remaining work to Phases 5-7 (Voyage ingestion, test stabilization, cleanup/docs).** |
| **2.3.0** | **2026-04-29** | **Engineering Team** | **Consolidated scattered root documentation into canonical `docs/project/*`; added Appendix E (public content accuracy, gated verification pointer); updated references to `docs/TESTING_GUIDE.md`.** |
| **2.3.1** | **2026-05-13** | **Product / engineering** | **Added §7.5 pointer to `docs/REBRAND_QUESTIONNAIRE_AND_LANDSCAPE.md` (brand questionnaire answers, competitor landscape, positioning).** |
| **2.3.2** | **2026-05-13** | **Product / engineering** | **Expanded §7.5 to cover Playing to Win, Four Seasons analogy, MBA Project 9, wordmark-first logo (rebrand doc v1.1).** |
| **2.4.0** | **2026-05-16** | **Product Team** | **Major consolidation:** personas, technical stack, knowledge base, partner network, room inventory; single source of truth for product requirements. |
| **2.4.1** | **2026-05-16** | **Product Team** | **§4.6 Repository structure:** full `tree` output (depth 3), top-level and route-group maps; §4.3 `proxy.ts`; Next.js 16 in §4.1. |
| **2.5.0** | **2026-05-16** | **Product Team** | **§4.2** full database schema (81 tables, RLS, enums, migrations); **§4.3.1** API auth legend; **§4.7** API ↔ DB ↔ frontend mapping (113 routes, gaps documented). |
| **2.6.0** | **2026-05-16** | **Product Team** | **Incorporated `SYSTEM_DESIGN_MASTER_GUIDE.md`:** §4.3.2 REST conventions; §6.6 scale/CAP/caching/principles/security; §11.5–11.6 request flow + data modeling; Appendix D link. |
| **2.7.0** | **2026-05-16** | **Product Team** | **§12** re-baselined from codebase verification (117 API routes, §4.7 gaps closed, security/UI audit results); Phases 5–7 status updated; doc canon enforces single source of truth. |
| **2.7.1** | **2026-05-16** | **Product Team** | **§9.7** logo mark spec (merged from `LOGO_UPDATE_2026-05-16.md`); §9.1–9.4 numbering fixed; standalone logo doc removed. |
| **2.7.2** | **2026-05-16** | **Product Team** | **Tours product removed** from public site, nav, proxy, Sofia knowledge (`tours-guide.md`), copy, and PRD route/landing tables; `/tours` route deleted. |
| **2.7.3** | **2026-05-16** | **Product Team** | **Doc canon:** §1 out-of-scope tours; §4.4/§4.6/§10/Appendix E aligned; landing section numbering fixed; PLANNING/TASK updated. |
| **2.7.4** | **2026-05-16** | **Product Team** | Restaurant hours **07:00–10:00** / **10:00–22:00**; menu/inventory aligned; PLANNING payment strategy + Sofia smoke test updated. |
| **2.7.5** | **2026-05-16** | **Product Team** | **Adumo Virtual** implemented (hosted page, JWT, `payment_sessions`, webhooks); **RealPay out of scope**; Enterprise API deprecated for guests. |
| **2.7.6** | **2026-05-16** | **Product Team** | Folio P0 marked in production; NamQR desk at `/payments/desk`; restaurant F&B inventory migration `0011`. |
| **2.7.7** | **2026-05-16** | **Product Team** | **Doc drift fix:** §3.4 deployment verification table; NamQR compliance paths; API route count **136**; §12 npm audit **0 critical** with overrides; migration **0011** in §4.2.7. |
| **2.7.8** | **2026-05-16** | **Product Team** | **§3.1.1** public digital menu book: DB-only load, `image_url` thumbs + seed scripts, analytics guest favourites, single full-menu `MenuBookFullMenu` (no category tabs/search); §5 `/dining` visibility aligned. |

---

*This PRD (v2.7.8) is effective May 16, 2026 and supersedes all previous versions. It will be reviewed quarterly with Hotel Etuna management and updated as needed. All implementation teams must reference this document as the source of truth for product requirements, architecture decisions, and success metrics.*
