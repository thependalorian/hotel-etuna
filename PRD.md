# Hotel Etuna — Product Requirements Document (PRD)

**Audience:** Product, engineering, design, Hotel Etuna management  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long-form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **single-tenant hospitality platform with a referral partner network** built from the Buffr Host core:

- A public-facing Hotel Etuna website and booking experience.
- A private Hotel Etuna operations dashboard (PMS, CRM, communications, compliance).
- A controlled B2B partner network with isolated self-service partner dashboards.

Hotel Etuna is the **hub tenant**. Referral properties are **partner tenants**.

---

## 2. Core Capabilities (In Scope)

| Domain | Requirements |
|--------|----------------|
| **PMS (Hub)** | Hotel Etuna property, rooms, rates, availability, booking lifecycle. |
| **Restaurant (Hub)** | Hotel Etuna menu and service lifecycle. |
| **CRM (Hub)** | Guest profiles, preferences, memory facts, consent-aware outreach. |
| **Partner Management** | Invite partners by email; each partner has isolated tenant data. |
| **Partner Self-Service** | Partner dashboard: property profile, rooms, rates, availability, bookings. |
| **Public Partner Listings** | `/partners` and `/[partnerSlug]` pages with partner details and booking button. |
| **Booking & Commission** | Central booking flow with partner commission tracking (`commission_percent`, `commission_amount`). |
| **Onboarding Funnel** | Invite -> claim token -> create partner tenant/property/user. |

### Sofia AI Exclusivity

Sofia AI is **hub-only** (Hotel Etuna only):

- No Sofia widget on partner pages
- No partner access to `/api/ai/*`, `/api/sofia/*`, `/api/crm/*`
- No partner Qdrant namespaces or AI ingestion

---

## 3. Non-Functional Requirements

- **Data Isolation:** Partner tenants fully isolated via RLS + middleware authorization.
- **Database:** Neon serverless Postgres with Drizzle ORM.
- **Security:** Strong auth, role checks, rate limits on invite/claim and admin-sensitive routes.
- **Branding:** Hotel Etuna khaki-rustic-savannah identity for hub/public, neutral partner admin theme.
- **Reliability:** 99.9% uptime target and traceability for key workflows.
- **Deployability:** Vercel-compatible Next.js API/workers with Neon pooled/unpooled connections.

---

## 4. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite-only)
- Multi-property management inside a partner tenant

---

## 5. Success Metrics

- Guests complete booking in under 3 minutes with consistent state.
- Partner onboarding works end-to-end (invite, claim, listing live).
- Commission tracking is accurate and auditable.
- No cross-tenant leakage.
- Sofia remains unavailable to partners.

---

## 6. Design Direction (Brand)

### 6.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `nude-50` | `#fef7f0` | Page backgrounds |
| `nude-100` | `#fceee0` | Card backgrounds |
| `nude-200` | `#f8dcc0` | Borders, dividers |
| `nude-300` | `#f2c49f` | Inactive states |
| `nude-400` | `#e8a87a` | Secondary hover |
| `nude-500` | `#d18b5c` | Base nude |
| `khaki-600` | `#b8955a` | Primary CTA |
| `khaki-700` | `#9a7d43` | CTA hover |
| `terracotta-800` | `#8b4a2e` | Heading text |
| `terracotta-900` | `#6d3722` | Deep text |
| `khaki-sand` | `#c4a97d` | Badges/soft bg |
| `sage-green` | `#9bae8a` | Nature/tours accents |

### 6.2 Typography

- Body: Inter
- Display: Playfair Display
- Mono: JetBrains Mono
- Accent script: Dancing Script (limited)

### 6.3 Component Direction

- Primary button: `bg-khaki-600 hover:bg-khaki-700 text-white`
- Focus ring: `ring-khaki-600`
- Hub sidebar: Hotel Etuna logo and brand
- Partner dashboard: neutral palette, no Sofia/CRM nav

---

## 7. Landing Page Structure (`app/page.tsx`)

1. Hero: "He Takes Care of Us"
2. Etuna Story
3. Rooms
4. Dining
5. Tours & Experiences
6. Guest Love
7. Booking Widget
8. Referral Partners (Jayla, Aquarius cards)
9. Footer

---

## 8. Change Control

Material scope/behavior changes must update this PRD in the same change set as implementation.

---

*Effective April 28, 2026. Reviewed quarterly with Hotel Etuna management.*
# Hotel Etuna — Product Requirements Document (PRD)

**Audience:** Product, engineering, design, Hotel Etuna management  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long-form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **single-tenant hospitality platform with a referral partner network** built from the Buffr Host core:

- A public-facing Hotel Etuna website and booking experience.
- A private Hotel Etuna operations dashboard (PMS, CRM, communications, compliance).
- A controlled B2B partner network with isolated self-service partner dashboards.

Hotel Etuna is the **hub tenant**. Referral properties are **partner tenants**.

---

## 2. Core Capabilities (In Scope)

| Domain | Requirements |
|--------|----------------|
| **PMS (Hub)** | Hotel Etuna property, rooms, rates, availability, booking lifecycle. |
| **Restaurant (Hub)** | Hotel Etuna menu and service lifecycle. |
| **CRM (Hub)** | Guest profiles, preferences, memory facts, consent-aware outreach. |
| **Partner Management** | Invite partners by email; each partner has isolated tenant data. |
| **Partner Self-Service** | Partner dashboard: property profile, rooms, rates, availability, bookings. |
| **Public Partner Listings** | `/partners` and `/[partnerSlug]` pages with partner details and booking button. |
| **Booking & Commission** | Central booking flow with partner commission tracking (`commission_percent`, `commission_amount`). |
| **Onboarding Funnel** | Invite → claim token → create partner tenant/property/user. |

### Sofia AI Exclusivity

Sofia AI is **hub-only** (Hotel Etuna only):

- No Sofia widget on partner pages
- No partner access to `/api/ai/*`, `/api/sofia/*`, `/api/crm/*`
- No partner Qdrant namespaces or AI ingestion

---

## 3. Non-Functional Requirements

- **Data Isolation:** Partner tenants fully isolated via RLS + middleware authorization.
- **Database:** Neon serverless Postgres with Drizzle ORM.
- **Security:** Strong auth, role checks, rate limits on invite/claim and admin-sensitive routes.
- **Branding:** Hotel Etuna khaki-rustic-savannah identity for hub/public, neutral partner admin theme.
- **Reliability:** 99.9% uptime target and traceability for key workflows.
- **Deployability:** Vercel-compatible Next.js API/workers with Neon pooled/unpooled connections.

