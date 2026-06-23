# Hotel Etuna — Product Requirements Document (PRD)

**Version:** 2.10.0  
**Date:** June 8, 2026  
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

### 1.1 Product Vision — Agentic CRM & Intelligent OS (June 8, 2026)

**Core promise:** *“An OS that anticipates, adapts, and elevates every stay.”*

Hotel Etuna is evolving from a production PMS/CRM into a **single‑property intelligence platform** that fuses three non‑negotiable pillars into every new feature:

| Pillar | Definition | Why it matters |
|--------|------------|----------------|
| **Agentic CRM** | A relationship system that **initiates** actions, not just records them — uses guest memory, preferences, and real‑time signals to send offers, schedule services, and escalate needs without human clicks. | Guests feel remembered; staff are freed from manual follow‑ups. |
| **Intelligent OS** | The engine orchestrating all operations (rooms, F&B, housekeeping, maintenance, revenue, payments, compliance) with predictive algorithms, real‑time alerts, and automated workflows. | Removes friction, eliminates silos, turns data into revenue. |
| **Beautiful UX** | Calm, intuitive, emotionally‑aligned design (nude surfaces + CI palette, `ink` text ramp, Playfair, pill buttons, micro‑interactions) — see §9. | Drives adoption, cuts training time, creates brand love. |

The strategic goal: move every guest touchpoint from **transactional → relationship‑building**, and every staff workflow from **reactive → proactive**. This vision **builds on** the shipped foundation (§3, §12) — it does not replace the as‑built spec; existing architectural guardrails (Neon + Drizzle, NextAuth/Stack dual‑auth, Adumo Virtual + cash, hub‑and‑spoke RLS, Sofia hub‑exclusivity, `security:preflight`) remain binding (§6, §11; PLANNING § Architecture Decisions).

**Five goals (detail in §13 roadmap + `TASK.md` § Vision):**

1. **Guest Command Centre** — A `/guest` hub that feels like a personal concierge across pre‑arrival (magic‑link welcome, document vault, room selection, digital check‑in), in‑stay (service/maintenance requests, room‑service, upgrade/downgrade, messaging, folio widget), and post‑stay (auto‑checkout, loyalty rewards, feedback, re‑engagement). Plus **agentic actions** with no guest input (birthday surprise, repeat‑guest recognition, weather nudges, silent loyalty upgrades).
2. **Staff Intelligence Layer** — Real‑time command‑centre dashboard, colour‑coded smart alerts, voice commands, predictive housekeeping/maintenance routing, revenue intelligence, low‑stock reorder recommendations (staff‑approved), mobile‑first PWA with push, cross‑department visibility.
3. **Sofia as a true co‑pilot** — Proactive nudges, sentiment detection + human handover, multi‑channel context (web/WhatsApp/email/voice), language auto‑detection, layered memory (session/long‑term/episodic), and autonomous revenue actions (upgrade offers, late‑night dining, complaint remediation). Remains **hub‑exclusive**; partners get no AI.
4. **Intelligent Operations (the OS)** — Occupancy/ADR/RevPAR forecasting that produces **rate recommendations** (never auto‑applied — admin or front desk must approve before any rate changes), smart inventory (F&B, linen, minibar) with **approval‑gated reorder recommendations**, predictive maintenance from complaint data, and compliance automation (POPIA anonymisation, PCI boundary, immutable audit). No OTA/channel‑manager sync — Namibia has no Booking.com/Expedia two‑way integration in scope.
5. **Beautiful & delightful UX** — Locked visual identity (§9), zero‑wait skeletons, micro‑transitions, offline‑first queue, keyboard shortcuts, WCAG 2.1 AA, and warm, locally‑flavoured copy.

**Roadmap:** ~16 weeks across 5 phases (§13 Phases 8–12), each delivering business value independently. Targets in §8 (Vision metrics).

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

### 2.4 Platform actors (personas → roles → product surfaces)

Marketing personas in **§2.1** describe *who books and why*. The table below maps them to **system actors** in **§3.6** (RBAC, journeys, can/cannot).

| Marketing persona (§2.1) | Typical system role | Primary journey | Sign-in entry | Home surface | Can do (summary) | Cannot do |
|--------------------------|---------------------|-----------------|---------------|--------------|------------------|-----------|
| Corporate / government traveller | **`guest`** | J2 → J3 → J4 | Header → `/login?redirect=/guest` | `/guest` | Register, book (gated rates), view own stays/folio, pay deposit, loyalty | Staff dashboard, Sofia admin, other guests’ data |
| Trade fair / conference attendee | **`guest`** | J2 → J3 → J4 | Same | `/guest` | Same as guest | Same |
| Family / leisure traveller | **`guest`** | J2 → J3 → J4 | Same | `/guest` | Same as guest | Same |
| International visitor | **`guest`** | J1 → J2 → J3 → J4 | Same | `/guest` | Public browse; after verify: book + in-stay hub | Rates/booking while anonymous |
| Anonymous visitor (pre-account) | — | J1 | — | `/`, `/rooms`, `/dining` | Marketing, digital menu, partner directory | Prices, complete booking, folio |
| Front desk / F&B / ops | **`staff`** | J5 | Footer → `/login?redirect=/dashboard` | `/dashboard` | Bookings, check-in/out, restaurant, payments desk | `/api/guest/*` consumer APIs; cross-tenant data |
| Hotel manager / owner | **`manager`** / **`owner`** | J5 | Footer staff login | `/dashboard`, `/settings`, `/payments/*` | All hub ops + reconciliation, VAT reports, staff | Partner tenants; platform console |
| Partner lodge operator | **`partner_*`** (partner tenant) | J6 | Invite / partner login | `/partner/*` | Own properties, bookings, rates | Hub Sofia, hub CRM, `/api/guest/stays/*`, other tenants |
| Buffr platform operator | **`super-admin`** / **`admin`** | J7 | Footer staff login | `/admin/platform` | Cross-tenant users, tenants, properties, audit | N/A (platform scope) |

**Identity rules (all guest personas):**

- Login account: `users` with `role: guest` on **hub tenant** (`HUB_TENANT_ID`).
- Stay visibility: `users.email` must match `guests.email` on the booking; email **verified** + `guests.is_signed_up`.
- Legacy role **`user`** is treated like **`guest`** for routing and `/api/guest/*`.

**Staff vs guest UX:** Travellers use the **header** sign-in and land on **`/guest`**. Hotel and Buffr operators use the **footer** staff login and land on **`/dashboard`** or **`/admin/platform`** (`lib/auth/roles.ts`, `PublicAuthNav`).

**Anti-personas (§2.2)** remain out of product scope; they do not receive a dedicated role or surface.

---

## 3. Core Capabilities (In Scope)

### 2.1 Hotel Etuna (Hub Tenant) — Core Operations

| Domain | Requirements |
|--------|----------------|
| **PMS** | Complete property management for Hotel Etuna: Standard Room (Types A/B/C), Executive Room, Premiere Room, dynamic rates (editable via admin), availability calendar, online booking flow, booking lifecycle (confirmed → checked‑in → checked‑out → completed/cancelled). Hub admin can view all bookings (own + partners) for commission reporting. |
| **Restaurant** | Etuna Restaurant: **12 menu categories**, **~110+ live items** in Neon (`menu_categories` + `cms_menu_items`; catalog `lib/data/etuna-restaurant-menu-catalog.ts` for seed/reference). **Public digital menu** on `/dining` (§3.1.1 — single-page, 2×3 food grid). Table QR dine‑in, **in‑room room service** (checked‑in only) on **stay folio** (`booking_charges`), order lifecycle (pending → preparing → served). **Hours:** breakfast **07:00–10:00**; lunch, dinner & bar orders **10:00–22:00** (`lib/dining/restaurant-hours.ts`). **Signature dishes:** Full Breakfast, King Klip, Oxtail, Lamb Curry, Etuna Chicken Mushroom pizza. **F&B inventory:** SKU-level stock + low-stock alerts (`database/drizzle/0011_fnb_inventory.sql`, `lib/services/inventory/InventoryService.ts`). APIs: `GET /api/public/room-qr/[code]`, `GET/POST /api/guest/stays/[bookingId]/folio|orders|settle`. |
| **Guest CRM** | Comprehensive guest profiles, preferences, **CRM memory** (facts, relationship edges), contact history, marketing consent. **`guest_profiles`** holds **loyalty tier/points** (permanent); **`booking_charges`** holds **per‑stay folio** (room + F&B + settlement) — not duplicated. **Loyalty program:** Earn 1 point per N$10 spent on folio settlement; redeem 100 points = N$50 folio adjustment. `/api/crm/*` endpoints accessible by hub admin across all properties. |
| **Staff & Dashboard** | Role‑based access for Hotel Etuna staff (owner, manager, front‑desk, housekeeping, kitchen). Staff CRUD at `/staff`, edit at `/staff/[id]/edit`, schedules at `/staff/[id]/schedule`. **Payroll (Namibia):** integrated PAYE + SSC at `/payroll` (founder/admin only); exports align with NamRA refs in `TAX_AND_NAMRA_COMPLIANCE.md` §6.1. Audit logging for all sensitive actions. |
| **Deposits & commission** | Booking `deposit_percent` (default 30%) drives checkout partial amount; partner commission report at `/reports/commission`. |
| **Open banking** | NamQR v5.0 primary rail; PIS via BON endpoints (`/api/bon/v1/banking/payments`) with PSD‑12 step‑up 2FA — see `mba-agent/regulatory/namibia/namibia_open_banking_standards.md`. |
| **Communications** | Sofia AI voice/web chat, WhatsApp (Meta Cloud API), `/communications` hub for front desk/support, support tickets. Email automation (booking confirmations, check‑in reminders, post‑stay thank you). **Hub tenant only** — partners do not have Sofia AI or email automation. Meta Cloud API is the sole production WhatsApp provider (the unofficial OpenWA/WhatsApp-Web sidecar was removed). |
| **Support** | Platform support tickets for hotel staff and partners. Integrated issue tracker for bug reports, feature requests. Hub admin can view all support tickets. |
| **Compliance & Risk** | Consumer rights / cyber incident lifecycles; **KYC/KYB for Hotel Etuna and all partners**. Court‑admissible audit themes. All regulatory requirements (PSD‑12, PSD‑4, ETA 2019) apply platform‑wide. |
| **AI (Sofia)** | **Hub‑exclusive AI concierge** with knowledge base for Hotel Etuna only. RAG over Hotel Etuna property documents, guest preferences, CRM memory. **Knowledge base contains 4 documents** (hotel facts, room descriptions, restaurant menu, local area info), **~27 semantic chunks**, **Qdrant Cloud Inference** (`intfloat/multilingual-e5-small`, **384d**), collection **`buffr_rag`**. Human escalation for low confidence or policy keywords. **Partners do not have access to Sofia AI or any AI features.** Sofia enforces gated content: will not disclose prices or availability to unauthenticated users, instead prompts sign‑up. **Ingestion:** `npm run rag:seed` — semantic chunking (~800 chars, 100-char overlap), Qdrant Inference upsert, tenant-scoped `buffr_rag`. **Conversations** persist in Neon (`ai_conversations` / `ai_messages`, tenant-scoped history). **Long-term guest memory:** Neon `crm_guest_memory_facts` + `crm_graph_edges` (auto-written after each turn via `SofiaGuestFactExtractor`); optional Mem0 mirror if `MEM0_API_KEY` set — **not** Ava-style `long_term_memory` in Qdrant. **Restaurant flow state:** `ai_conversations.context` JSONB + `dining_reservations`. |
| **Guest‑Facing Website** | Public homepage with hero, **room photo tours** (`/rooms`, `/rooms/[slug]` — §3.1.2), restaurant digital menu (`/dining` — §3.1.1), photo gallery, contact page, **plus** a "Referral Partners" section showcasing partner properties. Fully branded with Hotel Etuna visual identity. **✅ Database‑driven** — all content pulled live from Neon DB. **✅ Review approval workflow** (`is_public` toggle in admin dashboard at `/crm/reviews` — filter by status, sort by date/rating, real-time optimistic UI updates). **✅ Gated content model** — prices/booking hidden until login; room tours and menu browse are public. **✅ ISR caching: 5-minute revalidation** for performance. **Contact details verified:** 5544 Valley Street, Ongwediva; +264 65 231 177; +264 81 802 4833; check-in 14:00, check-out 11:00. **All room slugs:** `standard-room-type-a`, `standard-room-type-b`, `standard-room-type-c`, `executive-room`, `premiere-room`. |
| **Platform** | Hub‑and‑spoke multi‑tenancy with `tenant_type` distinction. Hub admin has elevated permissions. Domain: `hoteletuna.com` with partner subpages at `/partners/[slug]`. |

#### 3.1.1 Public digital menu (`/dining`)

| Layer | Implementation |
|-------|----------------|
| **Data** | `getCompleteMenu()` (`lib/data/dining.ts`) loads **only** from Neon — no runtime catalog fallback. `serializePublicMenu()` (`lib/dining/serialize-public-menu.ts`) builds the client payload; `is_available = true` filter applied. |
| **Images** | Dish photos from `cms_menu_items.image_url`. Seeded/validated via `npm run seed:menu-images` / `validate:menu-images` / `seed:menu-images:full` (`scripts/seed-menu-images.ts`, `lib/data/menu-item-image-urls.ts`, **480×360** thumbs; Unsplash + Wikimedia; `next.config.ts` remote patterns). |
| **Guest favourites** | Top dishes from **order analytics (90 days)** — `MenuPopularityService` + `featuredMenuItemIds` passed into serializer (not hardcoded dish names). |
| **UX** | `PublicMenuBoard` → optional **Guest favourites** horizontal strip, then **single-page full menu** (`MenuBookFullMenu` → `MenuBookSinglePageViewer`) with **all categories and items** in display order. **No category tabs, search bar, or dish-count helper** above the menu. |
| **Navigation** | **One full-width page at a time** with **Previous** / **Next** (keyboard ← →). Cover → section index → category pages. Chunking (`lib/dining/menu-book-pagination.ts`): **food = 6 items per page (2×3 grid)** with thumbnail + **name, description (when set), dietary tags, NAD price** on each tile; **drinks = compact list (8 per page, no thumbnails**, name + description + price). Tap tile → `MenuBookItemDetailDialog`. Legacy two-page 3D book (`MenuPageTurner`) retained in repo but **not used** on `/dining`. |
| **Components** | `PublicMenuBoard`, `MenuBookFullMenu`, `MenuBookSinglePageViewer`, `MenuBookFullMenuCoverFace`, `MenuBookItemsFace`, `MenuBookItemTile`, `MenuBookItemDetailDialog`, `MenuBookContinueFace`, `PublicMenuFeaturedCard`. Pagination: `lib/dining/menu-book-pagination.ts` (`FOOD_GRID_ITEMS_PER_FACE = 6`). CMS: `BasicInfoForm` (create + edit). |
| **CMS** | Staff edit name, description, price, `image_url`, availability at `/menu/[itemId]/edit` → `PATCH /api/menu/[itemId]` (`MenuService.updateMenuItem`). Restaurant menu UI links to same editor. |
| **Ordering** | Public `/dining` is **view-only** (browse + prices). Banner + CTA: sign in to order (`publicCopy.gated.menuBrowseOnly`). Checked-in guests order via guest stay / folio flows (authenticated). |

