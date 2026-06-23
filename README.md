# Hotel Etuna

**Hotel Etuna** — A luxury hospitality platform for Hotel Etuna in Ongwediva, Namibia.

[![Status](https://img.shields.io/badge/Status-In%20Production-green)](https://hoteletuna.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-green)](https://neon.tech)

**Lineage:** Evolved from Buffr Host v1.0.0 (internal platform codebase)  
**Version:** 2.0.0 — **Single-property OS** (Hotel Etuna hub + referral partners)  
**Last Updated:** June 2026

**Canonical OS doc:** [`docs/project/HOTEL_ETUNA_OS.md`](docs/project/HOTEL_ETUNA_OS.md)

**Production:** Deployed on **Vercel** (`hoteletuna.com`). **Canonical docs:** [`docs/project/PRD.md`](docs/project/PRD.md) · [`PLANNING.md`](docs/project/PLANNING.md) · [`TASK.md`](docs/project/TASK.md) (testing, deployment, smoke). Automated tests: **Vitest `777+ passed`** (`npm run test:ci`); Playwright E2E: **`npm run test:e2e`**. Sofia RAG uses **Qdrant Cloud Inference** (`intfloat/multilingual-e5-small`, 384d); run `npm run rag:seed` after setting `QDRANT_*` in `.env.local`.

---

## Overview

Hotel Etuna is the **single-property operating system** for the flagship hotel in Ongwediva, with optional **referral partner listings** (JayLa, Aquarius) on the same public site.

Built as one hub property on shared infrastructure — not a multi-tenant Buffr Host SaaS signup.

---

## Features

### Hotel Etuna (Hub Tenant)

| Feature | Description |
|---------|-------------|
| **Sofia AI Concierge** | Multilingual AI assistant (English, Afrikaans, Oshiwambo) with email automation, booking support, and knowledge base integration |
| **Property Management** | Rooms, bookings, availability calendars, staff‑approved rate recommendations |
| **Restaurant** | Menu management, orders, table reservations |
| **Guest CRM** | Profiles, preferences, loyalty tiers, marketing consent (PSD-4 compliant) |
| **Guest services** | Airport shuttle, pool, on-site restaurant |
| **Email Automation** | Booking confirmations, check-in reminders, post-stay follow-ups |
| **Staff Management** | Roles, schedules, salary/hourly rates, `/staff/[id]/edit` |
| **Namibia Payroll** | In-repo PAYE + SSC (`/payroll`), payslips, NamRA export CSVs |
| **Housekeeping** | Task board, room status tracking, auto-task on checkout |
| **Loyalty Program** | 4-tier (Bronze/Silver/Gold/Platinum), earn/burn points, rewards catalog |
| **CMS** | Block editor for pages; menu item management |
| **Introducer Partners** | Referral tracking, commission, public directory |
| **Platform Billing** | Buffr ↔ Hotel Etuna invoicing, fee accruals, VAT |
| **Payments** | Adumo Virtual (hosted card), cash, manual EFT/e-wallet desk record |
| **Fraud Detection** | Rule engine, alerts, velocity checks (PSD-12) |
| **Compliance** | PSD-12, PSD-4, ETA 2019, AML/FICA, SOC 2 (in progress) |

### Partner Network (Jayla, Aquarius)

| Feature | Description |
|---------|-------------|
| **Invite-Only Onboarding** | Hub admin sends branded email invites with secure tokens |
| **Self-Service Dashboard** | Property management, rate configuration, booking tracking |
| **Public Listing Pages** | Integrated into `hoteletuna.com/partners/[partnerSlug]` |
| **Commission Tracking** | Automated 10% commission on all bookings |
| **Tenant Isolation** | Full RLS enforcement, **no AI/CRM access** |

---

## Architecture

```
┌─────────────────────────────────────┐
│   Hotel Etuna (Hub Tenant)         │
│   - Sofia AI (exclusive)            │
│   - PMS, CRM, Restaurant            │
│   - Partner Management               │
│   - Commission Reporting             │
└───────────────┬─────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼──────┐  ┌────▼──────────┐
│ Jayla Accom  │  │ Aquarius Airbnb│
│ (Partner)    │  │ (Partner)       │
│ - Self-Service│  │ - Self-Service │
│ - Listing     │  │ - Listing      │
│ - No AI       │  │ - No AI        │
└──────────────┘  └────────────────┘
```

**Key Principles:**
- **Hub-only AI:** Sofia AI available exclusively to Hotel Etuna
- **Partner listings:** Public-facing pages without chat widgets
- **Commission flow:** Partners earn 90%, hub retains 10%
- **Data isolation:** RLS policies enforce strict tenant boundaries

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 18, TypeScript, Tailwind CSS, DaisyUI |
| **Backend** | Next.js API Routes, Middleware (tenant routing) |
| **Database** | Neon (Serverless PostgreSQL), Drizzle ORM |
| **Vector DB** | Qdrant (Sofia AI knowledge base) |
| **Authentication** | Stack Auth (primary) + NextAuth.js fallback |
| **AI** | DeepSeek (primary), OpenAI, Anthropic (fallback chain via LLMProviderRouter) |
| **Email** | Nodemailer (Namecheap PrivateEmail SMTP) |
| **Deployment** | Vercel |

---

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Hub (Hotel Etuna) + Partners (Jayla, Aquarius) |
| `partner_invites` | Secure invite tokens for onboarding |
| `properties` | Hotel properties and partner listings |
| `rooms` | Room inventory and rates |
| `bookings` | Reservations with commission tracking |
| `booking_charges` | Per-stay folio lines (room, F&B, payments) |
| `guests` | Guest profiles (hub CRM only) |
| `ai_conversations` | Sofia AI chat history (hub only) |
| `menu_items` | Restaurant menu (hub only) |
| `staff` | Employee management (hub only) |

### Tenant Types

```sql
CREATE TYPE tenant_type AS ENUM ('hub', 'partner');

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type tenant_type DEFAULT 'hub',
  parent_tenant_id UUID REFERENCES tenants(id), -- Partners link to hub
  commission_percent NUMERIC(5,2) DEFAULT 10.00,
  ...
);
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL account
- Vercel account (for deployment)
- API keys: OpenAI, Anthropic (for Sofia AI)

### Installation

1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd hotel-etuna
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   **Required variables:**
   ```env
   # Hub Configuration
   HUB_TENANT_ID=<your-hub-uuid>
   DEFAULT_PROPERTY_ID=<your-property-uuid>

   # Neon Database
   DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
   DATABASE_URL_UNPOOLED=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb

   # LLM Providers (Sofia AI - hub only)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...

   # SMTP (Namecheap PrivateEmail)
   EMAIL_SMTP_HOST=mail.privateemail.com
   EMAIL_SMTP_USER=frontdesk@hoteletuna.com
   EMAIL_SMTP_PASS=<your-password>

   # Authentication
   NEXT_PUBLIC_STACK_PROJECT_ID=<stack-project-id>
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<stack-key>
   STACK_SECRET_SERVER_KEY=<stack-secret>
   ```

4. **Apply database migrations** (canonical journal `0000`–`0054` — see `docs/project/MIGRATION_MASTER.md`; **never confirm** `drizzle-kit push` if it plans mass **`DROP POLICY`**):
   ```bash
   npm run db:migrate:all      # idempotent operator SQL (0003–0060)
   npm run test:db:migrations  # verify on Neon
   npm run provision:hotel-team  # founder/admin/frontdesk/marketing/support logins
   npm run seed:introducers      # sample CRM introducers + public directory
   ```

5. **Start development server:**
   ```bash
   npm run dev  # http://localhost:3000
   ```

---

## Project Structure

```
hotel-etuna/
├── app/
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Hub staff dashboard (Hotel Etuna)
│   │   ├── bookings/        # PMS booking management
│   │   ├── crm/             # Guest CRM, loyalty, introducers
│   │   ├── housekeeping/    # Housekeeping task board
│   │   ├── cms/             # Content management (pages, menu)
│   │   ├── payments/        # Desk, reconciliation, platform billing
│   │   ├── restaurant/      # Tables, orders, menu
│   │   └── compliance/      # KYC, SOC2
│   ├── api/                 # 155 API route handlers
│   │   ├── ai/concierge/    # Sofia AI (hub only)
│   │   ├── crm/             # CRM + loyalty (hub only)
│   │   ├── bookings/        # Booking management
│   │   ├── payments/        # Adumo, cash, manual EFT/e-wallet
│   │   ├── housekeeping/    # Task CRUD
│   │   ├── introducers/     # Referral partner management
│   │   └── compliance/      # KYC, AML, PSD, SOC2
│   ├── dining/              # Public digital menu
│   ├── guest/               # Guest self-service hub
│   └── partners/[slug]/     # Public partner listing pages
├── components/
│   ├── features/            # Domain-scoped feature components
│   │   ├── booking/         # Booking & folio components
│   │   ├── crm/             # CRM, loyalty, guest memory
│   │   ├── restaurant/      # Restaurant ops
│   │   └── fraud/           # Fraud dashboard
│   ├── dining/              # Public menu book components
│   └── shared/              # Reusable primitives (ErrorDisplay, etc.)
├── lib/
│   ├── db/                  # Drizzle schema + Neon connection
│   ├── services/            # Business logic (domain-organised)
│   │   ├── ai/              # Sofia concierge + LLM router
│   │   ├── booking/         # Booking lifecycle
│   │   ├── loyalty/         # Loyalty tiers + transactions
│   │   ├── fraud/           # Fraud detection + notifications
│   │   ├── compliance/      # AML, KYC, SOC2, STR
│   │   └── payment/         # Adumo, manual EFT/e-wallet payments
│   ├── compliance/          # SOC2 agents, security pack
│   └── auth/                # NextAuth config + middleware
├── middleware.ts             # Tenant routing + security gate
├── database/drizzle/         # SQL migration files (0000–0054)
├── e2e/                      # Playwright E2E specs (10 files)
├── tests/                    # Vitest unit + integration tests
├── docs/project/PRD.md       # Product requirements (canonical)
├── docs/project/PLANNING.md  # Architecture & phases (canonical)
├── docs/project/TASK.md      # Testing, deployment, checklists (canonical)
└── docs/compliance/          # Policies, IRP, AML, Namibia framework
```

---

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest (excludes **`e2e/playwright`** specs — use **`test:e2e`**) |
| `npm run verify:production` | **Pre-deploy:** `tsc` + Vitest + `next build` |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright in UI mode |
| `npm run db:push` | Apply Drizzle migrations |
| `npm run db:seed` | Seed hub tenant and initial data |

### Design System

**Branding:**
- **Hub (Hotel Etuna):** Khaki/rustic/savannah palette, Playfair Display
- **Partners:** Neutral gray palette, simplified UI

**Color Palette (Hub):**
```css
--khaki-50: #f9f7f4;
--khaki-600: #8B7355;  /* Primary CTA */
--khaki-900: #3E2F23;  /* Dark text */
```

**Typography:**
- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

---

## API Endpoints

### Hub-Only Endpoints (403 for partners)

```
POST   /api/sofia/chat          # Sofia AI chat
POST   /api/sofia/email         # Email generation
GET    /api/crm/guests          # Guest profiles
POST   /api/ai/concierge        # AI concierge service
```

### Shared Endpoints

```
GET    /api/bookings            # List bookings (tenant-scoped)
POST   /api/bookings            # Create booking
GET    /api/properties          # List properties (tenant-scoped)
POST   /api/partners/invite     # Send partner invite (hub only)
POST   /api/partners/claim      # Claim invite token (partner)
```

### Public Endpoints

```
GET    /partners/[slug]         # Partner public listing page
GET    /api/public/menu         # Public menu endpoint
```

---

## Sofia AI (Hub Exclusive)

### Capabilities (Hotel Etuna Only)

- **Multi-channel:** Web chat, email monitoring (IMAP), WhatsApp webhook (live), voice adapter
- **Knowledge Base:** Platform info, property details, guest preferences
- **Email Automation:** Booking confirmations, reminders, follow-ups
- **Human Escalation:** Based on confidence score or policy keywords
- **Multi-provider:** OpenAI, Anthropic, Google, Groq with fallback

### Architecture

```
Sofia AI Service
├── LLM Provider Router (multi-provider fallback)
├── Knowledge Base (Qdrant vector DB)
├── Email Service (IMAP/SMTP with Nodemailer)
├── Conversation Service (history management)
└── CRM Integration (guest memory updates)
```

**Partner Restrictions:**
- No Sofia AI chat widgets on partner pages
- No email automation for partner bookings
- No access to AI-powered features

---

## Partner Network

### Onboarding Flow

1. **Hub Admin:** Send invite via `/api/partners/invite`
   ```json
   {
     "email": "contact@jayla.com",
     "propertyName": "Jayla Accommodation"
   }
   ```

2. **Partner:** Receive branded email with secure token

3. **Partner:** Click link, claim invite via `/api/partners/claim`
   ```json
   {
     "token": "uuid-token",
     "userId": "user-uuid"
   }
   ```

4. **System:** Create partner tenant, link to hub, provision dashboard

### Commission Tracking

```typescript
// Booking creation (partner property)
const commissionAmount = totalAmount * (partner.commissionPercent / 100);

await db.insert(bookings).values({
  tenantId: partner.id,
  totalAmount,
  commissionAmount,  // Retained by hub
  ...
});
```

### Public Listing Pages

Partners get a public-facing page at:
```
https://hoteletuna.com/partners/jayla-accommodation
```

**Includes:**
- Property photos and description
- Room listings with rates
- Contact form (no AI chat)
- Booking redirect to hub

---

## Security

### Tenant Isolation

- **RLS Policies:** Enforce `tenant_id` filtering on all queries
- **Middleware:** Blocks partners from accessing `/api/sofia/*`, `/api/ai/*`, `/api/crm/*`
- **API Response:** 403 Forbidden with clear error message

### Authentication

- **Primary:** Stack Auth (JWT tokens, RBAC) + NextAuth.js session fallback
- **2FA:** `TwoFactorAuthService` implemented (`lib/services/security/`); UI wiring in progress

### Compliance

- **PSD-12:** Cybersecurity standards (encryption, session management)
- **PSD-4:** Data protection (marketing consent, guest privacy)
- **ETA 2019:** Audit trails for all transactions

---

## Deployment

### Vercel

1. **Connect Repo:** Link GitHub repository to Vercel (`vercel link` from `hotel-etuna/`)
2. **Environment variables:** Copy `.env.example` → `.env.local`, fill values locally, then push to Vercel:
   ```bash
   npm run env:check              # audit .env.local vs .env.example
   npm run env:push-vercel:dry    # preview what will sync
   npm run env:push-vercel        # sync production + preview (requires vercel CLI + link)
   ```
   Production overrides (applied by the script): `NEXTAUTH_URL`, `ADUMO_REDIRECT_*`, `ADUMO_WEBHOOK_URL` → `https://hoteletuna.com`. **Namibia:** card payments use **Adumo Virtual** (`ADUMO_*`), not Stripe. Sofia dining deposits use `RESTAURANT_DEPOSIT_BASE_CENTS` / `RESTAURANT_DEPOSIT_PER_GUEST_CENTS`.
3. **Deploy:** Push to `main` triggers automatic deployment
4. **DB migrations:** `npm run test:db:migrations` (includes `0018` dining_reservations, `0019` Adumo dining link)

### Database (Neon)

- **Connection Pooling:** Use `DATABASE_URL` for API routes
- **Direct Connection:** Use `DATABASE_URL_UNPOOLED` for migrations
- **Branching:** Neon database branching for testing

### CI/CD

- **Linting:** `npm run lint` on every push
- **Type Checking:** TypeScript strict mode
- **Testing:** Vitest + Playwright on PR
- **Security:** Dependabot alerts, npm audit

---

## Testing

### Test Coverage

- **Unit/Integration:** Vitest (Sofia AI, bookings, CRM)
- **E2E:** Playwright (authentication, navigation, booking flow)
- **Workflow:** GitHub Actions validation

### Run Tests

```bash
# Unit/integration tests
npm run test

# E2E tests (requires server running)
npm run test:e2e

# E2E in UI mode
npm run test:e2e:ui
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/project/PRD.md`](docs/project/PRD.md) | Product requirements, design, appendices |
| [`docs/project/PLANNING.md`](docs/project/PLANNING.md) | Architecture, phases, payment flows, DB design |
| [`docs/project/TASK.md`](docs/project/TASK.md) | Smoke tests, deployment checklist, open work, **Production gaps** |
| [`docs/naming-conventions.md`](docs/naming-conventions.md) | Naming conventions guide |
| [`docs/compliance/`](docs/compliance/) | Policies, IRP, AML/KYC, Namibia regulatory framework |

Canonical project docs live in `docs/project/`. Compliance docs live in `docs/compliance/`.

**Quick local setup:** See **Local Development & Knowledge Ingestion** in `docs/project/PLANNING.md`.

---

## License

Proprietary - Hotel Etuna 2026

Built for Hotel Etuna in Ongwediva, Namibia.

---

## Contact

**Hotel Etuna**  
5544 Valley Street  
Ongwediva, Namibia  
Phone: +264 65 231 177  
Email: admin@hoteletuna.com  
Website: https://hoteletuna.com