---

## 4. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite-only)
- Multi-property management inside a partner tenant

---

## 5. Success Metrics

- Guests complete booking in under 3 minutes with consistent state.
- Partner onboarding works end-to-end (invite, claim, listing live).
- Commission tracking is accurate and auditable.
- No cross-tenant leakage.
- Sofia remains unavailable to partners.

---

## 6. Design Direction (Brand)

### 6.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `nude-50` | `#fef7f0` | Page backgrounds |
| `nude-100` | `#fceee0` | Card backgrounds |
| `nude-200` | `#f8dcc0` | Borders, dividers |
| `nude-300` | `#f2c49f` | Inactive states |
| `nude-400` | `#e8a87a` | Secondary hover |
| `nude-500` | `#d18b5c` | Base nude |
| `khaki-600` | `#b8955a` | Primary CTA |
| `khaki-700` | `#9a7d43` | CTA hover |
| `terracotta-800` | `#8b4a2e` | Heading text |
| `terracotta-900` | `#6d3722` | Deep text |
| `khaki-sand` | `#c4a97d` | Badges/soft bg |
| `sage-green` | `#9bae8a` | Nature/tours accents |

### 6.2 Typography

- Body: Inter
- Display: Playfair Display
- Mono: JetBrains Mono
- Accent script: Dancing Script (limited)

### 6.3 Component Direction

- Primary button: `bg-khaki-600 hover:bg-khaki-700 text-white`
- Focus ring: `ring-khaki-600`
- Hub sidebar: Hotel Etuna logo and brand
- Partner dashboard: neutral palette, no Sofia/CRM nav

---

## 7. Landing Page Structure (`app/page.tsx`)

1. Hero: “He Takes Care of Us”
2. Etuna Story
3. Rooms
4. Dining
5. Tours & Experiences
6. Guest Love
7. Booking Widget
8. Referral Partners (Jayla, Aquarius cards)
9. Footer

---

## 8. Change Control

Material scope/behavior changes must update this PRD in the same change set as implementation.

---

*Effective April 28, 2026. Reviewed quarterly with Hotel Etuna management.*
# Hotel Etuna — Product Requirements Document (PRD)

**Audience:** Product, engineering, design, Hotel Etuna management  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long-form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **single-tenant hospitality platform with a referral partner network** built from the Buffr Host core:

- A public-facing Hotel Etuna website and booking experience.
- A private Hotel Etuna operations dashboard (PMS, CRM, communications, compliance).
- A controlled B2B partner network with isolated self-service partner dashboards.

Hotel Etuna is the **hub tenant**. Referral properties are **partner tenants**.

---

## 2. Core Capabilities (In Scope)

| Domain | Requirements |
|--------|----------------|
| **PMS (Hub)** | Hotel Etuna property, rooms, rates, availability, booking lifecycle. |
| **Restaurant (Hub)** | Hotel Etuna menu and service lifecycle. |
| **CRM (Hub)** | Guest profiles, preferences, memory facts, consent-aware outreach. |
| **Partner Management** | Invite partners by email; each partner has isolated tenant data. |
| **Partner Self-Service** | Partner dashboard: property profile, rooms, rates, availability, bookings. |
| **Public Partner Listings** | `/partners` and `/[partnerSlug]` pages with partner details and booking button. |
| **Booking & Commission** | Central booking flow with partner commission tracking (`commission_percent`, `commission_amount`). |
| **Onboarding Funnel** | Invite → claim token → create partner tenant/property/user. |

### Sofia AI Exclusivity

Sofia AI is **hub-only** (Hotel Etuna only):

- No Sofia widget on partner pages
- No partner access to `/api/ai/*`, `/api/sofia/*`, `/api/crm/*`
- No partner Qdrant namespaces or AI ingestion

---

## 3. Non-Functional Requirements

- **Data Isolation:** Partner tenants fully isolated via RLS + middleware authorization.
- **Database:** Neon serverless Postgres with Drizzle ORM.
- **Security:** Strong auth, role checks, rate limits on invite/claim and admin-sensitive routes.
- **Branding:** Hotel Etuna khaki-rustic-savannah identity for hub/public, neutral partner admin theme.
- **Reliability:** 99.9% uptime target and traceability for key workflows.
- **Deployability:** Vercel-compatible Next.js API/workers with Neon pooled/unpooled connections.

---

## 4. Out of Scope

- Partner AI/CRM parity with hub
- Open marketplace onboarding (partners are invite-only)
- Multi-property management inside a partner tenant

---

## 5. Success Metrics

- Guests complete booking in under 3 minutes with consistent state.
- Partner onboarding works end-to-end (invite, claim, listing live).
- Commission tracking is accurate and auditable.
- No cross-tenant leakage.
- Sofia remains unavailable to partners.

---

## 6. Design Direction (Brand)

### 6.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `nude-50` | `#fef7f0` | Page backgrounds |
| `nude-100` | `#fceee0` | Card backgrounds |
| `nude-200` | `#f8dcc0` | Borders, dividers |
| `nude-300` | `#f2c49f` | Inactive states |
| `nude-400` | `#e8a87a` | Secondary hover |
| `nude-500` | `#d18b5c` | Base nude |
| `khaki-600` | `#b8955a` | Primary CTA |
| `khaki-700` | `#9a7d43` | CTA hover |
| `terracotta-800` | `#8b4a2e` | Heading text |
| `terracotta-900` | `#6d3722` | Deep text |
| `khaki-sand` | `#c4a97d` | Badges/soft bg |
| `sage-green` | `#9bae8a` | Nature/tours accents |

### 6.2 Typography

- Body: Inter
- Display: Playfair Display
- Mono: JetBrains Mono
- Accent script: Dancing Script (limited)

### 6.3 Component Direction

- Primary button: `bg-khaki-600 hover:bg-khaki-700 text-white`
- Focus ring: `ring-khaki-600`
- Hub sidebar: Hotel Etuna logo and brand
- Partner dashboard: neutral palette, no Sofia/CRM nav

---

## 7. Landing Page Structure (`app/page.tsx`)