**Operator notes:** After bulk menu or image changes, run `npm run seed:menu-images:full` on Neon, or set image URLs in CMS. Homepage/landing dining teaser may still gate prices; `/dining` shows **full menu with NAD prices** for all visitors.

#### 3.1.2 Public room photo tours (`/rooms`, `/rooms/[slug]`)

| Layer | Implementation |
|-------|----------------|
| **Data** | `getHubRooms()` / `getRoomBySlug()` (`lib/data/rooms.ts`) — resolves hub property via **`resolvePublicHubProperty()`** (same as landing), then loads `rooms` excluding maintenance/out-of-order (case-insensitive). `export const dynamic = 'force-dynamic'` on `/rooms` pages. Public copy/tour stops: **`lib/rooms/room-display.ts`**. |
| **Listing UX** | `/rooms` + **`#tour`** on filmstrip (`id="tour"`): `PublicRoomsBrowseBanner`, `PublicRoomsSignedInBanner`, `RoomsIncludedStrip`, **`RoomsFilmstrip`** (no prices on cards; **Take the tour** → `/rooms/[slug]#tour`; guests see “Rates hidden — sign in to view”). |
| **Detail UX** | **Same `RoomPhotoTour` for everyone** (guests and signed-in). Guests: sidebar hidden; inline **`PublicRoomTourSignInCard`** under tour (no NAD typography). Signed-in: client **`RoomBookingCard`** (`useSession`) shows live rates + **`LandingBookingWidget`** at `#booking`; CTA **Complete your booking** scrolls to widget. |
| **Gating** | Public pages never render room `baseRate` in tour UI. `formatPublicRoomRateLabel` + `lib/rooms/public-rate.ts` precompute card copy server-side; **`POST/GET /api/bookings/availability`** omits `baseRate` for unauthenticated callers. Homepage room cards + filmstrip link to `#tour`; prices only after login (`getServerSession` on `/` and `/rooms`). Booking completion requires account. |
| **Premier** | Six stops: overview, lounge, master bedroom, twin room, bathroom, balcony. Sleeps **4** (private lounge + master + twin configuration). Seed: `scripts/seed-hotel-etuna.ts` — `max_occupancy = 4`, amenities include **Mini fridge**. |
| **Images** | Prefer `rooms.images[]` when set; otherwise hospitality fallbacks under `/images/hospitality/*` per slug in `room-display.ts`. Replace with property photography via CMS/DB when available. |
| **Components** | `RoomPhotoTour`, `RoomsFilmstrip`, `RoomsIncludedStrip`, `PublicRoomsBrowseBanner`, `PublicRoomTourSignInCard`, `RoomBookingCard`. |
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

**Physical inventory:** **35 guest rooms** (`rooms.inventory_kind = guest_room`) plus **2 bookable facilities** (`conference`, `campsite`). Source of truth: `lib/data/hotel-etuna-room-inventory.ts`; migrations `0040`–`0042`. Public marketing shows **5 category cards** via `getHubRoomTypeCatalog()`; staff/PMS lists all units via `getHubGuestRooms()`.

**Room tiers and pricing (verified against database):**

| Room Type | Slug | Base Rate | Units | Max Occupancy | Key Amenities (Verified) |
|-----------|------|-----------|-------|---------------|--------------------------|
| Standard Room (Type A) | `standard-room-type-a` | NAD 800/night | 5, 6, 8, 17, 19, 21 | 2 | Double bed, WiFi, Aircon, TV, Minibar, Coffee/Tea, Mosquito Net, Desk |
| Standard Room (Type B) | `standard-room-type-b` | NAD 800/night | 7–16, 18, 20 (incl. `14`) | 2 | Two single beds, same essentials as Type A |
| Standard Room (Type C) | `standard-room-type-c` | NAD 1,200/night | 2, 3, 4 | 3 | Double + single bed |
| Executive Room | `executive-room` | NAD 1,000/night | 22, E1–E6, E8–E13 | 2 | Work desk, VIP toiletries, lounge access |
| Premiere Room | `premiere-room` | NAD 2,000/night | E7, E14 | 4 | Private lounge, master + twin, balcony, 2 bathrooms |

**Facilities (online booking):**

| Offering | Inventory | Pricing | Route |
|----------|-----------|---------|-------|
| Conference Hall (one) | `inventory_kind = conference` | NAD 1,200/session, 08:00–17:00, one session per calendar day | `/facilities/conference` |
| Campsite (whole site, one) | `inventory_kind = campsite` | NAD 250/NAD 400 per person (Namibian/non-Namibian); total = max(NAD 1,200, sum) | `/facilities/campsite` |

Legacy demo rows (`ET-*`) are set `out_of_order`, not deleted, to preserve historical `booking_rooms` links.

**Fictional amenities removed during frontend audit:**
- ❌ "Private Pool" (Premiere Room) — does not exist
- ❌ "Butler Service" (Premiere Room) — not offered
- ❌ "Spa Bath" (Premiere Room) — not available
- ❌ Generic "Queen Bed" / "King Bed" claims without verification
- ❌ "Bathtub" claims for standard rooms
- ❌ Legacy Luxury/Family room tiers — retired; use Standard Types B/C instead

**Amenity standardization across property:**
- **Shared amenities:** Outdoor pool, free parking, 24/7 security, braai area, restaurant, conference facilities
- **Standard in all rooms:** **Mini fridge**, WiFi, air conditioning, TV, mosquito net protection
- **Premium tiers:** Bathrobes (Premiere), VIP toiletries (Executive, Premiere), lounge access (Executive, Premiere)
- **Contact-verified:** Address (5544 Valley Street), phones (+264 65 231 177, +264 81 802 4833), check-in 14:00, check-out 11:00

> Partner network requirements are defined once in **§3.2** (do not duplicate here).

**Source-of-truth paths (room & facility inventory):**

| Layer | Path |
|-------|------|
| Constants & rates | `lib/constants/hotel-etuna-room-types.ts` |
| Physical units + facility metadata | `lib/data/hotel-etuna-room-inventory.ts` |
| Public marketing (5 cards) | `lib/data/room-type-catalog.ts` → `getHubRoomTypeCatalog()` |
| All guest units (35) / facility rows | `lib/data/rooms.ts` → `getHubGuestRooms()` / `getHubFacilityRooms()` |
| Facility pricing & booking | `lib/services/booking/FacilityBookingPricing.ts`, `BookingService.createFacilityBooking` |
| API | `app/api/bookings/route.ts` (discriminated by `bookingKind`), `app/api/bookings/facility-availability/route.ts` |
| Migrations | `0040`–`0043` (facility internal keys `facility:conference` / `facility:campsite`) |
| Seed / RAG | `scripts/seed-hotel-etuna.ts`; `data/hotel-etuna-knowledge/room-descriptions.md` (`npm run rag:seed`) |
| Wired surfaces | ops calendar `BookingsOperationsHub`; folio `FolioService.ensureBookingChargeForBooking`; analytics/accounting split; Sofia `KnowledgeBaseService` |

Guest vs facility rows split by `inventory_kind` only; display labels in `lib/rooms/inventory-display.ts`.

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
| ☐ | Staff folio on booking detail | `components/features/booking/BookingFolioSection.tsx` | Hub booking detail → cash/card settle, line items, balance |
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

**Purposes:** `booking_deposit` (updates `bookings.payment_status`, `transactions`, `booking_charges` payment line) · `folio_settle` (calls `FolioService.settleFolio` with `gatewayTransactionId`) · `dining_deposit` (Sofia table reservation — `dining_reservations` + optional in-stay folio payment line when `metadata.stay_booking_id` is set).

**Dining deposit (Sofia / Enish-style):** Guest email link → `/restaurant/reservation/pay?code=…` → `POST /api/restaurant/reservations/pay/initiate` → Adumo hosted page → `completeAdumoVirtualPayment` with `purpose: dining_deposit`. Cancel: `POST /api/restaurant/reservations/cancel` (booking code + OTP). Migrations: `0018_dining_reservations.sql`, `0019_dining_adumo_payment_sessions.sql`.

**Env (test):** `ADUMO_BASE_URL=https://staging-apiv3.adumoonline.com`, `ADUMO_MERCHANT_UID`, `ADUMO_APPLICATION_UID`, `ADUMO_JWT_SECRET`, `ADUMO_REDIRECT_SUCCESS_URL`, `ADUMO_REDIRECT_FAIL_URL`, `ADUMO_WEBHOOK_URL`. Test Merchant UID / JWT secret per Adumo Virtual docs; 3DS Application UID `23ADADC0-DA2D-4DAC-A128-4845A5D71293`.

**Code:** `lib/config/adumo.ts`, `lib/services/payment/AdumoVirtualService.ts`, `lib/services/payment/completeAdumoVirtualPayment.ts`, `payment_sessions` table (`database/drizzle/0012_adumo_virtual_payment_sessions.sql`).

**Not in codebase:** Stripe, RealPay, Adumo Enterprise (server-posted PAN). Card checkout = Virtual only.

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

**Commercial terms (Buffr ↔ Etuna):** platform-fee, **dual VAT** (Etuna property NamRA reporting + Buffr platform invoices), and SLA terms are handled with counsel out-of-band (no in-repo proposal doc). Technical canon: `PLANNING.md` § Payment strategy; UI `/reports/property-vat`; code: `lib/platform/namibia-tax.ts`, `PropertyVatService`.

---

### 3.6 System map — project structure, journeys & authorization

**Canonical implementation:** `proxy.ts` (page RBAC), `lib/auth/roles.ts` (post-login routing), `lib/utils/api-helpers.ts` (`withApiAuth`), `lib/services/folio/guestStayAccess.ts` (stay-scoped data), Neon **RLS** (tenant isolation). **Marketing personas → roles:** §2.4; **structure detail:** §4.6; **API inventory:** §4.3.1, §4.7.

#### 3.6.1 Platform mental model

Hotel Etuna is one **Next.js 15** application on Vercel with three overlapping planes:

| Plane | What it is | Who uses it |
|-------|------------|-------------|
| **Public marketing** | Unauthenticated pages (`/`, `/rooms`, `/dining`, `/partners`, …) | Everyone |
| **Authenticated surfaces** | Role-gated UI routes + REST APIs | Guests, hub staff, partners, Buffr platform ops |
| **Hub data plane** | Neon PostgreSQL + RLS (`tenant_id`) | All server writes |

```mermaid
flowchart TB
  subgraph public [Public - no session]
    Home["/"]
    Rooms["/rooms /rooms/slug"]
    Dining["/dining"]
    PartnersPub["/partners"]
  end

  subgraph auth [Auth entry]
    LoginGuest["/login?redirect=/guest"]
    LoginStaff["/login?redirect=/dashboard"]
    Register["/register → verify-email"]
  end

  subgraph guest [Guest consumer - role guest or user]
    GuestHub["/guest"]
    GuestStay["/guest/stays/id"]
    GuestRoom["/guest/room QR"]
  end

  subgraph hub [Hub operations - owner manager staff]
    Dash["/dashboard"]
    Bookings["/bookings"]
    CRM["/crm"]
    Pay["/payments/*"]
    Sofia["/sofia /ai"]
  end

  subgraph partner [Partner tenant]
    PartDash["/partner/dashboard"]
  end

  subgraph platform [Buffr platform - admin super-admin]
    Plat["/admin/platform/*"]
  end

  public --> auth
  auth --> guest
  auth --> hub
  auth --> partner
  auth --> platform
```

**Hub-and-spoke tenancy:** One **hub tenant** (Hotel Etuna) owns the flagship property, Sofia, CRM, and partner network. Each **partner tenant** is isolated: own properties/bookings, no hub AI/CRM APIs.

#### 3.6.2 Identity model (accounts vs guests)

| Store | Table | Purpose | Created when |
|-------|-------|---------|--------------|
| **Login account** | `users` | Password, role, `tenant_id`, email verification | Register (`role: guest` on hub tenant), staff invite, or `provision-platform-admin.ts` |
| **CRM / booking guest** | `guests` | Reservation contact, loyalty, folio linkage | Booking created, or **linked on register/verify** via `linkGuestAccountForHubUser()` |
| **Stay access rule** | — | Guest APIs match `users.email` ↔ `guests.email` (case-insensitive) | Not `users.id` FK today |

**Implications:**

- A traveller must **register with the same email as on the reservation** (or verify that email) to see stays on `/guest`.
- Hub staff use **`/dashboard`** and `/api/bookings/*` — not `/api/guest/*` (consumer APIs require `guest`/`user` role).
- Platform operators (`@buffr.ai`, `super-admin`/`admin`) use **`/admin/platform`**; middleware grants full route access while building.

#### 3.6.3 Roles and default destinations

