# Hotel Etuna — Product Requirements Document (PRD)

**Version:** 2.0.0  
**Date:** April 28, 2026  
**Audience:** Product, engineering, design, Hotel Etuna management  
**Status:** ✅ Production — All Core Features Implemented & Verified  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long‑form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **hub‑and‑spoke hospitality platform** built on the Buffr Host core, featuring:

- A **flagship property** (Hotel Etuna) with full PMS, CRM, F&B, and staff operations
- A **public‑facing guest website** for booking rooms, viewing amenities, dining menus, and AI‑powered concierge (Sofia)
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
| **AI (Sofia)** | **Hub‑exclusive AI concierge** with knowledge base for Hotel Etuna only. RAG over Hotel Etuna property documents, guest preferences, CRM memory. Human escalation for low confidence or policy keywords. **Partners do not have access to Sofia AI or any AI features.** |
| **Guest‑Facing Website** | Public homepage with hero, Hotel Etuna room listings, restaurant menu, photo gallery, contact page, **plus** a "Referral Partners" section showcasing partner properties. Fully branded with Hotel Etuna visual identity. **✅ Database‑driven** — all content pulled live from Neon DB. **✅ Review approval workflow** (`is_public` toggle). |
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
| **Public Listings** | Each partner gets a public profile page at `/partners/[slug]` (e.g., `/partners/jayla`). Displays: hero image, property description, room listings, photo gallery, amenities, booking widget (pre‑filled with partner's propertyId), contact information. **No Sofia AI chat widget** — simple contact form instead. |
| **Booking & Commission** | All bookings processed centrally. Commission model: configurable percentage (default 10%) on partner bookings. `commission_amount` calculated at booking time. Hub admin dashboard shows aggregated commissions per partner, filterable by date range. |
| **AI Exclusivity** | **Sofia AI is exclusive to Hotel Etuna (hub tenant only).** All AI endpoints (`/api/sofia/*`, `/api/ai/*`, `/api/crm/*`) are restricted to hub tenant only via middleware enforcement. Partners cannot access CRM, knowledge base, or any AI features. |

---

## 3. Non‑Functional Requirements

### 3.1 Architecture & Data Isolation

- **Hub‑and‑Spoke Multi‑Tenancy:** Hotel Etuna = hub tenant with full access. Partners = lightweight tenants with strict RLS enforcement. 62 PostgreSQL RLS policies active. `tenant_type` enum distinguishes `hub` from `partner`. `parent_tenant_id` links partners to hub.
- **Database:** **Neon (serverless Postgres)** — connection pooling for serverless environments. Drizzle ORM handles all database interactions. No Supabase‑specific features used.
- **Vector Database:** **Qdrant** — collection `sofia_knowledge` with hub tenant namespace for Hotel Etuna property knowledge.

### 3.2 Security & Compliance

- **Authentication:** Stack Auth (or NextAuth) for all users. JWT tokens include `tenant_id` and `role` claims.
- **Authorization:** RBAC: `owner`, `manager`, `admin`, `staff`. Middleware enforces tenant isolation. Hub‑only routes (`/api/sofia/*`, `/api/crm/*`, `/api/ai/*`) return 403 for partners.
- **Rate Limiting:** Aggressive limits on partner invite endpoint (5 requests/hour). Standard limits on public APIs (100 requests/minute per IP).
- **Two‑Factor Authentication:** Required for all hub admin actions affecting payments, commissions, or partner management.
- **Data Protection:** GDPR and POPIA compliant. Marketing consent flags enforced in CRM queries. Audit trail logs all sensitive operations with old/new values, user ID, IP, timestamp.
- **Session Management:** 8‑hour absolute session max, 30‑minute inactivity timeout (with 2‑minute warning toast), rolling session extension on activity.

### 3.3 Branding & User Experience

| Surface | Theme |
|---------|-------|
| **Hotel Etuna Public Website** | Khaki‑rustic‑savannah palette: `khaki‑600` (#b8955a) primary CTA, `terracotta‑800` (#8b4a2e) headings, `sage‑green` (#9bae8a) nature accents. Playfair Display for headlines, Inter for body. |
| **Hub Admin Dashboard** | Same Hotel Etuna branding. "HE" badge in sidebar. No workspace switcher. All "Buffr Host" references replaced. |
| **Partner Portal** | Neutral, light palette. Partner property name in header. No Sofia/CRM navigation links. |
| **Partner Public Listings** | Hotel Etuna website wrapper with partner‑specific content. Partner logo and images. Contact form (not Sofia chat widget). |
| **Email Templates** | Hotel Etuna branded for hub emails. Simple transactional templates for partner booking confirmations. |

### 3.4 Performance & Reliability

- **Uptime Target:** 99.9% (aligned with PSD‑12)
- **AI Reliability:** Multi‑provider fallback (DeepSeek → Anthropic → Groq)
- **Caching:** ISR revalidation every 300 seconds on landing page
- **Image Handling:** Vercel Blob for property images; max 5MB per image, 20 images per property

### 3.5 Deployability

- **Hosting:** Vercel (Next.js App Router)
- **Domain:** `hoteletuna.com` with Vercel DNS
- **Environment Variables:** All secrets in Vercel project settings; `.env.local` for local development

---

## 4. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite‑only)
- Multi‑property management inside a partner tenant
- Full B2B outbound sales funnel
- External CRM as system of record
- Third‑party OTA integration (Booking.com, Expedia)
- Partner mobile app (responsive web only)
- Blockchain/crypto payments

---

## 5. Success Metrics

- Guests complete booking in <3 minutes with consistent state between website and back‑office
- Partner onboarding works end‑to‑end (invite → claim → listing live)
- Commission tracking is 100% accurate and auditable
- Zero cross‑tenant data leakage (verified by RLS test script)
- Sofia remains unavailable to partners (middleware‑enforced 403)
- Sofia AI answers ≥70% of guest inquiries correctly
- Staff manage 100% of booking lifecycle digitally (zero spreadsheets)
- CRM captures ≥95% of guest interactions

---

## 6. Design Direction (Brand)

### 6.1 Color Palette

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

### 6.2 Typography

- **Body:** Inter (system‑ui stack), 16px base
- **Display:** Playfair Display (headlines, room names, hero text)
- **Mono:** JetBrains Mono (invoices, analytics, code)
- **Signature:** Dancing Script (limited personal touches)

### 6.3 Component Direction

- **Primary button:** `bg‑khaki‑600 hover:bg‑khaki‑700 text‑white`
- **Focus ring:** `ring‑2 ring‑khaki‑600 ring‑offset‑2`
- **Cards:** `shadow‑nude‑soft`, hover lifts with `shadow‑khaki‑medium`
- **Touch targets:** ≥44px on mobile
- **Hub sidebar:** Hotel Etuna "HE" badge + name
- **Partner dashboard:** Neutral palette, no Sofia/CRM navigation

### 6.4 Tone of Voice

- Warm, personal, knowledgeable — like a friend who grew up in northern Namibia
- Inclusive: "we" and "you", never the royal "Hotel Etuna allows"
- Oshiwambo sprinklings: "Moro" (Hello), "Wa lalapo?" (How are you?), "Nangalei po" (Goodbye)
- Tagline: *"He Takes Care of Us"*

---

## 7. Landing Page Structure (`app/page.tsx`)

**✅ DATABASE‑DRIVEN IMPLEMENTATION COMPLETE**

All sections are **database‑driven** (React Server Component with Drizzle ORM queries):

| # | Section | Data Source |
|---|---------|-------------|
| 1 | **Hero:** "He Takes Care of Us" — background image, CTA buttons | `properties` (hub) |
| 2 | **Etuna Story:** Brand narrative, stats (5 rooms, pool, 10+ tours) | Static text + `rooms` count |
| 3 | **Rooms:** 5 room type cards with real amenities, prices, slugs | `rooms` table |
| 4 | **Dining:** Etuna Restaurant overview, sample menu items | `restaurants` + `cms_menu_items` |
| 5 | **Tours:** 7 curated tours with descriptions, prices | Static (future: `tours` table) |
| 6 | **Guest Love:** Approved reviews only (`is_public = true`), aggregate rating | `guest_reviews` |
| 7 | **Booking Widget:** Date picker, guests, room type selector | `POST /api/bookings/availability` |
| 8 | **Referral Partners:** JayLa + Aquarius cards | `tenants` (type=partner) + `properties` |
| 9 | **Footer:** Real address, phone, email, quick links | `properties` (hub) |

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

## 8. Technical Architecture

### 8.1 System Overview

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
                     │ (Database‑driven)│
                     └─────────────────┘
```

### 8.2 Database (Neon Serverless Postgres)

- **34 tables** migrated from Buffr Host
- **6 additional migrations** for partner network (0003–0006)
- **62 RLS policies** enforcing tenant isolation
- **Key tables:** `tenants` (with `type`, `parent_tenant_id`, `commission_percent`), `properties`, `rooms`, `bookings` (with `commission_amount`), `guest_reviews` (with `is_public`), `partner_invites`

### 8.3 API Architecture

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
- All blocked for partners via middleware → 403

### 8.4 Sofia AI Architecture (Hub Only)

- **Qdrant** vector database for semantic search
- **LLM Provider Router:** DeepSeek → Anthropic → Groq (fallback chain)
- **Knowledge Base:** 5 Hotel Etuna documents (facts, rooms, restaurant, tours, local area)
- **Chunking:** Semantic chunking with 800‑char target, 100‑char overlap
- **Embeddings:** OpenAI `text‑embedding‑3‑small` (1536‑dim) — requires API key; fallback to Voyage AI, Ollama, or Hugging Face
- **Multi‑Channel:** Web chat, email, WhatsApp, phone (all hub only)
- **Human Escalation:** Low confidence (<0.55) or policy keywords trigger staff notification

---

## 9. Implementation Status (April 28, 2026)

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

### ⚠️ Pending

| Item | Priority |
|------|----------|
| **OpenAI/Voyage API key** for Sofia embeddings | P1 |
| **Session inactivity timeout** implementation | P1 |
| **E2E test suite update** for database‑driven content | P1 |
| **Duplicate service consolidation** (Fraud, Menu) | P2 |
| **On‑demand revalidation** for instant review approval reflection | P2 |
| **Image upload UI** for admin | P2 |

---

## 10. Change Control

Material scope/behavior changes must update this PRD in the same change set as implementation. Reviewed quarterly with Hotel Etuna management.

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026‑04‑28 | Initial single‑tenant Hotel Etuna PRD |
| **2.0.0** | **2026‑04‑28** | Added B2B partner network, self‑service portal, Neon DB migration, hub‑and‑spoke architecture, **database‑driven landing page**, **review approval workflow**, Sofia AI exclusivity enforcement, complete design direction, implementation status tracking |

---

*This PRD (v2.0.0) is effective April 28, 2026 and supersedes all previous versions. All implementation teams must reference this document as the source of truth for product requirements, architecture decisions, and success metrics.*
