# Hotel Etuna — Product Requirements Document (PRD)

**Version:** 2.1.0  
**Date:** April 28, 2026  
**Audience:** Product, engineering, design, Hotel Etuna management  
**Status:** ✅ Production — All Core Features Implemented & Verified  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long‑form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **hub‑and‑spoke hospitality platform** built on the Buffr Host core, featuring:

- A **flagship property** (Hotel Etuna) with full PMS, CRM, F&B, and staff operations
- A **public‑facing guest website** with **gated content** (descriptions visible, prices/booking require login) for booking rooms, viewing amenities, dining menus, and AI‑powered concierge (Sofia)
- A **B2B referral partner network** enabling trusted properties (JayLa Accommodation, Aquarius Airbnb Windhoek) to join the platform
- **Self‑service partner portals** for independent property management while earning Hotel Etuna commissions

**Core Architecture:** Hotel Etuna operates as the **hub tenant** with full platform capabilities. Referral partners are **lightweight partner tenants** with isolated self‑service dashboards, public listing pages, and **no AI features**. All bookings flow through the platform with commission tracking.

**Positioning:** Hotel Etuna is the **operating system for one flagship property** that extends its brand and reach by curating a network of trusted lodging partners in Windhoek, creating a comprehensive hospitality ecosystem.

---

## 2. Core Capabilities (In Scope)

### 2.1 Hotel Etuna (Hub Tenant) — Core Operations

| Domain | Requirements |
|--------|----------------|
| **PMS** | Complete property management for Hotel Etuna: 5 room types (Standard, Luxury, Family, Executive Suite, Premier), dynamic rates (editable via admin), availability calendar, online booking flow, booking lifecycle (confirmed → checked‑in → checked‑out → completed/cancelled). Hub admin can view all bookings (own + partners) for commission reporting. |
| **Restaurant** | Etuna Restaurant management: 16 menu items across 5 categories (Breakfast, Starters, Mains, Desserts, Drinks), in‑room QR code ordering, order status lifecycle (pending → preparing → served). |
| **Guest CRM** | Comprehensive guest profiles, preferences, **CRM memory** (facts, relationship edges), contact history, marketing consent. All guests who book through the platform are stored in the central CRM. `/api/crm/*` endpoints accessible by hub admin across all properties. |
| **Staff & Dashboard** | Role‑based access for Hotel Etuna staff (owner, manager, front‑desk, housekeeping, kitchen). Audit logging for all sensitive actions. Staff dashboard is hub‑specific and includes partner management features. |
| **Communications** | Sofia AI voice/web chat, WhatsApp webhook, support tickets. Email automation (booking confirmations, check‑in reminders, post‑stay thank you). **Hub tenant only** — partners do not have Sofia AI or email automation. |
| **Support** | Platform support tickets for hotel staff and partners. Integrated issue tracker for bug reports, feature requests. Hub admin can view all support tickets. |
| **Compliance & Risk** | Consumer rights / cyber incident lifecycles; **KYC/KYB for Hotel Etuna and all partners**. Court‑admissible audit themes. All regulatory requirements (PSD‑12, PSD‑4, ETA 2019) apply platform‑wide. |
| **AI (Sofia)** | **Hub‑exclusive AI concierge** with knowledge base for Hotel Etuna only. RAG over Hotel Etuna property documents, guest preferences, CRM memory. Human escalation for low confidence or policy keywords. **Partners do not have access to Sofia AI or any AI features.** Sofia enforces gated content: will not disclose prices or availability to unauthenticated users, instead prompts sign‑up. |
| **Guest‑Facing Website** | Public homepage with hero, Hotel Etuna room listings, restaurant menu, photo gallery, contact page, **plus** a "Referral Partners" section showcasing partner properties. Fully branded with Hotel Etuna visual identity. **✅ Database‑driven** — all content pulled live from Neon DB. **✅ Review approval workflow** (`is_public` toggle). **✅ Gated content model** — prices/booking hidden until login. |
| **Platform** | Hub‑and‑spoke multi‑tenancy with `tenant_type` distinction. Hub admin has elevated permissions. Domain: `hoteletuna.com` with partner subpages at `/partners/[slug]`. |

### 2.2 B2B Referral Partner Network

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