| Role | Typical email | `users.tenant_id` | Default after login | Primary UI |
|------|---------------|-------------------|---------------------|------------|
| **`guest`** | Any (traveller) | Hub tenant | `/guest` | Guest hub |
| **`user`** | Legacy consumer | Hub tenant | `/guest` | Guest hub (same as `guest`) |
| **`staff`** | `@hoteletuna.com` | Hub tenant | `/dashboard` | Operations dashboard |
| **`manager`** | `@hoteletuna.com` | Hub tenant | `/dashboard` | Operations + settings |
| **`owner`** | `@hoteletuna.com` | Hub tenant | `/dashboard` | Full hub property admin |
| **`admin`** | `@buffr.ai` | Hub or platform | `/admin/platform` | Platform console |
| **`super-admin`** | `@buffr.ai` | Hub or null | `/admin/platform` | Platform console (full access) |
| **`partner_*`** | Partner users | Partner tenant | `/dashboard` or `/partner/*` | Partner self-service |

**Sign-in entry points (product UX):**

| Surface | Link | Intended audience |
|---------|------|-------------------|
| Header **Sign in** | `/login?redirect=/guest` | Travellers |
| Footer **Staff & platform login** | `/login?redirect=/dashboard` | Hotel team + Buffr |
| Header when signed in | **My stay** / **Dashboard** / **Platform** + **Sign out** | `PublicAuthNav` + `lib/auth/public-session-nav.ts` |

#### 3.6.4 Full repository structure (summary)

| Path | Contents | Notes |
|------|----------|-------|
| **`app/`** | All routes and API handlers | App Router; see route table below |
| **`app/(auth)/`** | `login`, `register`, `verify-email`, password reset | Shared credentials UI |
| **`app/guest/`** | Guest hub + stay folio + room QR client | Consumer journey |
| **`app/(dashboard)/`** | PMS, CRM, payments, restaurant, compliance, Sofia, fraud | Hub staff shell (`layout.tsx` sidebar) |
| **`app/(dashboard)/admin/platform/`** | Buffr cross-tenant console | Tenants, users, properties, audit, SOC2 |
| **`app/(partner)/`** | Partner dashboard | Limited nav vs hub |
| **`app/api/`** | **136** `route.ts` handlers | REST; auth in §3.6.7 |
| **`components/`** | `features/*`, `ui/*`, `shared/*`, `sections/landing/*` | DaisyUI + custom `Button`/`Card` |
| **`lib/services/`** | Domain logic (booking, folio, crm, payment, sofia, …) | No business logic in page files |
| **`lib/auth/`** | NextAuth config, roles, platform-admin, stack-env | Production: NextAuth when Stack placeholders |
| **`lib/db/`** | Drizzle `schema.ts`, migrations, **`schema-types.ts`** (canonical types) | Use `schema-types` / `$inferSelect` only |
| **`database/drizzle/`** | SQL migrations `0000`–`0016` | Applied on Neon production |
| **`proxy.ts`** | Auth, RBAC, rate limits, tenant headers | Next.js 16 network boundary |
| **`scripts/`** | Seeds, RAG ingest, `provision-platform-admin.ts`, verification | Operator tooling |
| **`tests/`**, **`e2e/`** | Vitest + Playwright (desktop / mobile / tablet projects) | `npm run test:ci`; E2E: `npm run test:e2e:responsive` |
| **`instrumentation-client.ts`** | PostHog eager init | `defaults: '2026-01-30'` SPA pageviews |

Regenerate depth-3 tree: `tree -I 'node_modules|.next|.git' -L 3` — full listing in **§4.6**.

#### 3.6.5 User journeys (end-to-end)

**J1 — Anonymous visitor (discover)**

1. Lands on `/`, `/rooms`, `/dining`, `/partners`.
2. Sees content; **room rates and booking widget hidden** until sign-in (§5).
3. Sofia chat may answer general questions; **must not quote rates** when unauthenticated.
4. CTA: header **Sign in** → register or login.

**J2 — Traveller registration & verify**

1. `/register` → `role: guest`, hub `tenant_id`, password policy (§3.3.4).
2. Optional Cloudflare Turnstile when configured.
3. Email OTP → `/verify-email` → `emailVerified` + `linkGuestAccountForHubUser()`.
4. Login blocked until verified if OTP pending.
5. Redirect to `/guest` (or safe `?redirect=`).

**J3 — Traveller book & pay (gated)**

1. Sign in → `/rooms/[slug]` shows rates + `#booking`.
2. Booking via `/api/bookings` (session + hub tenant).
3. Deposit: Adumo Virtual or cash per product rules.
4. Confirmation email; guest row exists on booking.

**J4 — In-stay guest (folio & room service)**

1. Checked-in booking with matching email.
2. `/guest` lists **active stays**, **payment due**, **past stays**, **loyalty**.
3. `/guest/stays/[id]`: folio lines, room service menu, settle (cash/card), loyalty redeem.
4. **Past stays:** read-only folio; no orders/settle.
5. Room QR: `/guest/room` → `/api/public/room-qr/[code]` when checked in.

**J5 — Hub staff (daily operations)**

1. Footer/staff login → `/dashboard`.
2. Bookings lifecycle: `/bookings`, check-in/out, folio on booking detail (staff APIs).
3. Restaurant: `/restaurant/*`, menu CMS `/menu/*`.
4. Payments desk: `/payments/desk`, reconciliation, NamQR, platform billing (owner/manager).
5. CRM/Sofia: `/crm/*`, `/sofia/*` — **hub only**.

**J6 — Partner operator**

1. Invite/claim flow → partner `tenant_id`.
2. `/partner/dashboard` or scoped `/dashboard` routes.
3. Manage own properties/bookings; **403** on `/api/sofia/*`, `/api/crm/*`, `/api/guest/stays/*`.

**J7 — Buffr platform operator**

1. `@buffr.ai` account via `scripts/provision-platform-admin.ts`.
2. `/admin/platform`: tenants, users, properties, support, audit, SOC2 views.
3. Middleware: `admin` / `super-admin` → all routes allowed.

#### 3.6.6 Authorization layers (defense in depth)

| Layer | Mechanism | Enforces |
|-------|-----------|----------|
| **1. Edge** | `proxy.ts` | Public allowlist; session required elsewhere; `hasRouteAccess(role)` per path; partner block on hub API prefixes; safe login `redirect` |
| **2. API handler** | `withApiAuth` + optional `requireRole` | Session; rate limits; tenant context for RLS |
| **3. Stay scope** | `assertStayAccess()` | Guest email + verified account + `guests.is_signed_up`; staff same-tenant; platform staff roles |
| **4. Database** | RLS policies | `tenant_id` from session; partners cannot read hub rows |
| **5. Platform admin** | `getCurrentPlatformAdmin()` | `@buffr.ai` + role + `is_platform_admin` for `/admin/platform` layout |

**Hub-only API prefixes (partners always 403):** `/api/sofia/*`, `/api/crm/*`, `/api/ai/*`, `/api/guest/stays/*`, `/api/guest/loyalty/*`.

**Guest-only APIs:** `/api/guest/*` requires role `guest` or `user` (hub staff must use booking/folio staff paths).

#### 3.6.7 What each role can and cannot do