1. Hero: “He Takes Care of Us”
2. Etuna Story
3. Rooms
4. Dining
5. Tours & Experiences
6. Guest Love
7. Booking Widget
8. Referral Partners (Jayla, Aquarius cards)
9. Footer

---

## 8. Change Control

Material scope/behavior changes must update this PRD in the same change set as implementation.

---

*Effective April 28, 2026. Reviewed quarterly with Hotel Etuna management.*
# Hotel Etuna — Product Requirements Document (PRD)

**Version:** 2.0.0  
**Date:** April 28, 2026  
**Audience:** Product, engineering, design, Hotel Etuna management  
**DRY:** Architecture and rationale live in **`PLANNING.md`**. Execution checklist lives in **`TASK.md`**. Long-form technical phases remain in **`IMPLEMENTATION_PLAN.md`** until merged into TASK.

---

## 1. Product Summary

Hotel Etuna is a **hub-and-spoke hospitality platform** built on the Buffr Host core, featuring:

- A **flagship property** (Hotel Etuna) with full PMS, CRM, F&B, and staff operations
- A **public-facing guest website** for booking rooms, viewing amenities, dining menus, and AI-powered concierge
- A **B2B referral partner network** enabling trusted properties (Jayla Accommodation, Aquarius Airbnb Windhoek) to join the platform
- **Self-service partner portals** for independent property management while earning Hotel Etuna commissions

**Core Architecture:** Hotel Etuna operates as the **hub tenant** with full platform capabilities. Referral partners are **lightweight partner tenants** with isolated self-service dashboards, public listing pages, and optional AI concierge. All bookings flow through the platform with commission tracking.

**Positioning:** Hotel Etuna is the **operating system for one flagship property** that extends its brand and reach by curating a network of trusted lodging partners in Windhoek, creating a comprehensive hospitality ecosystem.

---

## 2. Core Capabilities (In Scope)

### 2.1 Hotel Etuna (Hub Tenant) — Core Operations

| Domain | Requirements |
|--------|----------------|
| **PMS** | Complete property management for Hotel Etuna: rooms, dynamic rates (editable via admin), availability calendar, online booking flow, booking lifecycle (confirmed → checked-in → checked-out → completed/cancelled). Hub admin can view all bookings (own + partners) for commission reporting. |
| **Restaurant** | On-site restaurant management: menu items, categories, ordering from in-room QR codes, order status lifecycle (pending → preparing → served). Optional feature that can be disabled. |
| **Guest CRM** | Comprehensive guest profiles, preferences, **CRM memory** (facts, relationship edges), contact history, marketing consent. All guests who book through the platform (Hotel Etuna or partners) are stored in the central CRM. `/api/crm/*` endpoints accessible by hub admin across all properties. |
| **Staff & Dashboard** | Role-based access for Hotel Etuna staff (owner, manager, front-desk, housekeeping, kitchen). Audit logging for all sensitive actions. Staff dashboard is hub-specific and includes partner management features. |
| **Communications** | Sofia AI voice/web chat, WhatsApp webhook, support tickets. Email automation (booking confirmations, check-in reminders, post-stay thank you). **Hub tenant only** - partners do not have Sofia AI or email automation. |
| **Support** | Platform support tickets for hotel staff and partners. Integrated issue tracker for bug reports, feature requests. Hub admin can view all support tickets. |
| **Compliance & Risk** | Consumer rights / cyber incident lifecycles; **KYC/KYB for Hotel Etuna and all partners** (owner verification). Court-admissible audit themes. All regulatory requirements from Buffr Host PSD-12, PSD-4, ETA 2019 apply platform-wide. |
| **AI (Sofia)** | **Hub-exclusive AI concierge** with knowledge base for Hotel Etuna only. RAG over Hotel Etuna property documents, guest preferences, CRM memory. Hub staff manage all Sofia settings. Human escalation for low confidence or policy keywords. **Partners do not have access to Sofia AI or any AI features.** |
| **Guest-Facing Website** | Public homepage with hero, Hotel Etuna room listings, amenities, restaurant menu, photo gallery, contact page, **plus** a "Referral Partners" section showcasing partner properties. Fully branded with Hotel Etuna visual identity. |
| **Platform** | Hub-and-spoke multi-tenancy with `tenant_type` distinction. Hub admin has elevated permissions. Domain: `hoteletuna.com` with partner subpages at `/[partnerSlug]`. |

### 2.2 B2B Referral Partner Network — New Domain

> **⚠️ CRITICAL: Sofia AI & ML/AI Features Are EXCLUSIVE to Hotel Etuna**
>
> Partners receive a **basic self-service listing platform** with property management, booking tracking, and commission reports. They do **NOT** receive:
> - Sofia AI concierge or chat widgets
> - Email automation or AI-generated content
> - CRM access or guest memory features
> - Knowledge base or RAG capabilities
> - Any ML/AI-powered features whatsoever
>
> Partner public listing pages display a simple contact form or phone number instead of AI chat. All AI endpoints are middleware-blocked for partner tenants.