| Domain | Requirements |
|--------|----------------|
| **Partner Management** | Hub admin can invite external properties (JayLa Accommodation — 4 self‑catering rooms; Aquarius Luxurious Penthouse — 1 double room) via email. Each invite creates a **Partner Tenant** with isolated access to only their property, rooms, rates, images, and bookings. RLS policies enforce complete tenant isolation. |
| **Self‑Service Portal** | Partners authenticate via `/partner` route and land on a white‑labeled dashboard. They can manage: property name, description, photos, room types, rates, availability calendar, and view their bookings. No access to hub features or other partners. |
| **Invite & Onboarding** | Hub admin clicks **"Invite Partner"** in the dashboard, enters partner email and property name. System generates a unique invite token, sends branded email with sign‑up link. Partner claims invite, sets password, auto‑creates their tenant (`type=partner`) and property record. |
| **Public Listings** | Each partner gets a public profile page at `/partners/[slug]` (e.g., `/partners/jayla`). Displays: hero image, property description, room listings, photo gallery, amenities, booking widget (pre‑filled with partner's propertyId), contact information. **No Sofia AI chat widget** — simple contact form instead. **Gated content:** Partner prices hidden until user logs in. |
| **Booking & Commission** | All bookings processed centrally. Commission model: configurable percentage (default 10%) on partner bookings. `commission_amount` calculated at booking time. Hub admin dashboard shows aggregated commissions per partner, filterable by date range. |
| **AI Exclusivity** | **Sofia AI is exclusive to Hotel Etuna (hub tenant only).** All AI endpoints (`/api/sofia/*`, `/api/ai/*`, `/api/crm/*`) are restricted to hub tenant only via middleware enforcement. Partners cannot access CRM, knowledge base, or any AI features. |

---

## 3. Gated Content Strategy (Authentication Wall)

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
| **/rooms** | Room type cards with images, descriptions, amenities icons. | Prices, booking button. | "Sign In to View Prices & Book" on each card. |
| **/rooms/[slug]** | Photo gallery, full description, amenities list, room capacity. | Price per night, date picker / booking widget. | "Sign In to Check Availability" CTA. |
| **/dining** | Restaurant name, description, menu categories, **dish names & descriptions** (no prices). | Prices, "Order to Room" button. | "Sign In to Order Online" CTA. |
| **/tours** | Tour titles, descriptions, durations, images. | Prices, booking button. | "Sign In to Book a Tour" CTA. |
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
| **Dining Page** | Show menu with names/descriptions, hide prices. Replace "Order" with "Sign in to order". |
| **Tours Page** | Show tour details without prices. Replace "Book Now" with "Sign in to book". |
| **Partner Pages** | Apply same gating: hide partner room prices, replace booking widget with sign‑in prompt. |
| **Sofia AI** | System prompt: *"Never disclose prices or availability to unauthenticated users. Instead, invite them to sign up."* Chat widget visible to all, but responses change based on auth state. |
| **Login Redirect** | After successful login, read `redirect` query param and return user to original page. Default to `/dashboard` if no redirect. |

### 3.5 Verification Checklist

- [ ] Visit site in incognito → no prices visible, all CTAs lead to login
- [ ] Log in → all prices, booking, and ordering features appear
- [ ] Sofia chat responds with sign‑up invitation when asked about prices
- [ ] Login redirect works correctly from all pages
- [ ] Authenticated users see no "Sign in" CTAs (replaced with booking widgets)

---

## 4. Non‑Functional Requirements

### 4.1 Architecture & Data Isolation

- **Hub‑and‑Spoke Multi‑Tenancy:** Hotel Etuna = hub tenant with full access. Partners = lightweight tenants with strict RLS enforcement. 62 PostgreSQL RLS policies active. `tenant_type` enum distinguishes `hub` from `partner`. `parent_tenant_id` links partners to hub.
- **Database:** **Neon (serverless Postgres)** — connection pooling for serverless environments. Drizzle ORM handles all database interactions. No Supabase‑specific features used.
- **Vector Database:** **Qdrant** — collection `sofia_knowledge` with hub tenant namespace for Hotel Etuna property knowledge.

### 4.2 Security & Compliance

- **Authentication:** Stack Auth (or NextAuth) for all users. JWT tokens include `tenant_id` and `role` claims.
- **Authorization:** RBAC: `owner`, `manager`, `admin`, `staff`. Middleware enforces tenant isolation. Hub‑only routes (`/api/sofia/*`, `/api/crm/*`, `/api/ai/*`) return 403 for partners.
- **Rate Limiting:** Aggressive limits on partner invite endpoint (5 requests/hour). Standard limits on public APIs (100 requests/minute per IP).
- **Two‑Factor Authentication:** Required for all hub admin actions affecting payments, commissions, or partner management.
- **Data Protection:** GDPR and POPIA compliant. Marketing consent flags enforced in CRM queries. Audit trail logs all sensitive operations with old/new values, user ID, IP, timestamp.
- **Session Management:** 8‑hour absolute session max, 30‑minute inactivity timeout (with 2‑minute warning toast), rolling session extension on activity.

### 4.3 Branding & User Experience

| Surface | Theme |
|---------|-------|
| **Hotel Etuna Public Website** | Khaki‑rustic‑savannah palette: `khaki‑600` (#b8955a) primary CTA, `terracotta‑800` (#8b4a2e) headings, `sage‑green` (#9bae8a) nature accents. Playfair Display for headlines, Inter for body. |
| **Hub Admin Dashboard** | Same Hotel Etuna branding. "HE" badge in sidebar. No workspace switcher. All "Buffr Host" references replaced. |
| **Partner Portal** | Neutral, light palette. Partner property name in header. No Sofia/CRM navigation links. |
| **Partner Public Listings** | Hotel Etuna website wrapper with partner‑specific content. Partner logo and images. Contact form (not Sofia chat widget). |
| **Email Templates** | Hotel Etuna branded for hub emails. Simple transactional templates for partner booking confirmations. |

### 4.4 Performance & Reliability

- **Uptime Target:** 99.9% (aligned with PSD‑12)
- **AI Reliability:** Multi‑provider fallback (DeepSeek → Anthropic → Groq)
- **Caching:** ISR revalidation every 300 seconds on landing page
- **Image Handling:** Vercel Blob for property images; max 5MB per image, 20 images per property

### 4.5 Deployability

- **Hosting:** Vercel (Next.js App Router)
- **Domain:** `hoteletuna.com` with Vercel DNS
- **Environment Variables:** All secrets in Vercel project settings; `.env.local` for local development

---

## 5. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite‑only)
- Multi‑property management inside a partner tenant
- Full B2B outbound sales funnel
- External CRM as system of record
- Third‑party OTA integration (Booking.com, Expedia)
- Partner mobile app (responsive web only)
- Blockchain/crypto payments

---

## 6. Success Metrics

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

## 7. Design Direction (Brand)

### 7.1 Color Palette

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
| `sage‑green` | `#9bae8a` | Nature/tours accents |

### 7.2 Typography

- **Body:** Inter (system‑ui stack), 16px base
- **Display:** Playfair Display (headlines, room names, hero text)
- **Mono:** JetBrains Mono (invoices, analytics, code)
- **Signature:** Dancing Script (limited personal touches)

### 7.3 Component Direction

- **Primary button:** `bg‑khaki‑600 hover:bg‑khaki‑700 text‑white`
- **Focus ring:** `ring‑2 ring‑khaki‑600 ring‑offset‑2`
- **Cards:** `shadow‑nude‑soft`, hover lifts with `shadow‑khaki‑medium`
- **Touch targets:** ≥44px on mobile
- **Hub sidebar:** Hotel Etuna "HE" badge + name
- **Partner dashboard:** Neutral palette, no Sofia/CRM navigation

### 7.4 Tone of Voice

- Warm, personal, knowledgeable — like a friend who grew up in northern Namibia
- Inclusive: "we" and "you", never the royal "Hotel Etuna allows"
- Oshiwambo sprinklings: "Moro" (Hello), "Wa lalapo?" (How are you?), "Nangalei po" (Goodbye)
- Tagline: *"He Takes Care of Us"*

---

## 8. Landing Page Structure (`app/page.tsx`)

**✅ DATABASE‑DRIVEN IMPLEMENTATION COMPLETE**

All sections are **database‑driven** (React Server Component with Drizzle ORM queries):

| # | Section | Data Source | Gated Content |
|---|---------|-------------|---------------|
| 1 | **Hero:** "He Takes Care of Us" — background image, CTA buttons | `properties` (hub) | None (public) |
| 2 | **Etuna Story:** Brand narrative, stats (5 rooms, pool, 10+ tours) | Static text + `rooms` count | None (public) |
| 3 | **Rooms:** 5 room type cards with names, images, amenities | `rooms` table | ✅ **Prices hidden** — "Sign in to view prices" CTA |
| 4 | **Dining:** Etuna Restaurant overview, dish names/descriptions | `restaurants` + `cms_menu_items` | ✅ **Prices hidden** — "Sign in to order" CTA |
| 5 | **Tours:** 7 curated tours with descriptions, durations | Static (future: `tours` table) | ✅ **Prices hidden** — "Sign in to book" CTA |
| 6 | **Guest Love:** Approved reviews only (`is_public = true`), aggregate rating | `guest_reviews` | None (public) |
| 7 | **Booking Widget:** Replaced with "Sign in to check availability" card | `properties` | ✅ **Entire widget hidden** — auth required |
| 8 | **Referral Partners:** JayLa + Aquarius cards | `tenants` (type=partner) + `properties` | None (names/images public) |
| 9 | **Footer:** Real address, phone, email, quick links | `properties` (hub) | None (public) |

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
- ⏳ **Gated content:** Prices hidden until authentication (PENDING)

**Review Approval Workflow:**
- ✅ Admin dashboard at `/crm/reviews` with toggle functionality
- ✅ `PATCH /api/crm/reviews/[id]` endpoint to toggle `is_public`
- ✅ `GET /api/crm/reviews` endpoint for all reviews with guest/property joins
- ✅ Filter by status (all, approved, pending), sort by date/rating
- ✅ Real‑time optimistic UI updates
- ✅ NextAuth authentication + role‑based authorization (owner, manager, admin only)

**Documentation:**
- Detailed implementation: `docs/reports/DATABASE_DRIVEN_LANDING_PAGE.md`
- Testing guide: `TESTING_GUIDE.md`
- Summary: `IMPLEMENTATION_COMPLETE.md`

---

## 9. Technical Architecture

### 9.1 System Overview

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

### 9.2 Database (Neon Serverless Postgres)

- **34 tables** migrated from Buffr Host
- **6 additional migrations** for partner network (0003–0006)
- **62 RLS policies** enforcing tenant isolation
- **Key tables:** `tenants` (with `type`, `parent_tenant_id`, `commission_percent`), `properties`, `rooms`, `bookings` (with `commission_amount`), `guest_reviews` (with `is_public`), `partner_invites`

### 9.3 API Architecture

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

### 9.4 Sofia AI Architecture (Hub Only)

- **Qdrant** vector database for semantic search
- **LLM Provider Router:** DeepSeek → Anthropic → Groq (fallback chain)
- **Knowledge Base:** 5 Hotel Etuna documents (facts, rooms, restaurant, tours, local area)
- **Chunking:** Semantic chunking with 800‑char target, 100‑char overlap
- **Embeddings:** Voyage AI `voyage-3` (1024‑dim) or OpenAI `text‑embedding‑3‑small` (1536‑dim); fallback to Ollama or Hugging Face
- **Multi‑Channel:** Web chat, email, WhatsApp, phone (all hub only)
- **Human Escalation:** Low confidence (<0.55) or policy keywords trigger staff notification
- **Gated Content Enforcement:** System prompt instructs Sofia to never disclose prices/availability to unauthenticated users, instead prompting sign‑up

---

## 10. Implementation Status (April 28, 2026)

### ✅ Complete

| Area | Details |
|------|---------|
| **Neon DB Migration** | All 34 tables + 6 partner migrations applied |
| **RLS Policies** | 62 policies active, verified by test script |
| **Hub Seeding** | Hotel Etuna property, 5 rooms, 16 menu items, admin user |
| **Partner Seeding** | JayLa (4 rooms), Aquarius (1 room) |
| **Public Website** | Landing page (database‑driven), /rooms, /dining, /tours, /about, /contact, /partners, /[partnerSlug] |
| **Admin Dashboard** | Sidebar branded, all Buffr Host references replaced |
| **Partner Portal** | Self‑service dashboard with isolated routes |
| **Database‑Driven Landing Page** | ✅ All sections query live from Neon DB (rooms, restaurant, reviews, partners, footer) |
| **Review Approval Workflow** | ✅ `is_public` toggle via admin, only approved reviews on public site, API endpoints implemented |
| **Branding** | Khaki‑terracotta‑sage palette, Playfair Display, "HE" badge |
| **Middleware** | Tenant isolation, hub‑only route blocking, public route whitelist |
| **TypeScript** | Zero errors |
| **Production Build** | Successful (92 APIs + 61 pages compiled) |

### ⏳ In Progress / Pending

| Item | Priority | Status |
|------|----------|--------|
| **Gated Content (Authentication Wall)** | P0 | ⏳ **SPEC COMPLETE** — Implementation pending |
| **Sofia AI Gated Content Enforcement** | P0 | ⏳ System prompt update needed |
| **OpenAI/Voyage API key** for Sofia embeddings | P1 | Voyage AI selected, rate limit handling implemented |
| **Session inactivity timeout** implementation | P1 | Spec defined (30‑min timeout, 2‑min warning) |
| **E2E test suite update** for database‑driven content | P1 | Pending |
| **Duplicate service consolidation** (Fraud, Menu) | P2 | Pending |
| **On‑demand revalidation** for instant review approval reflection | P2 | Pending |
| **Image upload UI** for admin | P2 | Pending |

---

## 11. Implementation Phases & Timeline

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

### Phase 5: Gated Content (Week 8) ⏳ CURRENT
- ⏳ AuthGate Context implementation
- ⏳ Hide prices/booking for unauthenticated users
- ⏳ Login redirect with query parameter
- ⏳ Sofia AI gated content enforcement
- ⏳ Verification testing (incognito + authenticated)

### Phase 6: Testing & Launch (Week 9)
- Integration and E2E tests
- Partner beta (JayLa, Aquarius)
- Performance optimization
- Production deployment

### Phase 7: Post-Launch (Ongoing)
- Monitor KPIs (sign‑up conversion, partner signups, commission revenue)
- Partner feedback and iteration
- Additional partner invites (expansion)
- Feature enhancements based on usage data

---

## 12. Change Control & Governance

### 12.1 PRD Updates

- **Material Changes:** Any scope addition/removal, architectural shift, or KPI modification requires PRD update in the same PR/commit as the implementation.
- **Non-Material Changes:** Bug fixes, UI polish, and minor copy changes do not require PRD updates but should be documented in `CHANGELOG.md`.
- **Approval Process:** Material changes require sign-off from Hotel Etuna management and engineering lead.

### 12.2 Partner Policy Changes

- **Commission Rate Adjustments:** Require 30-day notice to affected partners via email.
- **Terms of Service Updates:** Partners must acknowledge updated terms before next payout.
- **Feature Deprecation:** Minimum 90-day deprecation notice with migration path provided.

### 12.3 Technical Debt Management

- **Monthly Review:** Engineering team reviews technical debt backlog.
- **Quarterly Prioritization:** Balance new features with debt paydown (target: 20% of sprint capacity for debt).
- **Critical Debt:** Security vulnerabilities, performance bottlenecks, or RLS bypasses are P0 and addressed immediately.

### 12.4 Compliance & Audit

- **Quarterly Compliance Review:** Verify PSD-12, PSD-4, ETA 2019 adherence.
- **Annual Security Audit:** External penetration testing and vulnerability assessment.
- **Partner Verification:** KYC/KYB documentation reviewed annually per Bank of Namibia requirements.

---

## 13. Appendices

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

### Appendix D: External References

- **Buffr Host PRD:** `/Users/georgenekwaya/Downloads/ai-agent-mastery-main/buffr-host/PRD.md`
- **Neon Documentation:** https://neon.tech/docs
- **Bank of Namibia PSD-12:** Payment systems directive (compliance)
- **Vercel Deployment Guide:** https://vercel.com/docs
- **Qdrant Documentation:** https://qdrant.tech/documentation
- **Database-Driven Landing Page:** `docs/reports/DATABASE_DRIVEN_LANDING_PAGE.md`
- **Testing Guide:** `TESTING_GUIDE.md`

---

## 14. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-28 | Engineering Team | Initial PRD for single-tenant Hotel Etuna |
| 2.0.0 | 2026-04-28 | Engineering Team | Added B2B partner network, self-service portal, Neon DB migration, hub-and-spoke architecture, database-driven landing page, review approval workflow |
| **2.1.0** | **2026-04-28** | **Engineering Team** | **Added gated content strategy (Section 3): authentication wall for prices/booking, Sofia AI gated enforcement, sign-up conversion KPIs, implementation phases updated, restored full PRD detail** |

---

*This PRD (v2.1.0) is effective April 28, 2026 and supersedes all previous versions. It will be reviewed quarterly with Hotel Etuna management and updated as needed. All implementation teams must reference this document as the source of truth for product requirements, architecture decisions, and success metrics.*