| Capability | guest / user | staff | manager / owner | partner | admin / super-admin |
|------------|:------------:|:-----:|:-----------------:|:-------:|:-------------------:|
| View public marketing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register as traveller | ✅ | ❌ | ❌ | ❌ | ❌ |
| Guest hub `/guest` | ✅ | ✅* | ✅* | ❌ | ✅* |
| Book rooms (gated rates) | ✅ | ✅ | ✅ | ❌** | ✅ |
| Own-stay folio via `/api/guest/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Staff folio on booking (dashboard) | ❌ | ✅ | ✅ | ❌ | ✅ |
| Hub dashboard `/dashboard` | ❌ | ✅ | ✅ | ✅*** | ✅ |
| Sofia AI / hub CRM APIs | ❌ | ✅ | ✅ | ❌ | ✅ |
| Partner property management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Platform console `/admin/platform` | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-tenant data (all tenants) | ❌ | ❌ | ❌ | ❌ | ✅**** |

\*Staff/owner may open `/guest` routes in middleware for support, but **consumer guest APIs reject** non-`guest`/`user` roles.  
\*\*Partners book through their own tenant scope, not the public Etuna booking widget.  
\*\*\*Partner role: limited route set (see §3.6.8).  
\*\*\*\*`super-admin` / platform `admin` via platform APIs and layout checks.

**Explicit denials (product rules):**

- **Unauthenticated:** No prices, no booking completion, no guest folio, no dashboard.
- **Unverified email:** No login; no stay API access.
- **Wrong email on account:** No stays on hub (no match to `guests.email`).
- **Partner:** No Sofia, no hub CRM, no guest stay list APIs, no other tenants’ bookings (RLS).
- **Guest:** No staff menu CMS, no reconciliation desk, no partner invite, no platform tenant admin.
- **Sofia:** No rates/availability to anonymous users (prompt sign-up).

#### 3.6.8 Page route access matrix (`proxy.ts`)

| Route prefix | Public | guest / user | staff | manager / owner | partner | admin / super-admin |
|--------------|:------:|:------------:|:-----:|:---------------:|:-------:|:-------------------:|
| `/`, `/about`, `/contact`, `/legal/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rooms`, `/dining`, `/partners` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/register`, `/verify-email`, … | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/guest`, `/guest/*` | ❌ | ✅ | ❌* | ❌* | ❌ | ✅ |
| `/profile` | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `/dashboard`, `/bookings`, `/crm`, `/sofia`, `/payments`, … | ❌ | ❌ | ✅ | ✅ | ✅*** | ✅ |
| `/partner/*` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/platform/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

\*Listed as allowed for owner/manager in code for support paths; prefer dashboard for ops.  
\*\*\*Partner: `/dashboard`, `/bookings`, `/rooms`, `/settings`, `/profile`, `/properties`, `/partner` only.

#### 3.6.9 API access matrix (summary)

| API area | Auth | Roles | Tenant scope |
|----------|------|-------|--------------|
| `/api/auth/*`, `/api/public/*`, `/api/partners` | Public / session | All | Public or hub |
| `/api/guest/*` | Session | **guest, user only** | Guest email match on stay |
| `/api/bookings/*`, `/api/properties/*`, `/api/restaurant/*` | Session | Hub staff (+ platform) | Hub `tenant_id` (RLS) |
| `/api/sofia/*`, `/api/crm/*`, `/api/ai/*` | Session | Hub staff; **not partners** | Hub only |
| `/api/admin/platform/*` | Session | Platform admin | Cross-tenant (controlled) |
| `/api/admin/partners/*` | Session | Hub admin | Hub |
| `/api/webhooks/*` | Signature | Providers | N/A |
| `/api/cron/*` | `CRON_SECRET` | Vercel cron | System |

Full route list: **§4.7** and `app/api/**/route.ts`.

#### 3.6.10 Key files (quick reference)

| Concern | File |
|---------|------|
| Page RBAC | `proxy.ts` — `PUBLIC_ROUTES`, `GUEST_ROUTES`, `PROPERTY_OWNER_ROUTES`, `hasRouteAccess()` |
| Post-login redirect | `lib/auth/roles.ts` — `getPostLoginRedirect()` |
| Session | `lib/auth/config.ts` — NextAuth credentials |
| Guest API guard | `lib/auth/roles.ts` — `GUEST_API_ROLES`; each `app/api/guest/**/route.ts` |
| Stay authorization | `lib/services/folio/guestStayAccess.ts` |
| Link register → CRM guest | `lib/services/booking/linkGuestAccount.ts` |
| Public nav session | `components/shared/PublicAuthNav.tsx`, `GuestNavLink.tsx` |
| Types (use in app code) | `lib/db/schema-types.ts`, `lib/types/folio.ts` |

---

### 3.7 Compliance, regulatory posture & SOC 2

**Canonical docs (do not proliferate):** `docs/compliance/` (Namibia programs + policies), `docs/SECURITY_PROMPT_PACK.md`, `docs/project/SOC2_IMPLEMENTATION_PLAN.md`. **BoN source corpus (read-only reference):** `mba-agent/documents/mba-agent/regulatory/namibia/` — indexed in **Appendix F**.

**Legal posture (product, not legal advice):** Hotel Etuna is a **hospitality merchant**; Buffr is **multi-tenant SaaS + platform billing**. Guest payments use **licensed rails** (Adumo Virtual hosted card, NamQR v5 + bank-app settlement, manual EFT/cash). **Not in scope for v1:** BoN-licensed PSP, e-money issuance, open-banking TPP/PIS, crypto.

#### 3.7.1 Namibia regulatory matrix (summary)

| Domain | Instrument | Regulator | Product / evidence | Gap ID |
|--------|------------|-----------|------------------|--------|
| NPS / payments | PSMA 2023; PSD-1 (2026); PSP Guidance Note | BoN | Adumo Virtual; NamQR; `lib/compliance/regulatory-context.ts` | G-03 (open banking P2) |
| Cards (CNP) | PSD-4 | BoN | Hosted page — **SAQ A**; no PAN on origin | Counsel: domestic acquirer only |
| EFT / QR | PSD-9; NamQR v5.0 (May 2025) | BoN | `lib/compliance/namqr/*`; `/api/payments/namqr/*`; `/payments/desk` | Desk confirm = ops reconcile, not switch settlement |
| Cyber / ops | PSD-12 | BoN | `PsdPaymentFraudGate`, 2FA on pay ops, `cybersecurity_incidents`, IRP | G-04 (live BoN API) |
| E-commerce | ETA 2019 | Courts / MIT | `audit_trail`, `consumer_rights_requests`, `app/legal/*` | G-01, G-06 |
| AML/CFT | FICA 2012 | FIC | `aml_*` (alerts, STR, velocity — **not PEP screen**), `/api/compliance/aml/*`, `/compliance/kyc` | G-05 (no live goAML); PEP screening out of scope (Namibia — no domestic database) |
| Data protection | Draft Bill; Constitution Art. 13 | TBD | `DATA_PROTECTION_AND_PRIVACY_PROGRAM.md` | G-01 (DSAR portal) |
| VAT | VAT Act 10 of 2000 | NamRA | `lib/platform/namibia-tax.ts`, `/reports/property-vat` | G-02 (e-invoicing) |
| Tourism | NTB Act 21/2000 | NTB | `HOSPITALITY_AND_TOURISM_COMPLIANCE.md` | Ops certificates |
| Voluntary attestation | SOC 2 TSC | CPA | `/compliance/soc2`, `Soc2AuditOrchestrator` | G-08, G-09 |

Full matrix + gap register: **`docs/compliance/NAMIBIA_REGULATORY_FRAMEWORK.md` §3, §6**.

**Buffr facilitator risk:** If Buffr **holds or routes** guest card settlements without PSD-1 authorisation, product crosses into **payment facilitator** territory (PSP Guidance §6.6.3). **Requirement:** guest card proceeds settle to **Hotel Etuna Nedbank** (`lib/platform/settlement-accounts.ts`); platform fees via **separate B2B invoice** (§3.4).

#### 3.7.2 Payment & fraud controls (runtime truth)

| Layer | What runs | Notes |
|-------|-----------|-------|
| **Card initiate (demo)** | `PsdFraudGate` on `POST /api/payments/initiate` | Built-in velocity/amount/device/geo + **`applyTenantFraudRules`** |
| **Card initiate (live)** | `PsdFraudGate` on `POST /api/payments/virtual/initiate` (alias `/api/payments/adumo/initiate`) | Same gate before `payment_sessions` insert; production fail-closed; **3DS on Adumo hosted page** |
| **DB rules (0016)** | `fraud_detection_rules` per tenant | Seed: velocity **5/h** → `review`, NAD **≥50k** → `block`, geo mismatch → `review`; **`conditions` JSON evaluated** |
| **Analyze API** | `FraudDetectionService` class | `/api/fraud/analyze` — same `evaluateTenantFraudRule`; `block` / `decline` → declined |
| **Fail mode** | Production / `FRAUD_GATE_FAIL_CLOSED=true` | Gate errors → **block** (not fail-open); dev → review |
| **BoN fraud trends** | NPS report | **Backlog:** CNP repeat-failure + EFT-confirm dual-control rules in seed |

**Implemented May 17, 2026:** Unified tenant rule evaluator; tests `tests/unit/tenant-fraud-rules.test.ts`.

#### 3.7.3 SOC 2 Type II program (target Nov 2026)

| Item | Status | Location |
|------|--------|----------|
| Plan & phases | ~45–58% readiness (formalization gap) | `docs/project/SOC2_IMPLEMENTATION_PLAN.md` |
| Policies written | **21 / 21** (drafts; sign-off pending) | `docs/compliance/policies/` |
| Evidence automation | Agents + export | `lib/compliance/soc2/*`, `GET /api/compliance/soc2`, `/compliance/soc2`, `/admin/platform/soc2` |
| CLI evidence | | `npx tsx scripts/soc2/collect-evidence.ts` → `compliance/evidence/soc2/` |
| IR / BCP | Docs ✅; tabletop **not run** | `INCIDENT_RESPONSE_PLAN.md`, `BUSINESS_CONTINUITY_PLAN.md` (RTO **4h** / RPO **1h** in BCP — align SOC2 plan tables) |
| **Not audit-ready until** | Signed policies, vendor SOC/PCI packs, 6-month evidence, CPA | G-08, G-09 |

#### 3.7.4 Security Prompt Pack & release gate

| Artifact | Purpose |
|----------|---------|
| `docs/SECURITY_PROMPT_PACK.md` | §1–15 AI review prompts; §14 Master Review; §15 Deployment Pre-Flight |
| `npm run security:preflight` | Automated subset (secrets, XSS helpers, rate limits, debug route, `npm audit`) → `compliance/evidence/security/preflight-*.json` |
| `.cursor/rules/hotel-etuna-security-prompts.mdc` | Require §14 + preflight before production deploy |

**CI:** `security-audit.yml` on `main`; full gate in `ci.yml` (`test:ci` + build). **Manual:** §14 + remaining §15 items (auth on all mutating routes, CORS lock, cookie flags).

#### 3.7.5 Out of scope (regulatory)

| Topic | Reason |
|-------|--------|
| PSD-3 e-money issuance | No guest NAD wallets |
| PSD-6 / PSD-13 system operator | Not operating NPS switch |
| Open Banking TPP (draft v1.0) | `ob_*` schema only; PIS roadmap G-03 |
| NAMFISA microlending sandbox | Not a lender |
| Virtual assets | No crypto payments |
| Licensed PSP without counsel sign-off | Buffr must not facilitate instructions while holding guest funds |

---

## 4. Technical Stack & Infrastructure

### 4.1 Core Technologies

|| Category | Technology | Version/Notes |
||----------|------------|---------------|
| **Frontend** | Next.js | 16 (App Router) | React Server Components, streaming, ISR |
| **UI Framework** | React | 18 | Server + Client Components |
| **Language** | TypeScript | Strict mode | Zero compilation errors enforced |
| **Styling** | Tailwind CSS | 3.x | Custom Hotel Etuna theme (`hoteletuna`) |
| **Component Library** | DaisyUI | Latest | Pre-themed with nude + CI (`ci.*`) palette |
| **Backend** | Next.js API Routes | — | Serverless functions on Vercel |
| **Database** | Neon | Serverless Postgres | Connection pooling for serverless |
| **ORM** | Drizzle ORM | Latest | Type-safe queries, migrations in `database/drizzle/` |
| **Vector DB** | Qdrant | Cloud/Self-hosted | Sofia AI knowledge base (`sofia_knowledge` collection) |
| **Authentication** | Stack Auth + NextAuth.js | — | Stack Auth primary, NextAuth fallback |
| **AI/LLM** | Multi-provider | — | DeepSeek → Anthropic → Groq (fallback chain) |
| **Embeddings** | Qdrant Cloud | `intfloat/multilingual-e5-small` | 384 dimensions, inference at upsert/query |
| **Email** | Nodemailer | — | Namecheap PrivateEmail SMTP |
| **Deployment** | Vercel | — | Auto-deploy from `main` branch |
| **Domain** | `www.hoteletuna.com` (canonical), `hoteletuna.com` (apex redirect) | Vercel | DNS → `cname.vercel-dns.com`; SSL auto |

### 4.2 Database schema (authoritative)

**Source of truth:** `lib/db/schema.ts` (Drizzle ORM, Neon PostgreSQL).  
**Migrations:** `database/drizzle/0000`–`0010`.  
**Types:** `lib/db/schema-types.ts` + Drizzle `$inferSelect` from `schema.ts` (legacy `database.types.ts` removed May 2026).

| Metric | Value |
|--------|-------|
| Tables | **81** |
| PostgreSQL enums (`pgEnum`) | **22** (several operational columns remain `varchar`) |
| RLS policies | Auto on all tables with `tenant_id` + special policies (see below) |
| Views / triggers | None in migrations |

**Regenerate types:** use Drizzle `$inferSelect` / `drizzle-kit`; export via `schema-types.ts` when needed.

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

**AML/CFT (9 — 7 active + 2 dormant PEP schema)**  
`aml_transaction_alerts`, `aml_monitoring_rules`, `aml_suspicious_transaction_reports`, `aml_due_diligence_records`, `aml_transaction_velocity`, `aml_geographic_patterns` — **active**  
`aml_pep_database`, `aml_guest_pep_flags` — **dormant** (Buffr port; not populated; PEP screening out of product scope for Namibia)

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
| 0015 | RLS for `booking_charges`, F&B inventory, `payment_sessions`, `stock_movements` |
| 0016 | Fraud detection rules seed (`0016_fraud_detection_rules_seed.sql`) |

*Drizzle journal may only list 0000–0002; 0003–0017 applied via Neon/psql. Verify: `npm run test:db:migrations` (18 checks).*

**Update (June 8, 2026):** Migrations `0010_booking_charges_rls.sql` and `0021_housekeeping_tasks.sql` were reviewed and confirmed to already use the correct `current_setting('app.tenant_id', true)::uuid` and `current_setting('app.user_id', true)::uuid` RLS session variable patterns. No changes were required for these migration files.

### 4.3 API Architecture


#### 4.3.1 Auth legend (API mapping)

| Label | Meaning |
|-------|---------|
| **Public** | No session; whitelisted in `proxy.ts` |
| **Session** | Stack Auth / NextAuth via `withApiAuth` |
| **Role** | Session + owner \| manager \| admin |
| **Platform admin** | `isPlatformAdmin()` + session email via **`getCurrentPlatformAdmin()`** (NextAuth when Stack Auth disabled) |
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
→ Qdrant Cloud Inference (multilingual-e5-small, 384d)
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
SMTP_USER=frontdesk@hoteletuna.com
SMTP_PASS=<smtp-password>

# NextAuth fallback
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://www.hoteletuna.com
```

**Payment gateways (Namibia):** Adumo Virtual only — see `.env.example` (`ADUMO_JWT_SECRET`, `ADUMO_WEBHOOK_URL`, redirect URLs).

**Optional providers:**
- `ANTHROPIC_API_KEY` (Claude fallback)
- `GROQ_API_KEY` (Groq fallback)
- `DEEPSEEK_API_KEY` (Primary LLM)

### 4.6 Repository structure

**Product map (journeys, RBAC, can/cannot by role):** **§3.6** — use that section for onboarding and security reviews; this subsection is the generated file tree only.

Generated from project root (`hotel-etuna/`) with:

```bash
tree -I 'node_modules|.next|.git|coverage|playwright-report|test-results' -L 3 --dirsfirst -F --charset ascii
```

**Excluded:** `node_modules`, `.next`, `.git`, `coverage`, `playwright-report`, `test-results`, build artifacts. **Depth:** 3 (plus depth-4 callouts for `app/guest/` and `admin/platform/` below). **Counts (May 17, 2026):** 229 directories, 352 files.

#### Top-level map

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router — public marketing, auth, guest hub, partner portal, dashboard, API routes |
| `components/` | React UI — `features/` by domain, `ui/` primitives, `shared/` chrome, `brand/`, `sections/landing/` |
| `lib/` | Server/client logic — `db/`, `services/`, `auth/`, `copy/`, `integrations/`, `utils/`, `types/` |
| `database/drizzle/` | SQL migrations (`0000`–`0016`) + Drizzle meta |
| `data/hotel-etuna-knowledge/` | Sofia RAG source markdown (**4 files** — no `tours-guide.md`) |
| `docs/project/` | **Canonical docs:** `PRD.md`, `PLANNING.md`, `TASK.md` (+ `SOC2_IMPLEMENTATION_PLAN.md`) |
| `public/` | Static assets — `brand/`, `images/`, PWA `manifest.json`, `sw.js` |
| `scripts/` | Seeds, RAG ingest, `db/*` verification, `provision-platform-admin.ts`, security preflight (no `archive/`) |
| `tests/` | Vitest — `integration/`, `sofia/`, `workflows/`, `api/`, `unit/` |
| `e2e/` | Playwright specs |
| `proxy.ts` | Auth, RBAC, rate limit, tenant routing (Next.js 16 network boundary) |
| `lib/auth/middleware.ts` | Auth helpers used by `proxy.ts` (not the root boundary file) |

#### `app/` route groups (depth 1)

| Group / area | Routes | Audience |
|--------------|--------|----------|
| `(auth)/` | `login`, `register`, `forgot-password`, `reset-password`, `verify-email` | Shared NextAuth sign-in; entry via header (guest) or footer (staff) — §3.3.1 |
| Public pages | `/`, `/about`, `/contact`, `/dining`, `/rooms`, `/rooms/[slug]` | Marketing (J1) |
| **`guest/`** | `/guest`, `/guest/stays/[bookingId]`, `/guest/room` | **Guest hub (J4):** active/past stays, loyalty, folio, room QR — roles `guest`/`user` |
| `partners/`, `public-properties/` | Partner directory & legacy public property URLs | Referral network |
| `partner/` | `/partner/dashboard`, bookings, rates, rooms | Partner tenants (J6) |
| `(dashboard)/` | PMS, CRM, restaurant, payments, compliance, Sofia, reports | Hub staff (J5) — `staff`, `manager`, `owner` |
| **`(dashboard)/admin/platform/`** | Tenants, users, properties, analytics, audit, SOC2, support, settings | **Buffr platform (J7)** — `admin`, `super-admin` |
| `api/` | REST handlers (`bookings`, `crm`, `guest`, `payments`, `sofia`, `admin/platform`, …) | Clients & integrations |
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

#### Key route subtrees (depth 4)

Guest hub (`app/guest/`) — roles **guest** / **user** only (§3.6 J4):

```
app/guest/
|-- room/
|   |-- GuestRoomQrClient.tsx
|   `-- page.tsx
|-- stays/
|   `-- [bookingId]/
|       `-- page.tsx
|-- layout.tsx
`-- page.tsx
```

Buffr platform console (`app/(dashboard)/admin/platform/`) — roles **admin** / **super-admin** (§3.6 J7):

```
app/(dashboard)/admin/platform/
|-- analytics/page.tsx
|-- audit/page.tsx
|-- properties/
|   |-- [id]/page.tsx
|   `-- page.tsx
|-- settings/page.tsx
|-- soc2/page.tsx
|-- support/page.tsx
|-- tenants/
|   |-- [id]/page.tsx
|   `-- page.tsx
|-- users/
|   |-- [id]/page.tsx
|   `-- page.tsx
|-- layout.tsx
`-- page.tsx
```

#### Full tree (depth 3)

Regenerated May 17, 2026 (`tree -L 3` from `hotel-etuna/`). **229 directories, 352 files.**

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
|   |   |-- fraud/
|   |   |-- menu/
|   |   |-- payments/
|   |   |-- profile/
|   |   |-- properties/
|   |   |-- reports/
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
|   |   |-- inventory/
|   |   |-- menu/
|   |   |-- partners/
|   |   |-- payments/
|   |   |-- platform/
|   |   |-- properties/
|   |   |-- public/
|   |   |-- qr/
|   |   |-- reports/
|   |   |-- restaurant/
|   |   |-- rooms/
|   |   |-- settings/
|   |   |-- sofia/
|   |   |-- staff/
|   |   |-- support/
|   |   |-- tax/
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
|   |-- payment/
|   |   |-- failed/
|   |   `-- success/
|   |-- public-properties/
|   |   |-- [slug]/
|   |   `-- search/
|   |-- rooms/
|   |   |-- [slug]/
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
|-- compliance/
|   `-- evidence/
|       `-- security/
|-- components/
|   |-- analytics/
|   |   `-- (pageviews via PostHog `defaults: 2026-01-30` — no separate pageview component)
|   |-- brand/
|   |   |-- HotelEtunaLogo.tsx
|   |   `-- HotelEtunaMarkIcon.tsx
|   |-- compliance/
|   |   |-- AMLDashboard.tsx
|   |   |-- AlertDetailModal.tsx
|   |   `-- PEPManagement.tsx  # legacy stub — not mounted; PEP screening out of scope
|   |-- dining/
|   |   |-- MenuBookContinueFace.tsx
|   |   |-- MenuBookFullMenu.tsx
|   |   |-- MenuBookFullMenuCoverFace.tsx
|   |   |-- MenuBookItemDetailDialog.tsx
|   |   |-- MenuBookItemTile.tsx
|   |   |-- MenuBookItemsFace.tsx
|   |   |-- MenuBookSinglePageViewer.tsx
|   |   |-- MenuPageTurner.tsx
|   |   |-- PublicMenuBoard.tsx
|   |   `-- PublicMenuFeaturedCard.tsx
|   |-- features/
|   |   |-- accounting/
|   |   |-- admin/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- auth/
|   |   |-- billing/
|   |   |-- booking/
|   |   |-- bookings/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- dashboard/
|   |   |-- folio/
|   |   |-- fraud/
|   |   |-- guest/
|   |   |-- menu/
|   |   |-- payments/
|   |   |-- property/
|   |   |-- restaurant/
|   |   |-- rooms/
|   |   |-- settings/
|   |   |-- sofia/
|   |   |-- staff/
|   |   `-- tax/
|   |-- partners/
|   |   `-- PartnerAvailabilityWidget.tsx
|   |-- payments/
|   |   |-- AdumoPaymentReturn.tsx
|   |   |-- AdumoVirtualPaymentForm.tsx
|   |   `-- BookingDepositPayCard.tsx
|   |-- providers/
|   |   |-- AuthGateProvider.tsx
|   |   |-- OfflineBanner.tsx
|   |   |-- PostHogProvider.tsx          # @posthog/react PHProvider
|   |   |-- ServiceWorkerRegistration.tsx
|   |   |-- SessionProviderWrapper.tsx
|   |   |-- SessionTimeoutWrapper.tsx
|   |   `-- StackProviderWrapper.tsx
|   |-- sections/
|   |   `-- landing/
|   |-- shared/
|   |   |-- DevTestSessionBanner.tsx
|   |   |-- EmptyState.tsx
|   |   |-- ErrorBoundary.tsx
|   |   |-- ErrorDisplay.tsx
|   |   |-- Footer.tsx
|   |   |-- GuestNavLink.tsx
|   |   |-- Header.tsx
|   |   |-- LoadingSpinner.tsx
|   |   |-- MessageAlert.tsx
|   |   |-- NotFoundState.tsx
|   |   |-- NoticeState.tsx
|   |   |-- PageHeader.tsx
|   |   |-- PublicAuthNav.tsx
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
|   |-- PublicRoomTourSignInCard.tsx
|   |-- PublicRoomsBrowseBanner.tsx
|   |-- PublicRoomsSignedInBanner.tsx
|   |-- RoomBookingCard.tsx
|   |-- RoomPhotoTour.tsx
|   |-- RoomsFilmstrip.tsx
|   |-- RoomsIncludedStrip.tsx
|   `-- RootErrorBoundary.tsx
|-- data/
|   `-- hotel-etuna-knowledge/
|       |-- hotel-etuna-facts.md
|       |-- local-area.md
|       |-- restaurant-menu.md
|       `-- room-descriptions.md
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
|       |-- 0010_booking_charges_rls.sql
|       |-- 0011_fnb_inventory.sql
|       |-- 0012_adumo_virtual_payment_sessions.sql
|       |-- 0013_platform_billing.sql
|       |-- 0014_platform_invoice_vat.sql
|       |-- 0015_rls_inventory_payment_sessions.sql
|       `-- 0016_fraud_detection_rules_seed.sql
|-- docs/
|   |-- compliance/
|   |   |-- policies/
|   |   |-- AML_FICA_COMPLIANCE_PROGRAM.md
|   |   |-- BUSINESS_CONTINUITY_PLAN.md
|   |   |-- CONTRACT_AND_COMMERCIAL_LAW_FRAMEWORK.md
|   |   |-- DATA_PROTECTION_AND_PRIVACY_PROGRAM.md
|   |   |-- HOSPITALITY_AND_TOURISM_COMPLIANCE.md
|   |   |-- INCIDENT_RESPONSE_PLAN.md
|   |   |-- NAMIBIA_REGULATORY_FRAMEWORK.md
|   |   |-- README.md
|   |   |-- SECURITY_PROMPT_PACK.md
|   |   `-- TAX_AND_NAMRA_COMPLIANCE.md
|   |-- project/
|   |   |-- PLANNING.md
|   |   |-- PRD.md
|   |   |-- SOC2_IMPLEMENTATION_PLAN.md
|   |   |-- TREE.txt
|   |   `-- TASK.md
|   |-- naming-conventions.md
|   `-- SECURITY_PROMPT_PACK.md
|-- e2e/
|   |-- helpers/
|   |   |-- db-otp.ts
|   |   `-- load-env.ts
|   |-- auth-journey.spec.ts
|   |-- authentication.spec.ts
|   |-- design-system.spec.ts
|   |-- gated-pricing.spec.ts
|   |-- homepage.spec.ts
|   |-- navigation.spec.ts
|   |-- public-components.spec.ts
|   `-- responsive-layout.spec.ts
|-- lib/
|   |-- auth/
|   |   |-- client.ts
|   |   |-- config.ts
|   |   |-- jwks.ts
|   |   |-- middleware.ts
|   |   |-- platform-admin.ts
|   |   |-- public-session-nav.ts
|   |   |-- roles.ts
|   |   |-- stack-auth.ts
|   |   |-- stack-env.ts
|   |   |-- tenant-context.ts
|   |   `-- verify-turnstile.ts
|   |-- cache/
|   |   `-- redis-rate-limit.ts
|   |-- compliance/
|   |   |-- namqr/
|   |   |-- security-pack/
|   |   |-- soc2/
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
|   |   |-- etuna-inventory-seed.ts
|   |   |-- etuna-restaurant-menu-catalog.ts
|   |   |-- menu-image-thumb.ts
|   |   |-- menu-item-image-kinds.ts
|   |   |-- menu-item-image-urls.ts
|   |   |-- partners.ts
|   |   `-- rooms.ts
|   |-- db/
|   |   |-- connection.ts
|   |   |-- index.ts
|   |   |-- rows.ts
|   |   |-- schema-types.ts
|   |   `-- schema.ts
|   |-- dining/
|   |   |-- menu-book-pagination.ts
|   |   |-- menu-display.ts
|   |   |-- menu-item-images.ts
|   |   |-- restaurant-hours.ts
|   |   `-- serialize-public-menu.ts
|   |-- domain/
|   |   `-- accounting/
|   |-- email/
|   |   |-- hotel-etuna-email-signature.ts
|   |   `-- sofia-email-helpers.ts
|   |-- hooks/
|   |   `-- useTenant.ts
|   |-- integrations/
|   |   |-- whatsapp/
|   |   |-- embeddings-rag.ts
|   |   |-- qdrant-inference.ts
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
|   |-- platform/
|   |   |-- namibia-tax.ts
|   |   `-- settlement-accounts.ts
|   |-- rooms/
|   |   |-- public-rate.ts
|   |   `-- room-display.ts
|   |-- services/
|   |   |-- accounting/
|   |   |-- ai/
|   |   |-- analytics/
|   |   |-- billing/
|   |   |-- booking/
|   |   |-- calendar/
|   |   |-- cms/
|   |   |-- compliance/
|   |   |-- crm/
|   |   |-- documents/
|   |   |-- folio/
|   |   |-- fraud/
|   |   |-- inventory/
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
|   |   |-- tax/
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
|   |   |-- dev-log.ts
|   |   |-- errors.ts
|   |   |-- formatting.ts
|   |   |-- hub-tenant.ts
|   |   |-- public-property.ts
|   |   |-- rate-limit.ts
|   |   |-- sanitize-html.ts
|   |   |-- security-logger.ts
|   |   |-- slugify.ts
|   |   |-- status-normalize.ts
|   |   |-- tenant-validation.ts
|   |   `-- validation.ts
|   |-- validation/
|   |   |-- entity-ids.ts
|   |   `-- password.ts
|   |-- workflows/
|   |   |-- domainTransitions.ts
|   |   |-- genericLifecycleGraph.ts
|   |   |-- graphReducers.ts
|   |   |-- hospitalityMarketingWorkflows.ts
|   |   `-- kycKybGraph.ts
|   |-- formatters.ts
|   |-- posthog-client-options.ts   # shared init (defaults 2026-01-30)
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
|   |-- compliance/
|   |   `-- soc2-audit.ts
|   |-- db/
|   |   |-- audit-neon-baseline.ts
|   |   |-- verify-db.ts
|   |   |-- verify-neon-migrations.ts
|   |   `-- verify-tenant-rls.ts
|   |-- lib/
|   |   `-- menu-images-db.ts
|   |-- security/
|   |   `-- run-preflight.ts
|   |-- soc2/
|   |   `-- collect-evidence.ts
|   |-- README.md
|   |-- check-env-local.mjs
|   |-- clean-dev-cache.mjs
|   |-- ingest-hotel-etuna-knowledge.ts
|   |-- print-email-signature.ts
|   |-- provision-platform-admin.ts
|   |-- push-env-to-vercel.mjs
|   |-- seed-hotel-etuna.ts
|   |-- seed-menu-images.ts
|   |-- seed-partners.ts
|   |-- sync-env-local.mjs
|   |-- validate-menu-images.ts
|   |-- validate-sofia-email-templates.ts
|   `-- verify-system-design.js*
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
|   |   |-- auth-roles.test.ts
|   |   |-- email-signature.test.ts
|   |   |-- guest-marketing-segment.test.ts
|   |   |-- hospitality-accounting.test.ts
|   |   |-- llm-provider-router.test.ts
|   |   |-- menu-book-pagination.test.ts
|   |   |-- menu-image-thumb.test.ts
|   |   |-- namibia-hospitality-accounting.test.ts
|   |   |-- namibia-property-vat.test.ts
|   |   |-- namqr-receipt-trigger.test.ts
|   |   |-- namqr-v5.test.ts
|   |   |-- password-validation.test.ts
|   |   |-- posthog-analytics.test.ts
|   |   |-- public-rate.test.ts
|   |   |-- public-session-nav.test.ts
|   |   |-- rag-chunk.test.ts
|   |   |-- room-display.test.ts
|   |   |-- security-preflight.test.ts
|   |   |-- settle-off-platform-folio.test.ts
|   |   |-- soc2-audit-agents.test.ts
|   |   |-- soc2-audit.test.ts
|   |   |-- soc2-control-matrix.test.ts
|   |   |-- sofia-intent-resolve.test.ts
|   |   `-- stack-env.test.ts
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
|-- instrumentation-client.ts      # PostHog eager client init
|-- playwright.config.ts           # chromium + mobile-chrome + tablet
|-- postcss.config.mjs
|-- proxy.ts
|-- stack.ts
|-- tailwind.config.ts
|-- test-sofia-email-send.ts
|-- tsconfig.json
|-- tsconfig.tsbuildinfo
|-- vercel.json
|-- vitest.config.ts
`-- vitest.smoke.config.ts

229 directories, 352 files
```

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
| `/api/webhooks/whatsapp` | GET, POST | Webhook | `tenant_whatsapp_settings`, `guests`, `ai_*` | Meta Cloud API |
| `/api/communications/threads` | GET | Hub staff | `ai_conversations`, `ai_messages` | `/communications` hub |
| `/api/communications/threads/[sessionId]` | GET, POST, PATCH | Hub staff | `ai_*`, outbound Meta Cloud API | Thread detail + staff reply |

#### Payments

| API route | Methods | Auth | DB tables | Frontend |
|-----------|---------|------|-----------|----------|
| `/api/payments/initiate` | POST | 2FA header | `payment_security_audit`, `fraud_*`, `audit_trail` | Gateway / internal |
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
| `/api/compliance/aml/*` | * | Open API | `aml_*` (excl. PEP screen) | `AMLDashboard` — alerts, STR, monitoring; **no PEP screen API** |
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
| **/dining** | Restaurant overview; **digital menu** (all categories/items), dish photos, names, descriptions, **NAD prices** on tiles; guest favourites strip (analytics). **Single-page** UX: Previous / Next, 2×3 food grid per page. | In-page room-service ordering (folio) for guests not checked in. | "Sign In to Order Online" / reservation CTA in hours section. |
| **/partners & /partners/[slug]** | Partner property info, images, descriptions, room types. | Partner prices, partner booking widget. | "Sign In to View Partner Rates & Book". |
| **Sofia AI Chat** | Public visitors can ask general questions (e.g., "Do you have a pool?", "What time is check‑in?"). Sofia **must not** disclose room rates, availability, or take booking requests from unauthenticated users. | Prices, availability, booking. | Sofia replies: *"For pricing and availability, please sign up — it only takes a minute!"* |