| Domain | Requirements |
|--------|----------------|
| **Partner Management** | Hub admin can invite external properties (Jayla Accommodation, Aquarius Airbnb Windhoek) via email. Each invite creates a **Partner Tenant** with isolated access to only their property, rooms, rates, images, and bookings. Partners never see Hotel Etuna's internal data or other partners' data. RLS policies enforce complete tenant isolation. |
| **Self-Service Portal** | Partners authenticate via a dedicated route (e.g., `/partner` or subdomain `partner.hoteletuna.com`) and land on a white-labeled dashboard. They can manage: property name, description, photos, room types, rates, availability calendar, F&B (optional), and view their bookings. No access to hub features or other partners. |
| **Invite & Onboarding** | Hub admin clicks **"Invite Partner"** in the dashboard, enters partner email and property name. System generates a unique invite token, sends branded email with sign-up link. Partner claims invite, sets password, auto-creates their tenant (`type=partner`) and property record. Onboarding wizard guides initial setup (rooms, photos, rates). |
| **Public Listings** | Each partner gets a public profile page on the main Hotel Etuna website under **"Referral Partners"** or **"More Lodging in Windhoek"**. Partner pages (`/[partnerSlug]`) display: hero image, property description, room listings, photo gallery, amenities, booking widget (pre-filled with partner's propertyId), contact information. |
| **Booking & Commission** | All bookings made through Hotel Etuna's platform (including partner bookings) are processed centrally. Commission model: configurable percentage (default 10%) on partner bookings. Commission amount calculated at booking time and stored in `commission_amount` field. Hub admin dashboard shows aggregated commissions per partner, filterable by date range. |
| **Payment Flow** | Partner bookings follow the same payment workflow as hub bookings. Commission is deducted before settlement to partner. Hub admin can mark commissions as "paid" and track payout history. Alternative: booking can redirect to partner's external booking system if preferred (with affiliate tracking). |
| **AI Exclusivity** | **Sofia AI is exclusive to Hotel Etuna (hub tenant only).** Partners do NOT receive Sofia AI, chat widgets, email automation, or any AI/ML capabilities. Partner public listing pages display a simple contact form or phone number instead of a chat widget. All AI endpoints (`/api/sofia/*`, `/api/ai/*`, `/api/crm/*`) are restricted to hub tenant only via middleware enforcement. Partners cannot access CRM, knowledge base, or any AI features. |
| **Analytics & Reporting** | Partners see their own analytics: booking conversion rate, revenue, popular room types, guest demographics. Hub admin sees aggregated platform analytics including partner performance, commission revenue, and cross-property trends. |

---

## 3. Non-Functional Requirements

### 3.1 Architecture & Data Isolation

- **Hub-and-Spoke Multi-Tenancy:** Hotel Etuna operates as the hub tenant with full platform access. Partners are lightweight tenants with strict RLS enforcement. All tenant-scoped tables enforce isolation via PostgreSQL Row Level Security policies. Partners can only access their own data; hub can access its own data plus aggregate views of partner bookings for commission reporting.
- **Database:** **Neon (serverless Postgres)** replaces Supabase. Connection string stored in `DATABASE_URL` environment variable. Drizzle ORM handles all database interactions. Connection pooling configured for serverless environments. No Supabase-specific features (realtime, auth, storage) are used.
- **Tenant Type Enum:** `tenant_type` field on tenants table distinguishes `hub` (Hotel Etuna) from `partner` (Jayla, Aquarius). `parent_tenant_id` links partners to hub for commission tracking.

### 3.2 Security & Compliance

- **Authentication:** Stack Auth (or Neon Auth as alternative) for all users. Partners authenticate separately but use the same auth provider. JWT tokens include `tenant_id` and `role` claims for authorization.
- **Authorization:** Role-based access control (RBAC): `hub_admin`, `hub_staff`, `partner_admin`, `partner_staff`. Middleware enforces tenant isolation on all API routes. Hub admin has "view as" capability to inspect partner dashboards for support purposes.
- **Rate Limiting:** Aggressive rate limits on partner invite endpoint (5 requests/hour) to prevent abuse. Standard rate limits on all public APIs (100 requests/minute per IP).
- **Secrets Management:** All sensitive credentials (database, LLM API keys, SMTP, payment gateway) stored in environment variables. Never committed to version control. Vercel environment variables configured separately for production/staging.
- **Two-Factor Authentication:** Required for all hub admin actions affecting payments, commissions, or partner management. Optional but recommended for partners.
- **Data Protection:** GDPR and POPIA compliance. Guest data stored with marketing consent flags. Partners cannot export hub's guest data. Audit logging for all sensitive operations.

### 3.3 Branding & User Experience

- **Hotel Etuna (Hub) Branding:** Full custom theming with Hotel Etuna logo, primary/secondary colors (override Buffr nude palette), custom fonts, imagery. No "Buffr Host" references in customer-facing UI (only in admin footer for licensing).
- **Partner Portal Branding:** Neutral, light theme version for partner dashboards. Partner's logo and colors allowed in their public listing page card header. Dashboard header says "Your Property Dashboard" with partner property name, not "Hotel Etuna".
- **Public Partner Listings:** Styled to match Hotel Etuna website aesthetic but with partner's branding elements (logo, hero image, color accents). Consistent booking widget across all listings. **No Sofia AI chat widget on partner pages** - simple contact form or phone number displayed instead.
- **Sofia AI (Hub Only):** Sofia AI concierge, chat widget, email automation, and CRM features are exclusive to Hotel Etuna. Partners do not have access to any AI capabilities.

### 3.4 Performance & Reliability

- **Uptime Target:** 99.9% aligned with PSD-12 requirements. Vercel's global edge network ensures low latency.
- **AI Reliability:** Multi-provider fallback strategy (OpenAI → Anthropic → Google → Groq) for Sofia AI. Graceful degradation if all providers fail.
- **Database Performance:** Neon connection pooling handles serverless concurrency. Indexes on `tenant_id`, `property_id`, `guest_id`, and booking date ranges. Query optimization for partner listing pages (cached for 5 minutes).
- **Image Handling:** Vercel Blob (or Cloudinary) for partner property images. Automatic optimization and CDN delivery. Max upload size: 5MB per image, 20 images per property.

### 3.5 Observability & Monitoring

- **Logging:** Structured JSON logs with `tenant_id`, `user_id`, and `action` fields. Partner actions logged separately from hub actions.
- **Tracing:** Distributed tracing for AI/workflow runs suitable for debugging. OpenTelemetry compatible.
- **Metrics:** PostHog (or similar) for analytics. Separate dashboards for hub and partner metrics. Commission revenue tracked as a custom metric.
- **Alerts:** Uptime monitoring (99.9% SLA). Email alerts to hub admin for partner signup, booking anomalies, or system errors.

### 3.6 Deployability & Environment

- **Hosting:** Vercel with Next.js App Router. Serverless functions for API routes. Edge middleware for authentication and tenant isolation.
- **Domain:** `hoteletuna.com` for hub and public listings. Optional: `partner.hoteletuna.com` subdomain for partner portal (or use `/partner` route).
- **Environment Variables:** Clear distinction between hub and partner settings. `HUB_TENANT_ID` and `DEFAULT_PROPERTY_ID` for Hotel Etuna. `DATABASE_URL` for Neon. All LLM API keys, SMTP credentials, payment gateway secrets.

---

## 4. Out of Scope (For Current Phase)

### 4.1 Not Included in Initial Release

- **Full SaaS Multi-Property Management** - Partners are referral-only, not full white-label SaaS instances. No workspace switching UI for partners to manage multiple properties.
- **External CRM Integration** - The built-in CRM is the system of record. No Salesforce, HubSpot, or other third-party CRM connections.
- **Public Partner Marketplace** - Partners are invite-only. No self-service discovery or public listing of available partner slots. Hotel Etuna curates its partner network.
- **Partner-to-Partner Messaging** - Partners cannot communicate with each other directly through the platform. All coordination happens via hub admin.
- **Dynamic Commission Negotiation** - Commission rates are set by hub admin per partner. No automated bidding or performance-based adjustments (future feature).
- **Advanced Partner Analytics** - Basic analytics only (bookings, revenue). No funnel analysis, A/B testing, or predictive insights in initial release.
- **Partner Mobile App** - Partner dashboard is web-only. No native iOS/Android app for partners (responsive web design only).
- **Affiliate Link Tracking** - If partner bookings redirect to external systems, no sophisticated affiliate tracking (UTM parameters only).

### 4.2 Explicitly NOT Supported

- **Guest-to-Guest Booking** - No peer-to-peer rentals or guest-listed properties. All properties are professionally managed.
- **Blockchain/Crypto Payments** - Traditional payment methods only (credit card, bank transfer). No cryptocurrency support.
- **Vacation Rental Features** - No Airbnb-style long-term rentals, host reviews, or instant booking without approval. All bookings follow hotel confirmation workflow.
- **Third-Party OTA Integration** - No automatic syncing with Booking.com, Expedia, etc. Hotel Etuna and partners manage their own listings independently.

---

## 5. Success Metrics & KPIs

### 5.1 Guest Experience (Hotel Etuna & Partners)

- **Booking Conversion Rate:** ≥15% of visitors complete a booking across all properties (hub + partners).
- **Booking Completion Time:** Guests can browse rooms, check availability, and complete a booking in <3 minutes.
- **Data Consistency:** 100% state synchronization between public website and back-office. No double-bookings or availability mismatches.
- **Sofia AI Performance:** 70%+ of guest inquiries answered correctly without human escalation. <10% escalation rate for policy-sensitive issues.
- **Guest Satisfaction:** Post-stay survey score ≥4.5/5.0 across all properties. Track separately for hub vs. partners.

### 5.2 Partner Network Growth

- **Initial Partner Onboarding:** Successfully onboard Jayla Accommodation and Aquarius Airbnb Windhoek within 30 days of platform launch.
- **Partner Activation Rate:** ≥80% of invited partners complete onboarding and publish their first listing within 7 days.
- **Partner Retention:** ≥90% of partners remain active (≥1 booking per month) after 6 months.
- **Referral Bookings:** Partner properties generate ≥20% of total platform bookings within 12 months.

### 5.3 Operational Efficiency

- **Manual Work Elimination:** Staff manage 100% of booking lifecycle digitally. Zero spreadsheets or paper logs.
- **CRM Usage:** Hotel team logs interactions in CRM for ≥95% of guest communications. Daily active usage by front-desk staff.
- **Commission Tracking:** 100% of partner bookings automatically calculate commission. Zero manual commission reconciliation.
- **Support Ticket Resolution:** ≥95% of partner support tickets resolved within 48 hours.

### 5.4 Revenue & Business Impact

- **Commission Revenue:** Platform generates ≥NAD 50,000 in commission revenue from partner bookings within 12 months.
- **Average Booking Value:** ≥NAD 1,500 per booking across all properties.
- **Repeat Booking Rate:** ≥25% of guests book again within 12 months.
- **Cross-Property Discovery:** ≥10% of Hotel Etuna guests explore partner listings. ≥5% book a partner property.

### 5.5 Compliance & Risk

- **Audit Compliance:** 100% of compliance incidents (chargebacks, consumer rights cases) logged, reported, and audited per Bank of Namibia PSD-12.
- **KYC/KYB Verification:** 100% of partners complete KYC/KYB verification before first payout.
- **Data Security:** Zero data breaches. Zero cross-tenant data leakage incidents.
- **Uptime:** ≥99.9% platform uptime measured monthly.

---

## 6. Differences from Buffr Host (Full Multi-Tenant SaaS)

| Aspect | Buffr Host (Full SaaS) | Hotel Etuna (Hub-and-Spoke) |
|--------|------------------------|----------------------------|
| **Tenant Model** | Many equal tenants, full feature parity | **Hub tenant (Hotel Etuna)** with elevated permissions + **Partner tenants** (lightweight, referral-only) |
| **Tenant Isolation** | Full RLS for all tenants | **Full RLS enforced** for partners; hub can access aggregate views for commission reporting |
| **Property Count** | Multiple properties per tenant | **One property per tenant** (hub + each partner has exactly one property) |
| **Workspace Switching** | Tenant switcher in sidebar/header | **No workspace switcher** for anyone; hub admin has "view as partner" capability for support |
| **Public Website** | Generic multi-tenant templates | **Fully custom Hotel Etuna brand** with integrated partner listings at `/[partnerSlug]` |
| **CRM** | Tenant-scoped guest records | **Central CRM** storing all guests (hub + partner bookings); hub admin has full access, partners see only their guests |
| **Partner Onboarding** | Self-service signup for all tenants | **Invite-only** for partners via hub admin; hub tenant is pre-configured, no signup |
| **Settings** | Per-tenant settings tables | Hub has full settings access; partners have limited settings (branding, rates, availability) |
| **Commission Tracking** | Not applicable (B2B not included) | **Built-in commission system**: `commission_percent` per partner, `commission_amount` per booking, payout tracking |
| **Database** | Normalized multi-tenant schema with Supabase | **Same schema with Neon (serverless Postgres)**; `tenant_type` enum distinguishes hub vs. partner; `parent_tenant_id` links partners to hub |
| **API** | Requires `x-tenant-id` or JWT claim | **Middleware auto-injects tenant context**; hub APIs can query across tenants for reporting; partner APIs are strictly isolated |
| **AI (Sofia)** | Tenant-scoped knowledge base | **Hub-only knowledge base** in Qdrant; Sofia AI exclusive to Hotel Etuna; partners do not have AI access |
| **Branding** | Buffr Host brand with tenant customization | **Hotel Etuna brand** for hub and public site; partners get neutral portal theme + custom listing page elements |
| **Analytics** | Per-tenant analytics only | Hub admin sees **platform-wide analytics** (hub + all partners); partners see only their own data |

---

## 7. Technical Architecture

### 7.1 System Overview

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
     │ (Hotel Etuna)   │             │ (Jayla, etc.)  │
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
                     │ - Hotel Etuna   │
                     │ - Partner Pages │
                     │ - Booking Flow  │
                     └─────────────────┘
```

### 7.2 Database Schema (Neon Postgres)

**Key Tables:**

```sql
-- Tenants (Hub + Partners)
CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('hub', 'partner')),
  name TEXT NOT NULL,
  parent_tenant_id TEXT REFERENCES tenants(id), -- NULL for hub
  commission_percent NUMERIC(5,2) DEFAULT 10,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (One per tenant)