### 3.3 Post-Login Experience

**After login**, all prices, availability, and booking/ordering widgets become visible. The system redirects the user back to the page they were on before login (via a `redirect` query parameter).

#### 3.3.1 Public navigation — guest vs staff entry points

Marketing chrome separates **guest** and **hotel-team** sign-in so journeys stay obvious. **`PublicAuthNav`** (`components/shared/PublicAuthNav.tsx`) reads the NextAuth session and switches labels so signed-in users never still see a static **Sign in**.

| Surface | Signed out | Signed in (by role) |
|---------|------------|---------------------|
| **`NavigationHeader`** | **Sign in** → `/login?redirect=/guest` | **My stay** → `/guest` (guest/user); **Dashboard** → `/dashboard` (owner/manager/staff); **Platform** → `/admin/platform` (Buffr `super-admin`/`admin`) + **Sign out** |
| **`PublicFooter`** → *For our team* | Same session row as header + **Staff & platform login** → `/login?redirect=/dashboard` | **Sign out** + staff link still available |
| **Header CTA** | Book now → `/rooms?book=1` | Unchanged |

Helpers: `lib/auth/public-session-nav.ts` (`getSignedInAccountHref`, `getSignedInAccountLabel`). Copy: `lib/copy/public.ts` → `nav.signOut`, `nav.guestSignIn`, `footer.staffLogin`.

**Dev-only:** `DevTestSessionBanner` warns when a leftover **`@example.com`** test cookie is still active (not automatic login) and offers one-click sign-out.

**Same credentials page:** `/login` + `LoginForm` (NextAuth) serves all audiences; **RBAC** on `/dashboard`, `/admin/platform`, and `/api/*` enforces scope. Contextual copy on `/login` is guest-oriented (`lib/copy/auth.ts`); hotel team and Buffr operators use the footer **Staff & platform login** link.

**User journeys (summary):**

| Persona | Goal | Primary routes |
|---------|------|----------------|
| Public visitor | Browse tours, menu, partners | `/`, `/rooms`, `/dining`, `/partners` |
| Guest (signed in) | Book, view rates, manage stay | `/guest`, `/guest/stays/[id]`, gated `/rooms` |
| Hotel staff (`@hoteletuna.com`) | Operate property | `/dashboard/*`, `/payments/desk`, CRM, menu CMS |
| Buffr platform admin (`@buffr.ai`) | Cross-tenant ops, compliance, tenants | `/admin/platform/*` |
| Partner operator | Manage referral listing | `/partner/dashboard` (isolated nav) |

#### 3.3.2 Buffr platform admin (`@buffr.ai`)

| Requirement | Implementation |
|-------------|----------------|
| **Email domain** | Must end with `@buffr.ai` (`PLATFORM_ADMIN_EMAIL_DOMAIN` in `lib/auth/platform-admin.ts`) |
| **Role** | `super-admin` or `admin` in `users.role` |
| **Flag / tenant** | `is_platform_admin = true` **or** `tenant_id` null **or** platform tenant UUID `00000000-0000-0000-0000-000000000000` |
| **Session resolution** | `getAuthenticatedEmail()` → Stack Auth if configured, else **NextAuth** `getServerSession` (production default while Stack keys are placeholders) |
| **Login without hotel tenant** | `lib/auth/config.ts` allows Buffr operators to authenticate when `isPlatformAdmin` / `@buffr.ai` admin role even if tenant join is empty; hub `tenant_id` may be linked for PMS preview |
| **Middleware** | `super-admin` and `admin` roles receive full protected-route access in `proxy.ts` (`hasRouteAccess`) |
| **Provisioning** | `npx tsx scripts/provision-platform-admin.ts` — upsert operator (e.g. `george@buffr.ai`); `EMAIL=… PASSWORD=…` env vars; optional `--link-hub` for Hotel Etuna tenant context |

**Seeded hotel admin (operations):** `manager@hoteletuna.com` / `owner` — not platform admin. **Buffr builder account:** provisioned separately; do not commit production passwords in docs.

**Login flow (gated content):**
1. User clicks "Sign in to view rates" on `/rooms/[slug]`
2. Redirects to `/login?redirect=/rooms/standard-room` (or current slug)
3. After successful auth, returns with prices + `#booking` widget active
4. Header **Sign in** is for the **guest hub** (`/guest`), not staff dashboard

#### 3.3.3 Guest hub (`/guest`)

| Area | Behaviour |
|------|-----------|
| **Hub API** | `GET /api/guest/stays` → `{ activeStays, paymentDue, pastStays, loyalty }` (email match on `guests.email`) |
| **Registration** | `POST /api/auth/register` creates `role: guest` on hub tenant (`resolveHubTenantId()` / `HUB_TENANT_ID`) — not a new owner tenant |
| **Post-login routing** | `lib/auth/roles.ts` — guests/`user` → `/guest`; staff → `/dashboard`; Buffr → `/admin/platform`; `LoginForm` reads session after sign-in |
| **RBAC** | `proxy.ts`: `guest` and legacy `user` roles access `/guest/*` and `/profile`; `staff` uses property-owner route set |
| **Past stays** | `checked_out` or `checkOutDate < today`; folio read-only on `/guest/stays/[id]` |
| **Loyalty** | Aggregated from `guest_profiles` on hub; redeem remains on active folio (`POST /api/guest/loyalty/redeem`) |

UI: `GuestStaysList`, `GuestLoyaltySummary`, `GuestFolioPanel` (past-stay banner). Layout nav: **My stays**, **Account** (`/profile`).

**Schema ↔ types alignment (v2.8.5):**

| Layer | Rule |
|-------|------|
| `users` ↔ `guests` | Register/verify calls `linkGuestAccountForHubUser()` — same normalized email as stay APIs |
| Folio types | `lib/types/folio.ts` — `BookingChargeStatus`, `BookingStatus`, `LoyaltyTier`, `GuestBookingAccess` |
| Drizzle decimals | Services coerce `decimal` → `number` before API responses |
| `schema-types.ts` | Re-export Drizzle-inferred types after `db:push` / new migrations |

**Guest API security:** `requireRole: guest|user` on `/api/guest/*`; email match + `emailVerified` + `guests.is_signed_up` in `assertStayAccess`; middleware blocks unauthenticated `/api/guest`; login blocked until OTP verified; safe `redirect` param (no open `callbackUrl`).

#### 3.3.4 Production deployment checklist (guest & auth)

| Item | Production setting |
|------|-------------------|
| **Secrets** | `NEXTAUTH_SECRET`, `DATABASE_URL` (pooled Neon), `CRON_SECRET` on Vercel |
| **Rate limits** | `REDIS_URL` + `RATE_LIMIT_REDIS_REQUIRED=true` (middleware returns 503 if Redis down) |
| **Registration** | Password ≥12 chars + mixed case + number (`lib/validation/password.ts`); Turnstile keys optional locally, **required** when `TURNSTILE_SECRET_KEY` set |
| **Email verify** | Users cannot log in until OTP verified (`lib/auth/config.ts`) |
| **Hub tenant** | `HUB_TENANT_ID` matches seeded hub row in Neon |
| **Types** | Use `@/lib/db/schema-types` / Drizzle infer from `schema.ts` |
| **Staff folio** | Property ops use `/dashboard` booking APIs — not `/api/guest/*` (consumer-only) |
| **Logging** | Auth verbose logs dev-only (`lib/utils/dev-log.ts`) |

**Vercel env (minimum for guest launch):** `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `HUB_TENANT_ID`, `NEXT_PUBLIC_SITE_URL`, Sofia/email vars for OTP, optional `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, `REDIS_URL` + `RATE_LIMIT_REDIS_REQUIRED`.

### 3.4 Implementation Requirements

| Component | Requirement |
|-----------|-------------|
| **AuthGate Context** | React Context exposing `isAuthenticated` (from session). All price displays check this before rendering. |
| **Landing Page** | Replace price lines with "Sign in to view prices". Hide booking widget, show "Sign in to check availability" card. |
| **Room Pages** | Hide prices when `!isAuthenticated`. Replace booking button with "Sign In" CTA. |
| **Dining Page** | Full menu with prices on `/dining` — single-page viewer, 2×3 food grid (see §3.1.1). Reservation/order CTA uses `publicCopy.gated.orderOnline` when unauthenticated. Landing/home dining teasers may still hide prices per product policy. |
| **Partner Pages** | Apply same gating: hide partner room prices, replace booking widget with sign‑in prompt. |
| **Sofia AI** | System prompt: *"Never disclose prices or availability to unauthenticated users. Instead, invite them to sign up."* Chat widget visible to all, but responses change based on auth state. |
| **Login Redirect** | After successful login, read `redirect` query param; else `getPostLoginRedirect(role)` (`lib/auth/roles.ts`). **Header** pre-sets `redirect=/guest`; **footer staff link** pre-sets `redirect=/dashboard`. Register → verify email → `/guest`. |
| **Public nav** | Session-aware header/footer via `PublicAuthNav` (§3.3.1); footer retains staff login link. |
| **Platform admin** | `/admin/platform` layout uses `getCurrentPlatformAdmin()`; Buffr operators provisioned per §3.3.2. |

### 3.5 Verification Checklist

- [x] Visit site in incognito → no prices visible, all CTAs lead to login
- [x] Log in → all prices, booking, and ordering features appear
- [x] Sofia chat responds with sign‑up invitation when asked about prices
- [x] Login redirect works correctly from all pages
- [x] Header **Sign in** → `/login?redirect=/guest`; footer **Staff & platform login** → `/login?redirect=/dashboard`
- [x] Authenticated users see **Sign out** + role link (**My stay** / **Dashboard** / **Platform**) in `NavigationHeader` / footer — not a static **Sign in**
- [x] Room detail: guests see `PublicRoomTourSignInCard`; signed-in users see rates in `RoomBookingCard`
- [x] Guest register creates `guest` role (not owner tenant); hub shows past stays + loyalty when email matches reservations
- [x] Legacy `user` role can access `/guest` and `/profile`

---

## 6. Non‑Functional Requirements

### 6.1 Architecture & Data Isolation

- **Hub‑and‑Spoke Multi‑Tenancy:** Hotel Etuna = hub tenant with full access. Partners = lightweight tenants with strict RLS enforcement. 62 PostgreSQL RLS policies active. `tenant_type` enum distinguishes `hub` from `partner`. `parent_tenant_id` links partners to hub.
- **Database:** **Neon (serverless Postgres)** — connection pooling for serverless environments. Drizzle ORM handles all database interactions. No Supabase‑specific features used.
- **Vector Database:** **Qdrant** — collection `sofia_knowledge` with hub tenant namespace for Hotel Etuna property knowledge.

### 6.2 Security & Compliance

**Program index:** **§3.7** (Namibia matrix, fraud dual-stack, SOC 2, Security Prompt Pack). **Docs:** `docs/compliance/`, `docs/SECURITY_PROMPT_PACK.md`, `docs/project/SOC2_IMPLEMENTATION_PLAN.md`.

- **Authentication:** **NextAuth** (credentials) is the live path for guests, hotel staff, and Buffr platform admins. **Stack Auth** is optional: `lib/auth/stack-env.ts` skips SDK init when keys are missing or placeholders. **Platform admin UI** resolves the signed-in user via NextAuth when Stack is disabled (`getAuthenticatedEmail()` in `lib/auth/platform-admin.ts`). **Neon Auth** URLs may be provisioned in env for future use; do not duplicate conflicting `NEON_AUTH_*` hostnames. JWT/session includes `tenant_id` and `role` claims.
- **Authorization:** RBAC: `owner`, `manager`, `admin`, `staff`, `super-admin` (Buffr platform). Middleware enforces tenant isolation; `super-admin` / `admin` (session role) bypass route lists for builder access. Hub‑only routes (`/api/sofia/*`, `/api/crm/*`, `/api/ai/*`) return 403 for partners. Platform routes: `isPlatformAdmin()` requires `@buffr.ai` email + role + flag/tenant rule (§3.3.2).
- **Payments (Namibia):** Adumo Virtual (SAQ A); NamQR v5 desk flow; no Stripe; settlement to Etuna Nedbank for guest collections (§3.5, §3.7).
- **Fraud:** **`PsdFraudGate`** on card initiate + **`tenant-fraud-rules`** evaluates migration **`0016`** rules; production fail-closed (§3.7.2).
- **AML / incidents:** FICA program + internal STR workflow (alerts, velocity, KYC — **no PEP screening**; Namibia has no domestic PEP database in-product); BoN incident reporting via `BonIncidentReportingService` (**simulated** without `BON_API_KEY` — G-04).
- **Rate Limiting:** Aggressive limits on partner invite endpoint (5 requests/hour). Standard limits on public APIs (100 requests/minute per IP). Redis required in production (`RATE_LIMIT_REDIS_REQUIRED`).
- **Two‑Factor Authentication:** Required for all hub admin actions affecting payments, commissions, or partner management.
- **Data Protection:** GDPR/POPIA **readiness** (draft Bill); DSAR portal and cookie banner gaps G-01, G-06. Marketing consent in CRM. `audit_trail` for sensitive ops.
- **Session Management:** 8‑hour absolute session max, 30‑minute inactivity timeout (with 2‑minute warning toast), rolling session extension on activity.
- **Release gate:** `npm run security:preflight` + Security Prompt Pack §14 before deploy; `npm run verify:production` in CI.

### 6.3 Branding & User Experience

| Surface | Theme |
|---------|-------|
| **Hotel Etuna Public Website** | Official CI palette: Rustic Red `#790C19` primary CTA (`ci-primary`), chocolate `#4B3428` headings (`ci-secondary-chocolate`), body ink via the CI-chocolate-anchored `ink` ramp (`text-ink-900`/`text-ink-700`; chocolate & terracotta `#6D3722` are AA-safe brand text accents), sage `#9BAE8A` nature accents. Playfair Display for headlines, Inter for body. The unused `khaki-*` / `terracotta-*` legacy ramps were removed in DS v1.1.0; `rustic` (`border-rustic`) and `luxury-*` remain. |
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

- **Hosting:** Vercel (Next.js App Router), project **`buffr/hotel-etuna`**
- **Domains & DNS:**
  - **Canonical:** `https://www.hoteletuna.com` (production alias)
  - **Apex:** `hoteletuna.com` — configure in Vercel Domains; recommend redirect to `www`
  - **DNS records (typical):** `www` → `CNAME` `cname.vercel-dns.com`; apex → `A` `76.76.21.21` or registrar-supported apex `CNAME` (see Vercel domain UI for exact values)
  - **Previews:** `*.vercel.app` (no custom DNS)
- **Environment variables:**
  - **Local:** `.env.local` from `.env.example` — **`http://localhost:3000`** for `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, and Adumo redirect URLs is intentional
  - **Production:** Vercel project env only; push from local with URL overrides: `npm run env:push-vercel` (`scripts/push-env-to-vercel.mjs` → `https://www.hoteletuna.com`)
  - **Do not** commit `.env.local`; do not paste localhost URLs into Vercel