CREATE TABLE properties (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address JSONB,
  amenities JSONB,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (Hub + Partner bookings)
CREATE TABLE bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  guest_id TEXT NOT NULL REFERENCES guests(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_amount NUMERIC(12,2),
  commission_amount NUMERIC(12,2), -- For partner bookings
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Invites
CREATE TABLE partner_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  property_name TEXT NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**

```sql
-- Partners can only see their own data
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY partner_isolation ON bookings
  USING (
    tenant_id = current_setting('app.tenant_id')::TEXT
    OR
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = current_setting('app.tenant_id')::TEXT
      AND t.type = 'hub'
    )
  );
```

### 7.3 API Architecture

**Middleware Stack:**

1. **Authentication** (Stack Auth or Neon Auth)
2. **Tenant Context Injection** (from JWT `tenant_id` claim)
3. **Authorization** (RBAC based on role)
4. **Rate Limiting** (Redis-backed or Vercel KV)

**Key API Routes:**

```
/api/partners/invite              POST    Hub admin invites partner
/api/partners/claim-invite        POST    Partner claims invite token
/api/partners/[id]                GET     Public partner details
/api/partners/[id]/bookings       GET     Partner's bookings (auth)
/api/bookings                     POST    Create booking (hub or partner)
/api/commissions                  GET     Hub admin commission report
/api/crm/guests                   GET     CRM data (hub only)
/api/sofia/chat                   POST    AI chat (hub only)
/api/sofia/knowledge/ingest       POST    Add knowledge (hub only)
/api/ai/*                         ALL     AI endpoints (hub only)

Note: All `/api/sofia/*`, `/api/ai/*`, and `/api/crm/*` endpoints are restricted to `tenant_type = 'hub'` via middleware. Partners attempting to access these routes will receive a 403 Forbidden error.
```

### 7.4 Sofia AI Architecture (Hub Only)

**⚠️ IMPORTANT: Sofia AI is exclusive to Hotel Etuna (hub tenant). Partners do NOT have access to AI features.**

**Qdrant Vector DB Collection:**

```
Collection: property_knowledge
└── Namespace: hotel_etuna (hub only)
    ├── Hotel Etuna rooms, amenities, policies
    ├── Restaurant menu, services
    ├── Tours and activities
    └── Local recommendations
```

**AI Service Architecture:**

- **LLM Provider Router:** OpenAI (primary) → Anthropic → Google → Groq (fallback chain)
- **Knowledge Base:** RAG over Hotel Etuna property documents, guest preferences, booking history
- **Email Automation:** Booking confirmations, check-in reminders, post-stay thank you (hub only)
- **CRM Integration:** Sofia updates guest memory and preferences after interactions (hub only)
- **Multi-Channel:** Web chat, email, WhatsApp, phone (all hub tenant only)
- **Human Escalation:** Low confidence (<0.55) or policy keywords trigger staff notification

**Partner Interaction (No AI):**

- Partner public listing pages display a simple contact form or phone number
- No chat widget, no Sofia branding, no AI-powered responses
- Partners manage bookings manually via their dashboard
- Booking confirmations sent to partners are plain email templates (no AI personalization)

### 7.5 Deployment Architecture (Vercel)

```
Domain: hoteletuna.com
├── / (public homepage - SSR)
├── /rooms (Hotel Etuna rooms - SSR)
├── /partners (partner directory - SSR)
├── /[partnerSlug] (partner page - SSR)
├── /admin/* (hub dashboard - auth required)
├── /partner/* (partner portal - auth required)
└── /api/* (serverless functions)

Environment:
- Production: hoteletuna.com (Vercel)
- Staging: staging.hoteletuna.com
- Database: Neon (serverless Postgres with pooling)
- Storage: Vercel Blob (property images)
- Analytics: PostHog
- Monitoring: Vercel Analytics + Sentry
```

---

## 8. Branding & Theming Requirements

### 8.1 Hotel Etuna (Hub) Brand Identity

- **Logo:** Hotel Etuna logo as SVG/PNG. Displayed in:
  - Public website header
  - Hub admin sidebar
  - Email templates (booking confirmations, check-in reminders)
  - Partner invite emails
- **Primary Color:** Replace Buffr Host `nude-600` (#b8704a) with Hotel Etuna's brand color (e.g., `#1a3b5c` for deep blue or `#8b4513` for saddle brown). All buttons, links, and accent styles update accordingly.
- **Secondary Color:** Complementary color for highlights (e.g., `#f4a460` sandy brown or `#d4af37` gold).
- **Typography:** 
  - **Body:** Inter (sans-serif) for UI elements and content
  - **Display:** Playfair Display (serif) for headlines and hero sections
  - **Mono:** JetBrains Mono for data tables and code
- **Imagery:** All stock photos replaced with actual Hotel Etuna photography:
  - Hero images of property exterior and grounds
  - Professional room photography (all room types)
  - Restaurant/dining area photos
  - Amenity photos (pool, gym, conference rooms)
  - Local Windhoek attractions (if applicable)

### 8.2 Partner Portal Theming

- **Neutral Theme:** Partner dashboards use a light, neutral color scheme to differentiate from Hotel Etuna's brand:
  - Primary: Muted blue-gray (#5a6c7d)
  - Background: Off-white (#f8f9fa)
  - Accent: Subtle teal (#20c997)
- **Partner Branding Elements:**
  - Partner's logo displayed in dashboard header
  - Property name as page title (not "Hotel Etuna")
  - Dashboard greeting: "Welcome to [Property Name]"
  - No Hotel Etuna branding except small "Powered by Hotel Etuna" footer link

### 8.3 Partner Public Listing Pages

- **Hotel Etuna Website Integration:** Partner listing pages at `/[partnerSlug]` maintain Hotel Etuna's visual language:
  - Same navigation header with Hotel Etuna logo
  - Consistent typography and spacing
  - Unified booking widget design
- **Partner Customization:**
  - Partner's logo in page hero section
  - Partner's primary color for CTA buttons (configurable per partner)
  - Partner's hero image and property photos
  - Partner's custom description and amenities list

### 8.4 Email Branding

**Hotel Etuna Emails (Hub Only):**
- Header: Hotel Etuna logo + brand color
- Footer: Hotel Etuna contact info, social links, legal text
- **AI-Powered:** Sofia AI generates personalized booking confirmations, check-in reminders, post-stay thank you emails
- **Email Automation:** Triggered by booking lifecycle events

**Partner Booking Confirmation Emails:**
- **Plain Templates (No AI):** Simple transactional emails without Sofia AI personalization
- Header: Hotel Etuna platform branding
- Body: Basic booking details (dates, room, price, commission)
- Footer: Partner contact info + Hotel Etuna support links
- **No Automation:** Partners manage their own guest communications manually

### 8.5 Technical Implementation

- **Tailwind Config:** Extended color palette with both Hotel Etuna and partner themes
- **CSS Custom Properties:** Brand colors as CSS variables for easy theme switching
- **Component Variants:** All UI components support `theme="hub"` or `theme="partner"` prop
- **Theme Context:** React context provider determines active theme based on route
- **Partner Theme Override:** Partners can upload logo and select primary color via settings page; changes reflected immediately via CSS variables

**Example Tailwind Config:**

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Hotel Etuna (Hub) Theme
        'hub-primary': '#1a3b5c',
        'hub-secondary': '#f4a460',
        'hub-accent': '#d4af37',
        
        // Partner Neutral Theme
        'partner-primary': '#5a6c7d',
        'partner-secondary': '#20c997',
        'partner-neutral': '#f8f9fa',
      },
    },
  },
};
```

All theming is modular, allowing Hotel Etuna to rebrand or revert to Buffr Host theme with minimal configuration changes.

---

## 9. Initial Data Migration & Setup

### 9.1 Hub Tenant Pre-Seeding

The platform will be pre-configured with Hotel Etuna as the hub tenant:

```sql
-- Hub Tenant
INSERT INTO tenants (id, type, name, parent_tenant_id, status)
VALUES ('etuna-hub-uuid', 'hub', 'Hotel Etuna', NULL, 'active');

-- Hub Property
INSERT INTO properties (id, tenant_id, name, slug, address, created_at)
VALUES (
  'etuna-property-uuid',
  'etuna-hub-uuid',
  'Hotel Etuna',
  'hotel-etuna',
  '{"street": "123 Main St", "city": "Windhoek", "country": "Namibia"}',
  NOW()
);

-- Hub Admin User
INSERT INTO users (id, email, role, tenant_id)
VALUES (
  'etuna-admin-uuid',
  'admin@hoteletuna.com',
  'hub_admin',
  'etuna-hub-uuid'
);
```

### 9.2 Content Migration

**Room Inventory:**
- Import existing room data via seed script or admin interface
- Room types: Standard, Deluxe, Suite, Executive
- For each room: name, description, capacity, amenities, base rate, images

**Restaurant Menu (if applicable):**
- Categories: Breakfast, Lunch, Dinner, Drinks
- Items: name, description, price, dietary info, images
- Availability schedules (meal times)

**Property Information:**
- Amenities: Pool, Gym, Conference Rooms, Parking, WiFi
- Policies: Check-in/out times, cancellation policy, pet policy, smoking policy
- Services: Room service, laundry, airport shuttle, concierge

### 9.3 Guest Data Import (Optional)

If Hotel Etuna has existing guest data from a previous system:

- **CSV Import Tool:** Admin can upload CSV with columns: email, name, phone, preferences, loyalty_status
- **Data Validation:** Check for duplicates, invalid emails, missing required fields
- **CRM Memory:** Optionally import past booking history and preferences
- **Marketing Consent:** All imported guests default to `marketing_consent = false` (GDPR compliance); send opt-in emails

### 9.4 Initial Partner Setup (Phase 2)

After hub is operational, invite initial partners:

**Jayla Accommodation:**
- Email: admin@jaylaaccommodation.com
- Property Type: Guesthouse
- Expected Rooms: 8-10
- Commission Rate: 10%

**Aquarius Airbnb Windhoek:**
- Email: admin@aquariuswhk.com
- Property Type: Apartment Rentals
- Expected Rooms: 15-20 units
- Commission Rate: 10%

**Onboarding Workflow:**
1. Hub admin sends invite via dashboard
2. Partner receives email with claim link
3. Partner sets password, fills property details
4. Partner uploads 10-20 property photos
5. Partner configures room types and rates
6. Hub admin reviews and approves listing
7. Partner property goes live on public website

---

## 10. Implementation Approach

### 10.1 Fork & Adapt Buffr Host

The fastest path is to **fork the Buffr Host monorepo and adapt it for hub-and-spoke architecture**, rather than building from scratch.

**Phase 1: Database Migration (Neon)**

1. **Create Neon Project:**
   - Sign up at neon.tech
   - Create production and staging databases
   - Enable connection pooling for serverless
   - Obtain connection strings

2. **Replace Supabase with Neon:**
   - Update `DATABASE_URL` in environment variables
   - Remove `@supabase/supabase-js` dependency
   - Remove Supabase client initialization
   - Keep Drizzle ORM (works with any Postgres)
   - Update connection pool settings for Neon

3. **Schema Enhancements:**
   ```sql
   -- Add tenant type and partner relationship
   ALTER TABLE tenants ADD COLUMN type TEXT CHECK (type IN ('hub', 'partner'));
   ALTER TABLE tenants ADD COLUMN parent_tenant_id TEXT REFERENCES tenants(id);
   ALTER TABLE tenants ADD COLUMN commission_percent NUMERIC(5,2) DEFAULT 10;
   
   -- Add commission tracking to bookings
   ALTER TABLE bookings ADD COLUMN commission_amount NUMERIC(12,2);
   
   -- Create partner invites table
   CREATE TABLE partner_invites (
     id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT NOT NULL,
     token TEXT UNIQUE NOT NULL,
     property_name TEXT NOT NULL,
     claimed BOOLEAN DEFAULT FALSE,
     expires_at TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

**Phase 2: Hub Tenant Setup**

1. **Environment Configuration:**
   ```env
   # Hub Configuration
   HUB_TENANT_ID=etuna-hub-uuid
   DEFAULT_PROPERTY_ID=etuna-property-uuid
   HOTEL_NAME="Hotel Etuna"
   
   # Database
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
   DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
   
   # Remove Supabase vars
   # SUPABASE_URL and SUPABASE_ANON_KEY removed
   ```

2. **Middleware Updates:**
   - Keep tenant-detection middleware (now needed for partners)
   - Auto-inject hub tenant ID for hub routes
   - Enforce RLS for partner routes
   - Add "view as partner" capability for hub admin

3. **UI Branding:**
   - Replace workspace selector with Hotel Etuna logo
   - Update Tailwind config with Hotel Etuna colors
   - Create partner portal layout (separate from hub dashboard)
   - Update all public pages with Hotel Etuna branding

**Phase 3: Partner Network Features**

1. **Partner Invite Flow:**
   - API endpoint: `POST /api/partners/invite`
   - Email service integration (existing SMTP)
   - Invite token generation and validation
   - Partner claim page: `/claim-invite?token=xxx`

2. **Partner Dashboard:**
   - New layout: `app/(partner)/layout.tsx`
   - Pages: Dashboard, My Property, Bookings, Settings
   - Restricted navigation (no hub features)
   - Theme: neutral color scheme

3. **Public Partner Pages:**
   - Dynamic route: `app/[partnerSlug]/page.tsx`
   - Partner directory: `app/partners/page.tsx`
   - Unified booking widget with partner context
   - SEO metadata per partner

4. **Commission System:**
   - Calculate commission on booking creation
   - Hub dashboard: commission reports by partner
   - Commission status tracking (pending/paid)
   - Automated commission emails

**Phase 4: Middleware & API Security**

1. **AI/CRM Endpoint Restrictions:**
   - Implement middleware to block partners from `/api/sofia/*`, `/api/ai/*`, `/api/crm/*`
   - Return 403 Forbidden for partner tenants attempting AI/CRM access
   - Add clear error messages: "AI features are exclusive to Hotel Etuna"

2. **Partner Dashboard Restrictions:**
   - Remove all Sofia/AI navigation links from partner layout
   - Remove CRM and knowledge base features from partner pages
   - Partner public listing pages: display contact form (not chat widget)
   - Verify no AI-related components render for partner tenants

3. **Hub-Only Features:**
   - Verify Sofia AI chat widget only appears on Hotel Etuna pages
   - Verify CRM access restricted to hub admin and staff
   - Test email automation (booking confirmations) only sends from hub

**Phase 5: Testing & Launch**

1. **Integration Tests:**
   - Partner invite and claim flow
   - Tenant isolation (attempt cross-tenant access)
   - Commission calculation accuracy
   - **Verify partners cannot access AI/CRM endpoints (403 responses)**

2. **E2E Tests:**
   - Hub admin workflow: invite partner, view commission report
   - Partner workflow: claim invite, setup property, view bookings
   - Public workflow: browse partner listings, complete booking

3. **Performance:**
   - Load test with 100 concurrent bookings across hub + partners
   - Verify Neon connection pooling under load
   - Optimize partner listing page queries (caching)

### 10.2 Deployment Strategy

**Staging Environment:**
- Deploy to `staging.hoteletuna.com`
- Seed with test partners (Jayla, Aquarius)
- Full QA cycle (1-2 weeks)
- Partner beta testing

**Production Launch:**
- Blue-green deployment on Vercel
- Database migration during low-traffic window
- Monitor Neon connection pool usage
- Rollback plan: revert to previous Vercel deployment

**Post-Launch:**
- Monitor partner signup conversion rate
- Track commission revenue weekly
- Gather partner feedback on dashboard UX
- Iterate on Sofia AI performance for Hotel Etuna (hub only)
- Monitor partner booking conversion rates vs. hub bookings

---

## 11. Implementation Phases & Timeline

### Phase 1: Foundation (Weeks 1-2)
- ✅ Neon database setup and migration
- ✅ Remove Supabase dependencies
- ✅ Hub tenant pre-seeding
- ✅ Hotel Etuna branding applied
- ✅ Public website launch (hub only)

### Phase 2: Partner Infrastructure (Weeks 3-4)
- Partner invite/claim flow
- Partner dashboard UI
- Tenant isolation middleware
- Commission calculation logic
- RLS policy enforcement

### Phase 3: Partner Listings & Bookings (Weeks 5-6)
- Public partner directory page
- Dynamic partner listing pages (`/[partnerSlug]`)
- Unified booking widget with partner context
- Commission tracking in hub dashboard

### Phase 4: Middleware & API Security (Week 7)
- Implement AI/CRM endpoint restrictions for partners
- Add 403 Forbidden responses for partner AI access attempts
- Remove Sofia/CRM features from partner dashboard UI
- Replace chat widgets with contact forms on partner public pages

### Phase 5: Testing & Launch (Week 8)
- Integration and E2E tests
- Partner beta (Jayla, Aquarius)
- Performance optimization
- Production deployment

### Phase 6: Post-Launch (Ongoing)
- Monitor KPIs (partner signups, commission revenue)
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

### Appendix D: External References

- **Buffr Host PRD:** `/Users/georgenekwaya/Downloads/ai-agent-mastery-main/buffr-host/PRD.md`
- **Neon Documentation:** https://neon.tech/docs
- **Bank of Namibia PSD-12:** Payment systems directive (compliance)
- **Vercel Deployment Guide:** https://vercel.com/docs
- **Qdrant Documentation:** https://qdrant.tech/documentation

---

## 14. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-28 | Engineering Team | Initial PRD for single-tenant Hotel Etuna |
| **2.0.0** | **2026-04-28** | **Engineering Team** | **Added B2B partner network, self-service portal, Neon DB migration, hub-and-spoke architecture. Sofia AI and all ML/AI features confirmed as exclusive to Hotel Etuna (hub tenant only) - partners receive basic listing platform without AI capabilities.** |

---

*This PRD (v2.0.0) is effective April 28, 2026 and supersedes all previous versions. It will be reviewed quarterly with Hotel Etuna management and updated as needed. All implementation teams must reference this document as the source of truth for product requirements, architecture decisions, and success metrics.*