- **Detail:** `docs/project/PLANNING.md` § DNS, domains & environment URLs · `docs/project/TASK.md` § DNS checklist

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
| **DRY** | `proxy.ts`, `withApiAuth`, `requireTenantSessionUser`; Sofia `sofia-concierge-handler`; SOC2 `control-matrix` + `nayaone-tsc-framework`; fraud `tenant-fraud-rules`; `lib/copy/`, `lib/data/rooms.ts` |
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

### 8.1 Vision metrics (Agentic CRM & Intelligent OS — baseline June 2026 → target Dec 2026)

Measurable outcomes for the §1.1 vision. These extend (do not replace) the operational metrics above.

| Goal | Metric | Baseline (Jun 2026) | Target (Dec 2026) |
|------|--------|---------------------|-------------------|
| Guest hub adoption | % of booked guests who log into `/guest` | <20% (est.) | >70% |
| Digital check‑in usage | % of arrivals using online check‑in | 0% | >50% |
| Upsell revenue | Avg extra spend per guest (upgrade / pre‑order) | N$0 | N$150 |
| Staff time saved | Minutes per shift saved by automation | 0 | 90 min |
| Sofia resolution rate | % of inquiries resolved without a human | ~60% | >85% |
| First‑response time | Avg time to answer a guest message | Unknown | <30 sec |
| Revenue per available room (RevPAR) | vs current baseline | baseline | +20% |
| NPS (guest satisfaction) | Score 0–10 | Not measured | >70 |

---

## 9. Design Direction (Brand)

**Canonical CI reference:** `docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf` (Hotel Etuna Designs corporate identity guide). Token implementation: `tailwind.config.ts` (`ci.*` palette) + `lib/copy/brand.ts`.

**Copy taglines (distinct):**
- **Logo script (English):** *"Your house away from home"* — on logo lockups and email footers (`brand.logoTagline` / `brand.tagline`).
- **Public hero headline:** *"Hotel Etuna"* (`brand.taglineTitleCase`).
- **Oshiwambo etymology:** *"He takes care of us"* — about page and story copy only (`brand.oshiwamboMeaning`).

### 9.1 Color Palette (CI tiers)

**Primary** — logo lockup only; Rustic Red is dominant; these are the only two colors in the full‑colour logo.

| Token | Hex | Usage |
|-------|-----|-------|
| `ci.primary` / Rustic Red | `#790C19` | Logo mark, **primary CTA**, favicon, theme-color |
| `ci.cream` | `#F3E8D7` | Logo cream, `primary-content`, warm surfaces |

**Secondary** — blend with primary; do not use in isolation from primary colours.

| Token | Hex | Usage |
|-------|-----|-------|
| `ci.secondary.tan` | `#DABC92` | Sub-headings, soft fills |
| `ci.secondary.taupe` | `#A58B72` | Tables, pull quotes *(CI-corrected from #B58B72)* |
| `ci.secondary.chocolate` | `#4B3428` | Deep secondary text |
| `ci.secondary.gold` | `#D4AF37` | VIP / celebration moments |
| `ci.secondary.crimson` | `#BA082C` | Emphasis accents |

**Accent** — charts, icons, supplementary collateral; prefer with primary + secondary.

| Token | Hex | Usage |
|-------|-----|-------|
| `ci.accent.ochre` | `#9A7D43` | Data viz, icons |
| `ci.accent.gold` | `#C6A46A` | Highlights |
| `ci.accent.offWhite` | `#FAF6F0` | Canvas alternative |
| `ci.accent.forest` | `#5E6651` | Nature depth |
| `ci.accent.sage` | `#9BAE8A` | Nature accent |
| `ci.accent.terracotta` | `#6D3722` | Headings / neutral |
| `ci.accent.rose` | `#C89B95` | Soft decorative |

**Digital UI extensions** (warm hospitality surfaces — not in CI logo):

| Token | Hex | Usage |
|-------|-----|-------|
| `nude‑50` | `#fef7f0` | Page backgrounds (cards white) |
| `nude‑100`–`nude‑900` | see `tailwind.config.ts` | Borders, ink ramp |
| `nude‑500`–`nude‑600` | see `tailwind.config.ts` | Secondary warmth (badges, not primary CTA) |

### 9.1.1 Logo variants

| Variant | Asset (`public/brand/`) | Allowed contexts |
|---------|------------------------|------------------|
| Primary | `hotel-etuna-logo-primary.png` | Website header, brochures, ads, social |
| Horizontal (+ tagline) | `hotel-etuna-logo-horizontal.png` | Letterhead, email signature, signage |
| Horizontal (compact) | `hotel-etuna-logo-horizontal-compact.png` | Nav, tight horizontal slots |
| Wordmark | `hotel-etuna-wordmark.png` | Co-branding, sponsorship, tight spaces |
| Monogram | `hotel-etuna-mark.png` | Favicon, app icon, sidebar, watermarks |
| Stacked (+ tagline) | `hotel-etuna-logo-stacked.png` | Certificates, awards, reception walls |
| Stacked (compact) | `hotel-etuna-logo-stacked-compact.png` | Premium signage without tagline |

Component: `HotelEtunaLogo` with `variant` prop — see `components/brand/HotelEtunaLogo.tsx`.

### 9.2 Typography

- **Display:** Playfair Display — headlines, signage, marketing (Regular → Black)
- **Body:** Inter — UI, booking, menus (Light, Regular, Medium), 16px base
- **Signature:** Dancing Script — logo tagline render, welcome, promotions (Regular, Bold)
- **Mono:** JetBrains Mono (invoices, analytics, code)

### 9.3 Component Direction

- **Primary button:** `btn-primary` / `bg-ci-primary hover:bg-ci-primary/90 text-primary-content`
- **Focus ring:** `ring‑2 ring‑ci-primary ring‑offset‑2`
- **Cards:** flat — border + surface colour; browse/ops cards carry **no** shadow (hover → `border-nude-300`). `shadow‑etuna‑elevated` only on modals / sticky panels (DS §7).
- **Touch targets:** ≥44px on mobile
- **Hub sidebar:** Hotel Etuna "HE" badge + name
- **Partner dashboard:** Neutral palette, no Sofia/CRM navigation

### 9.4 Tone of Voice

- Warm, personal, knowledgeable — like a friend who grew up in northern Namibia
- Inclusive: "we" and "you", never the royal "Hotel Etuna allows"
- Oshiwambo sprinklings: "Moro" (Hello), "Wa lalapo?" (How are you?), "Nangalei po" (Goodbye)
- Marketing hero headline: *"Hotel Etuna"*; Oshiwambo meaning of Etuna explained on About (`brand.oshiwamboMeaning`)

### 9.5 Brand & design system (locked decisions)

**Token canon:** CI hex in **`tailwind.config.ts`** (`ci.*`); text via the `ink` ramp; digital surface extensions (`nude-*`); `rustic` + `luxury-*` retained. The unused `khaki-*` / `terracotta-*` legacy ramps were removed in DS v1.1.0. Brand copy in `lib/copy/{brand,public}.ts`. Prefer `ci-*` / `ink-*` utilities in new UI. Keep §9.1–9.7 aligned with `docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf` and `docs/brand/DESIGN_SYSTEM.md`.

**Locked creative direction:**
- **Official CI palette** — Rustic Red `#790C19` dominant (logo + primary CTA); cream `#F3E8D7` for logo cream and `primary-content`.
- **Nude foundation** remains the digital UI spine (`nude-50` canvas, white cards); body ink via `ink` ramp for WCAG AA.
- **Secondary CI colours** for sub-headings, tables, badges — not isolated from primary.
- **Accent CI colours** for charts, icons, nature (`sage #9bae8a`), headings (`terracotta #6d3722`).
- **DaisyUI theme `hoteletuna`:** `primary`→`#790C19`, `primary-content`→`#F3E8D7`, `neutral`→`#4B3428`, `accent`→`#9A7D43`, bases→cream/off-white.
- **Typography:** Playfair Display (display), Inter (body), Dancing Script (signature/tagline), JetBrains Mono (ops).
- **Interaction:** pill buttons (`rounded-full`), focus `ring-ci-primary`, ≥44px touch targets; partner dashboards stay neutral.

**Airy / photography-first layout (Etuna browse pattern, 2026-06):**
- **Canvas:** `bg-surface-background` (`ci.accent.offWhite` / `#FAF6F0`); cards and headers white (`surface.elevated` / `surface.header`).
- **Typography roles:** `text-caption`, `text-body`, `text-heading-sm`, `text-heading`, `text-display` in `tailwind.config.ts`; body ink via the `ink` ramp (`text-ink-900` body/headings, `text-ink-700` secondary) — **not** `text-nude-*` (now scoped to surfaces/borders) and **not** DaisyUI `text-primary` (that is Rustic Red CTA).
- **Shadows:** `shadow-etuna-elevated` only on modals and sticky booking panels; browse/listing cards **no shadow** (`.etuna-listing-card`, `Card variant="listing"`).
- **Radii:** `rounded-etuna-card` (20px) for listing tiles; `rounded-etuna-input` (14px) for inputs; legacy `rounded-2xl` may remain on older shells until migrated.
- **Filter chips exception:** category taxonomy uses `.etuna-filter-pill` (`rounded-etuna-button` / 8px) — **not** primary CTAs (those stay pill/`rounded-full`).
- **Component index** (`components/features/marketing/`): `EtunaListingCard`, `EtunaFeaturedBadge`, `EtunaSectionHeader`, `EtunaFilterPill`, `EtunaIconButton`, `EtunaCarouselRow` (no marketplace search shell — Etuna is property OS, not a destination marketplace).
- **CSS utilities** (`globals.css`): `.etuna-listing-card`, `.etuna-section-header`, `.etuna-filter-pill`, `.etuna-icon-btn`, `.etuna-carousel-row`, `.etuna-panel` (flat ops cards), `.dashboard-card` (flattened border-only).

**Strategy basis (summary):** positioning is a *Playing to Win* cascade — win in northern
Namibia's mid-premium, desk-led + digital-capture segment by binding word-of-mouth into
repeatable pipelines (CRM, loyalty, corporate rates) rather than imitating global luxury
chains. (Originated from MBA "Project 9" systems analysis of Etuna Guesthouse.) Tours are
**not** offered on the public site or in Sofia's KB.

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

**Usage:** Mark in **Rustic Red** (`ci.primary`) on cream; pair with Playfair wordmark “Hotel Etuna”; script tagline *Your house away from home* on lockups. `HotelEtunaLogo` `onDark` for footers. No “& Tours” in lockup.

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
| 1 | **Hero:** "Hotel Etuna" — background image, CTA buttons | `properties` (hub) | None (public) |
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
- Testing & smoke: **`TASK.md`** § Production smoke, § Testing Procedures (`npm run test:all`)
- Summary: **`TASK.md`** § Verified Implementation Audit (May 17, 2026)

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
- **Embeddings:** Qdrant Cloud Inference — `intfloat/multilingual-e5-small` (**384‑dim**); vectors computed at upsert/query in Qdrant
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

## 12. Implementation Status (verified May 17, 2026)

Evidence: codebase inspection + `npx tsc --noEmit` (pass) + `npm run test:db` / `test:db:migrations` / smoke (pass) + Vitest **415/429** (12 workflow-test failures). Full checklist: **`TASK.md`** § Verified Implementation Audit + § Analytics, responsive UI & E2E.

### ✅ Complete (production)

| Area | Details | Verified |
|------|---------|----------|
| **Neon DB + RLS** | Hub/partner schema, 62+ policies | RLS script pass |
| **Public website** | DB-driven landing, gated pricing via `lib/copy/public.ts` | No `text-gray-*` on public `app/` routes |
| **API §4.7 gaps** | `GET /api/bookings`, `PATCH/DELETE /api/menu/[itemId]`, `/api/staff/[id]`, staff shifts | Route files present |
| **Cash + PWA + session** | Reconciliation, offline queue, 30m/8h timeout | Implemented per Phase 2–4 |
| **Security hardening** | CORS domain-locked, debug auth 404 in prod, `sanitizeErrorDetails` | Code review May 16 |
| **TypeScript** | Clean compile | `tsc` exit 0 |
| **Digital menu (`/dining`)** | DB-only menu, single-page viewer (2×3 food grid), analytics favourites, image seed/validate scripts | §3.1.1 |
| **Scripts hygiene** | Production scripts only under `scripts/`; obsolete archive removed May 2026 | `ls scripts` |
| **E2E coverage** | **8** Playwright specs; `responsive-layout`; projects: chromium, mobile-chrome, tablet | `playwright.config.ts`, `e2e/*.spec.ts` |
| **PostHog analytics** | `posthog-js` 1.373.5, `@posthog/react`, `instrumentation-client.ts`, server `posthog-server.ts` | `lib/posthog-client-options.ts`; unit tests 4/4 |
| **Responsive UI** | Dashboard sidebar drawer, public hero/rooms/dining, menu book mobile grid | Deployed May 17 (`hoteletuna.com`) |
| **Automated test gate** | `test:db` + migrations **21/21** + Vitest **427**/429 pass + smoke **6/6**; workflow tests **78/78** | May 17, 2026 — `npm run test:ci` |
| **Operator SQL** | Migrations **0011–0017** on Neon | `npm run test:db:migrations` — 18/18 |
| **NamQR receipt email** | Desk confirm + NamQR manual folio settle | `HospitalityNamQrPaymentService`, `ManualPaymentService` |
| **Sofia intent** | Guest-message-first classification | `SofiaConciergeService.resolveIntent()` |

### 🟡 In progress / operator action

| Item | Priority | Status |
|------|----------|--------|
| **RAG ingestion to Qdrant** | P0 | `npm run rag:seed` — Qdrant Inference 384d (`RAG_USE_QDRANT_INFERENCE=true`) |
| **Production smoke** | P1 | Manual §0 on https://hoteletuna.com after each deploy |
| **npm audit (transitive)** | P1 | **0 critical** at `npm audit --audit-level=critical` (overrides in `package.json` for `fast-xml-parser`, `protobufjs`); **17** total advisories — run `npm audit fix` for non-breaking updates before release |
| **UI enhancements** | P2 | Extract `RoomCard`/`ReviewCard`; skeleton loaders; `globals.css` `ci-primary` focus rings |

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
- ✅ Qdrant Inference + `QDRANT_INFERENCE_DIMENSIONS=384` documented in `.env.example`
- ⏳ Full Qdrant upsert — operator runs ingestion script (external rate limits)

### Phase 6: Testing & Launch Hardening ✅
- ✅ Vitest suite (**427** passed, 2 skipped); workflow YAML tests **78/78** aligned with `ci.yml` / `deploy.yml`
- ✅ Playwright **1.60.0**: 8 specs; mobile + tablet projects; `responsive-layout.spec.ts`
- ✅ PostHog: `@posthog/react`, `instrumentation-client.ts`, SPA defaults `2026-01-30`
- ✅ Sofia email FK fixture fix (tenant-scoped test data)

### Phase 7: Cleanup & Documentation Lock ✅
- ✅ Obsolete scripts removed; production scripts in `scripts/` + `scripts/db/`
- ✅ Canonical docs: PRD / PLANNING / TASK only (+ rebrand + README)
- ✅ May 16 audit snapshots merged into §12 and TASK; redundant `docs/*_2026-05-16.md` removed

### Agentic CRM & Intelligent OS roadmap (Phases 8–12) — vision (§1.1)

Forward‑looking; ~16 weeks total, parallel tracks possible. Each phase ships independent business value. Subtask breakdown lives in `TASK.md` § Agentic CRM & Intelligent OS (Vision); architectural guardrails in PLANNING § Agentic CRM & Intelligent OS roadmap.

| Phase | Focus | Duration | Key deliverables |
|-------|-------|----------|------------------|
| **8** | Guest command centre (core) | 4 weeks | Online check‑in, service/maintenance requests, upgrade/downgrade, messaging, folio widget |
| **9** | Staff intelligence layer | 4 weeks | Real‑time alerts, voice commands, predictive task automation, mobile PWA + push |
| **10** | Sofia co‑pilot (proactive) | 3 weeks | Proactive nudges, sentiment + handover, multi‑channel context, layered memory, auto‑upsell |
| **11** | Intelligent OS (analytics & automation) | 3 weeks | Forecasting + **approval‑gated rate recommendations**, predictive maintenance, **approval‑gated reorder recommendations**, compliance automation |
| **12** | UX polish & performance | 2 weeks | Design‑system audit, skeleton loaders everywhere, offline queue, WCAG 2.1 AA fixes |

**Guardrails (do not break):** Neon + Drizzle only (no raw SQL injection); NextAuth primary + Stack optional, platform admin via `@buffr.ai`; Adumo Virtual + NamQR + cash (no Stripe/RealPay for guests); hub‑and‑spoke RLS with Sofia hub‑exclusive; ISR for public pages, API p95 <300ms; CSRF + rate limits + immutable audit; Vitest/Playwright + `security:preflight` CI gate.

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

- **Namibia framework review (quarterly):** `docs/compliance/NAMIBIA_REGULATORY_FRAMEWORK.md` + BoN corpus **Appendix F**; close gap register G-01–G-09.
- **Payment / fraud:** Add NPS trend rules (CNP / EFT-confirm) to seed; Security Prompt Pack §14 master review before major release.
- **SOC 2:** Policy sign-off (21), vendor attestations (`vendor-attestations/`), evidence under `compliance/evidence/`, tabletop IR per `INCIDENT_RESPONSE_PLAN.md`.
- **Security Prompt Pack:** §14 on major releases; `npm run security:preflight`; archive JSON under `compliance/evidence/security/`.
- **Annual external test:** Penetration test on payment and auth paths.
- **Partner verification:** KYC/KYB documentation reviewed annually.

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
- **Brand & design system:** §9.5 above · token canon `tailwind.config.ts`

### Appendix E: Public Content Accuracy & Landing Structure

Public copy is aligned to seeded Neon data (no fictional amenities). Canonical facts:

| Area | Notes |
|------|--------|
| **Rooms** | Slugs: `standard-room-type-a`, `standard-room-type-b`, `standard-room-type-c`, `executive-room`, `premiere-room`; Premiere Room must not advertise amenities absent from DB (e.g. private pool). |
| **Contact** | 5544 Valley Street, Ongwediva; +264 65 231 177; +264 81 802 4833; check-in 14:00, check-out 11:00. |
| **Etuna Restaurant** | Name “Etuna Restaurant”; breakfast **07:00–10:00**; lunch, dinner & bar **10:00–22:00**. |
| **Partners** | JayLa: four self-catering rooms; Aquarius: one double-room penthouse — copy matches tenant/property records. |
| **Tours** | **Not offered** on the public site or in RAG (v2.7.2). `/tours` must 404; no nav/footer links. |

**Gated content verification (manual):** Incognito — prices hidden on `/`, `/rooms`, `/dining`, `/partners`; login preserves `?redirect=`; Sofia refuses rate/availability prompts without auth (see Section 3).

### Appendix F: BoN / Namibia regulatory source corpus (`mba-agent`)

Read-only reference for counsel and engineering (not duplicated in `hotel-etuna/docs/`). Map to product via **`docs/compliance/NAMIBIA_REGULATORY_FRAMEWORK.md`**.

| File (under `mba-agent/documents/mba-agent/regulatory/namibia/`) | Topic |
|------------------------------------------------------------------|--------|
| `payment_system_management_act_act_14_of_2023.md` | PSMA umbrella |
| `payment_system_notice_2025.md` | Licensed PSP capital/fees (partners, not merchant) |
| `payment_systems_in_namibia.md` | NPS background |
| `nps_strategy_2030.md` | National payment strategy |
| `determination_on_the_licensing_and_authorisation_of_payment.md` | PSD-1 PSP licensing |
| `guidance_note_on_the_payment_service_providers_regulated_by.md` | Merchant vs PSP boundaries |
| `determination_on_issuing_of_electronic_money_in_namibia.md` | PSD-3 e-money (out of scope v1) |
| `determination_on_the_conduct_of_card_transactions_within_the.md` | PSD-4 cards / CNP |
| `determination_on_the_conduct_of_electronic_funds_transfer_tr.md` | PSD-9 EFT |
| `determination_of_the_operational_and_cybersecurity_standards.md` | PSD-12 cyber/ops |
| `determination_on_the_efficiency_of_the_national_payment_syst.md` | PSD-7 efficiency |
| `determination_on_the_designation_of_systemically_important_s.md` | PSD-13 SIPS |
| `determination_for_the_authorisation_of_payment_system_operat.md` | PSD-6 PSO |
| `determination_on_the_imposition_of_administrative_penalties.md` | PSD-8 penalties |
| `namibia_qr_code_standards.md` | NamQR v5.0 (May 2025) |
| `namibia_open_banking_standards.md` | Open banking (draft / roadmap) |
| `fintech_regulatory_framework_bon.md` | BoN innovation framework |
| `namibia_digital_finance_ecosystem_assessment_and_strategy_fi.md` | Digital finance strategy |
| `nps_fraud_trend_report_10_years.md` | Fraud typologies (CNP, phishing, etc.) |
| `fic_nam.md` | FIC / AML context |
| `electronic_transactions_act_4_of_2019.md` | ETA e-commerce / records |
| `namfisa_regulatory_sandbox_guidance_note_for_microlending_co.md` | NAMFISA sandbox (N/A) |
| `regulatory_research_notes.md` | Informal notes — not authority |

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

**Kept separate (not merged):** `data/hotel-etuna-knowledge/*.md` (Sofia corpus), `README.md` (onboarding), `docs/compliance/**` (SOC 2 program), `docs/naming-conventions.md`, `docs/SECURITY_PROMPT_PACK.md`.

---

## 15. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-28 | Engineering Team | Initial PRD for single-tenant Hotel Etuna |
| 2.0.0 | 2026-04-28 | Engineering Team | Added B2B partner network, self-service portal, Neon DB migration, hub-and-spoke architecture, database-driven landing page, review approval workflow |
| **2.1.0** | **2026-04-28** | **Engineering Team** | **Added gated content strategy (Section 3): authentication wall for prices/booking, Sofia AI gated enforcement, sign-up conversion KPIs, implementation phases updated, restored full PRD detail** |
| **2.2.0** | **2026-04-28** | **Engineering Team** | **Aligned status with completed Phases 1-4 (public hardening, cash/reconciliation, PWA/offline, session security) and re-baselined remaining work to Phases 5-7 (Voyage ingestion, test stabilization, cleanup/docs).** |
| **2.3.0** | **2026-04-29** | **Engineering Team** | **Consolidated scattered root documentation into canonical `docs/project/*`; added Appendix E (public content accuracy, gated verification pointer); updated references to `docs/TESTING_GUIDE.md`.** |
| **2.3.1** | **2026-05-13** | **Product / engineering** | **Added §7.5 pointer to the brand questionnaire (brand answers, competitor landscape, positioning).** |
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
| **2.8.0** | **2026-05-17** | **Product Team** | **§3.1.2** public room photo tours: masked rates for guests, same `RoomPhotoTour` when signed in; Premier occupancy 4 + mini fridge seed. |
| **2.8.1** | **2026-05-17** | **Product Team** | **Testing & compliance:** `test:db` / `test:all` gates; migrations **0015–0016**; compliance fraud DB smoke; NamQR payment receipt emails; Sofia `resolveIntent()`; Vitest **393**/395. |
| **2.8.2** | **2026-05-17** | **Product Team** | **§3.3.1** guest vs staff sign-in (header `/guest`, footer `/dashboard`); §3.1.2 rate hardening (`public-rate.ts`, availability API); `/rooms#tour`; Stack placeholder guard (`stack-env.ts`). |
| **2.8.3** | **2026-05-17** | **Product Team** | **§3.3.1** session-aware `PublicAuthNav` (Sign out + My stay/Dashboard/Platform); `DevTestSessionBanner` for stale `@example.com` dev sessions; **§3.3.2** Buffr platform admin (NextAuth resolution, `provision-platform-admin.ts`, `george@buffr.ai`); §3.1.2 `PublicRoomTourSignInCard` + client `RoomBookingCard`; `super-admin` middleware access. |
| **2.8.4** | **2026-05-17** | **Product Team** | **§3.3.3** guest hub: past stays + loyalty on `GET /api/guest/stays`; guest registration on hub tenant; `lib/auth/roles.ts` post-login routing; `user`/`guest` proxy access; read-only past folio; `GuestLoyaltySummary` + account nav. |
| **2.8.5** | **2026-05-17** | **Product Team** | **§3.3.3** `users`↔`guests` link on register/verify; folio type enums; guest API `requireRole` + verified-email access; middleware redirect hardening; Tailwind khaki/terracotta ramps; guest UI semantic errors. |
| **2.8.6** | **2026-05-17** | **Product Team** | **§3.3.4** production checklist; password policy + Turnstile; `schema-types.ts`; Redis fail-closed rate limits; dev-only auth logs; header **My stays** link. |
| **2.9.0** | **2026-05-17** | **Product Team** | **§3.6** system map: full structure summary, seven user journeys (J1–J7), identity model (`users`↔`guests`), authorization layers, role can/cannot matrix, page + API access tables, implementation file index; §4.6 cross-ref. |
| **2.9.1** | **2026-05-17** | **Product Team** | **§3.1.1** `/dining` menu UX: `MenuBookSinglePageViewer` (full-width one page, Previous/Next); food **2×3** (6/page) with name/description/price on tiles; `MenuPageTurner` unused on public dining. |
| **2.9.1** | **2026-05-17** | **Product Team** | **§2.4** personas → roles → surfaces table aligned with §3.6; **§4.6** tree regenerated (229 dirs / 352 files), depth-4 `app/guest/` + `admin/platform/`, migrations `0000`–`0016`, current `scripts/`. |
| **2.9.2** | **2026-05-17** | **Product / compliance** | **§3.7** Namibia regulatory matrix, fraud runtime vs `0016`, SOC 2 + Security Prompt Pack; **Appendix F** BoN corpus index; §6.2 / §14.4 aligned with `docs/compliance/*`. |
| **2.9.3** | **2026-05-17** | **Engineering** | **Fraud:** `tenant-fraud-rules.ts` wires `0016` to `PsdFraudGate` + analyze API; production fail-closed; preflight 12/12 (May 17). |
| **2.9.4** | **2026-05-17** | **Engineering** | **PostHog:** `instrumentation-client.ts`, `@posthog/react`, `defaults: 2026-01-30`. **Playwright:** 1.60.0, 3 viewport projects, `responsive-layout.spec.ts`. **Tests:** workflow YAML tests refreshed (`ci-workflow`, `deploy-workflow`); Vitest **427**/429; `test:ci` gate green. |
| **2.9.5** | **2026-05-17** | **Engineering** | **§6.5** DNS + local vs production env: canonical `www.hoteletuna.com`, Vercel DNS table, `.env.local` localhost documented; `env:push-vercel` → `www`; `.env.example` comments. |
| **2.9.6** | **2026-06-08** | **Engineering** | **Doc consolidation to 3 SoT (PRD/PLANNING/TASK).** §9.5 now holds locked brand & design-system decisions (folded from the rebrand questionnaire); §3.3 gains room/facility source-of-truth paths (folded from `ROOM_INVENTORY.md`). Buffr proposal removed (commercial terms handled with counsel out-of-band). PLANNING gains a SQL↔API↔Frontend matrix + Dispatch agents section; TASK gains a Production gaps table. |
| **2.10.0** | **2026-06-08** | **Product Team** | **Agentic CRM & Intelligent OS vision folded into the 3 SoT.** New §1.1 (core promise, 3 pillars, 5 goals); §8.1 vision metrics (hub adoption, digital check‑in, upsell, RevPAR, NPS, Sofia resolution); §13 Phases 8–12 roadmap (~16 weeks) with guardrails. PLANNING gains § Agentic CRM & Intelligent OS roadmap; TASK gains § Agentic CRM & Intelligent OS (Vision) subtasks. `TREE.txt` regenerated (499 dirs / 1058 files, depth 5). |

---

*This PRD (v2.10.0) is effective June 8, 2026 and supersedes all previous versions. It will be reviewed quarterly with Hotel Etuna management and updated as needed. All implementation teams must reference this document as the source of truth for product requirements, architecture decisions, and success metrics.*
