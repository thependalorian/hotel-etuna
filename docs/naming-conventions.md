# Hotel Etuna — Naming Conventions Guide

**Version:** 1.0  
**Date:** 2026-06-02  
**Scope:** Full-stack (database, API, TypeScript, React, environment)  
**Principles:** DRY · Boy Scout Rule · KISS · Domain-driven naming

---

## Cheat Sheet (pin this to your desk)

| Layer | Convention | Example |
|-------|-----------|---------|
| DB tables | `snake_case`, plural | `booking_charges`, `loyalty_tiers` |
| DB columns | `snake_case` | `tenant_id`, `check_in_date` |
| DB indexes | `idx_<table>_<column(s)>` | `idx_bookings_tenant_id` |
| DB migrations | `NNNN_<verb>_<noun>.sql` | `0009_add_booking_charges.sql` |
| API paths | `kebab-case`, plural nouns | `/api/bookings`, `/api/loyalty-tiers` |
| Path params | `[<resourceId>]` (camelCase, specific) | `[bookingId]`, `[id]` |
| TS types/interfaces | `PascalCase`, no `I` prefix, no `Data` suffix | `BookingCharge`, `LoyaltyTier` |
| TS enums | `PascalCase` name, `PascalCase` values | `BookingStatus.CheckedIn` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS` |
| Service classes | `PascalCase`, `Service` suffix | `LoyaltyService`, `BookingService` |
| Service files | `PascalCase.ts` (same as class name) | `LoyaltyService.ts` |
| Utility files | `kebab-case.ts` | `rate-limit.ts`, `api-helpers.ts` |
| React components | `PascalCase.tsx` | `BookingForm.tsx`, `ErrorDisplay.tsx` |
| React hooks | `use` prefix, `camelCase` | `useBookingState`, `useGuest` |
| Booleans | `is*`, `has*`, `can*` | `isActive`, `hasErrors`, `canCheckOut` |
| Env variables | `SCREAMING_SNAKE_CASE`, vendor prefix | `ADUMO_JWT_SECRET`, `EMAIL_SMTP_HOST` |
| Test files | `kebab-case.test.ts` | `loyalty-service.test.ts` |
| JSON responses | `camelCase` keys | `{ bookingId, checkInDate }` |

---

## 1. General Rules

### 1.1 Language
- **English only.** No transliteration, no local abbreviations (e.g. not `res_nr`, use `receiptNumber`).
- Use the **domain ubiquitous language** from the Hotel Etuna PRD: "folio", "booking", "check-in", "guest", "hub tenant", "introducer".
- Prefer full words over abbreviations unless the abbreviation is universally understood in the domain (`id`, `url`, `api`, `vat`, `crm`, `kyc`).
- Acronyms: capitalise **only the first letter** in camelCase and PascalCase contexts: `tenantId` not `tenantID`, `NamQrService` not `NAMQRService`, `QrCode` not `QRCode` (exception: established initialisms at the start of names: `VAT`, `KYC`, `AML`, `PSD`, `SOC2` when used as a standalone prefix/suffix in SCREAMING context).

### 1.2 Avoid Context Repetition (DRY)
Bad: `BookingService.getBookingById(bookingId)` — the word "booking" appears three times.  
Good: `BookingService.getById(id)` or `BookingService.get(id)`.

Bad: `interface BookingData { bookingId: string }` — `Data` suffix adds nothing; `bookingId` repeats "booking" when the interface is already about bookings.  
Good: `interface Booking { id: string }`.

### 1.3 Singular vs Plural
- **DB tables:** plural (`bookings`, `guests`, `rooms`).
- **API resource paths:** plural (`/api/bookings`, `/api/guests`).
- **TypeScript types:** singular (`Booking`, `Guest`).
- **Feature folders** (components, services): singular noun of the domain (`booking`, `guest`, `loyalty`) — but see §5 for existing folder exceptions.

---

## 2. Database

### 2.1 Tables
**Pattern:** `snake_case`, plural, descriptive noun phrase.

| ✅ Good | ❌ Bad | Reason |
|--------|--------|--------|
| `booking_charges` | `bookingCharge` | snake_case + plural |
| `loyalty_tier_benefits` | `LoyaltyTierBenefit` | snake_case |
| `aml_suspicious_transaction_reports` | `suspicious_reports` | includes domain prefix for grouping |
| `cash_reconciliations` | `reconciliation` | plural |

**Table grouping prefixes** (used where a domain has many tables):

| Prefix | Domain | Tables |
|--------|--------|--------|
| `aml_` | Anti-money laundering | `aml_transaction_alerts`, `aml_monitoring_rules`, … (`aml_pep_*` dormant — PEP screening out of scope for Namibia OS) |
| `cms_` | Content management | `cms_pages`, `cms_blocks`, `cms_menu_items` |
| `sofia_` | Sofia AI channel persistence | `sofia_email_logs`, `sofia_voice_sessions`, … |

All other tables use unprefixed plain nouns: `bookings`, `guests`, `tenants`, `properties`.

### 2.2 Columns
**Pattern:** `snake_case`. No table-name prefix in column names (RLS and Drizzle make the table context clear).

| ✅ Good | ❌ Bad |
|--------|--------|
| `tenant_id` | `tenantID`, `tnt_id`, `booking_tenant_id` |
| `check_in_date` | `checkInDate`, `chkin` |
| `is_active` | `active`, `activated`, `isActive` |
| `created_at` | `createdAt`, `creation_date` |

**Boolean columns:** always `is_*` prefix (not `active`, `enabled` alone).  
**Timestamps:** always `_at` suffix for point-in-time, `_date` for calendar dates.  
**Foreign keys:** always `<referenced_table_singular>_id` (e.g., `tenant_id`, `booking_id`, `guest_id`).

### 2.3 Indexes
**Pattern:** `idx_<table>_<column(s)>` or `idx_<table>_<semantic_name>`.

```sql
-- ✅ Good
idx_bookings_tenant_id
idx_ai_conversations_tenant_session      -- composite index, semantic name
idx_loyalty_tx_guest_created             -- abbreviating table name is OK when long

-- ❌ Bad
booking_index
idx1
```

**Unique indexes:** `uq_<table>_<column(s)>`.  
**Partial indexes:** add `_<condition>` suffix: `idx_namqr_pending_booking_bank_ref_pending`.

### 2.4 Enums (PostgreSQL)
**Pattern:** `snake_case` for the type name; `snake_case` values.

```sql
-- ✅ Good
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out');
CREATE TYPE loyalty_tier   AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- ❌ Bad — values should not be mixed case
CREATE TYPE BookingStatus AS ENUM ('Pending', 'CheckedIn');
```

### 2.5 Migration Files
**Pattern:** `NNNN_<verb_phrase>.sql`

The verb phrase describes **what the migration does**: `add`, `create`, `drop`, `alter`, `seed`, `fix`, `backfill`.

```
-- ✅ Good
0009_add_booking_charges_folio.sql
0010_add_booking_charges_rls.sql
0016_seed_fraud_detection_rules.sql
0037_add_loyalty_auto_tier_trigger.sql

-- ❌ Bad (existing — do not replicate)
0000_equal_lifeguard.sql          ← Drizzle auto-generated, meaningless
0001_broad_firebird.sql           ← same
0029b_cms_pages_blocks_rls.sql    ← 'b' suffix breaks sequential ordering
```

**Sub-migration rule:** When adding RLS policies for a migration, merge them into the same file or use the next sequential number — never a letter suffix (`0029b`). Numbers are cheap.

**Gaps:** The current repo has gaps at 0022–0028, 0030, 0032, 0034. These gaps are intentional (features built without formal migrations). Document them in `docs/MIGRATION_MASTER.md` with a "RESERVED — not used" note so future migrations don't collide.

---

## 3. API Endpoints

### 3.1 Resource Paths
**Pattern:** `kebab-case`, plural nouns. No verbs in path segments.

```
-- ✅ Good
GET    /api/bookings
GET    /api/bookings/[id]
POST   /api/bookings
PATCH  /api/bookings/[id]
DELETE /api/bookings/[id]

GET    /api/loyalty-tiers
POST   /api/compliance/kyc-cases/[caseId]/run    ← action as sub-resource (OK)

-- ❌ Bad
POST   /api/createBooking
GET    /api/getGuest
POST   /api/bookings/confirm                       ← action; use PATCH /bookings/[id] with status body
```

**Action sub-resources** (acceptable REST pattern for side-effect operations):  
`POST /api/bookings/[id]/payment` — initiating payment on a booking  
`POST /api/compliance/kyc-cases/[caseId]/run` — triggering a workflow  
`POST /api/payments/namqr/pending/[id]/approve` — approval action  

These are verbs but represent **commands on a resource**, not service operations. They are acceptable when there is no cleaner HTTP method mapping.

### 3.2 Path Parameters
**Pattern:** `[<resourceName>Id]` for UUIDs/IDs, `[<noun>]` for slugs/codes.

```
-- ✅ Good (current)
[id]            -- generic, OK for simple endpoints
[bookingId]     -- specific, self-documenting in nested routes
[caseId]        -- domain term from PRD
[slug]          -- URL-friendly identifier
[code]          -- room QR code

-- ❌ Bad
[itemId]        -- redundant: /menu/[id] already makes it an item ID
[...nextauth]   -- framework requirement, not a naming choice
```

**Rule:** Use `[id]` when the resource type is unambiguous from the path. Use a specific name (`[bookingId]`, `[guestId]`) only when the same route nests multiple ID types in the same path.

### 3.3 Versioning
**Current approach:** URL prefix via rewrite (`/api/v1/*` → `/api/*`). This is the established pattern. Do not add `v1` to individual route file names.

### 3.4 HTTP Methods
| Operation | Method | Notes |
|-----------|--------|-------|
| Fetch collection | `GET` | Never mutate on GET |
| Fetch single | `GET` | |
| Create | `POST` | Returns 201 |
| Full replace | `PUT` | Rarely used here |
| Partial update | `PATCH` | Preferred over PUT |
| Delete | `DELETE` | Returns 204 or `{ success: true }` |

### 3.5 Query Parameters
**Pattern:** `camelCase` (matching JSON response keys).

```
?tenantId=...         ✅
?page=1&limit=20      ✅ (pagination standard)
?availableOnly=true   ✅ boolean with adjective
?tenant_id=...        ❌
?get_all=true         ❌ verb in query param
```

### 3.6 JSON Response Keys
**Pattern:** `camelCase` throughout. Never `snake_case` in JSON responses (even when the DB column is `snake_case` — Drizzle returns camelCase by default with the ORM).

```json
// ✅ Good
{
  "bookingId": "uuid",
  "checkInDate": "2026-06-01",
  "tenantId": "uuid",
  "isActive": true
}

// ❌ Bad
{
  "booking_id": "uuid",
  "check_in_date": "2026-06-01"
}
```

---

## 4. TypeScript — Types, Interfaces, Classes

### 4.1 Types and Interfaces
**Pattern:** `PascalCase`. Prefer `type` for unions/intersections; prefer `interface` for extensible object shapes (both are fine for plain shapes — consistency within a file matters more than a global rule).

**No `I` prefix** (e.g., `IBooking` → `Booking`).  
**No `Data` suffix** for domain types (e.g., `BookingData` → `Booking`).  
**No `Type` suffix** unless it is a union type alias (e.g., `BookingStatusType`).

```typescript
// ✅ Good
interface Booking { id: string; tenantId: string; status: BookingStatus }
type BookingStatus = 'pending' | 'confirmed' | 'checked_in'
interface LoyaltyTier { name: string; pointsThreshold: number }
type FolioLineItem = { chargeType: BookingChargeType; amount: number }

// ❌ Bad (existing — migrate over time)
interface BookingData { ... }    ← redundant 'Data' suffix
interface StaffData { ... }      ← same
interface GuestData { ... }      ← same
```

**Existing `*Data` types** (`BookingData`, `GuestData`, `StaffData`, etc. in `lib/types/`) are legacy. Keep them stable for now; rename in a future breaking-change sprint.

### 4.2 Enums
**Pattern:** `PascalCase` name, `PascalCase` values. Use string enums.

```typescript
// ✅ Good
enum BookingStatus {
  Pending    = 'pending',
  Confirmed  = 'confirmed',
  CheckedIn  = 'checked_in',
}

// ✅ Also good: union type (preferred for simple cases)
type BookingStatus = 'pending' | 'confirmed' | 'checked_in';

// ❌ Bad
enum BOOKING_STATUS { PENDING = 'PENDING' }     ← SCREAMING values
type AIConversationChannel = 'WEB' | 'EMAIL'    ← ALL_CAPS values in union
```

**Existing violation:** `AIConversationChannel` in `lib/types/ai.ts` uses `'WEB' | 'EMAIL' | 'WHATSAPP' | 'PHONE'`. Migrate to lowercase to match the DB enum when safe.

### 4.3 Constants
**Pattern:** `SCREAMING_SNAKE_CASE` for true constants (never reassigned, semantically global).

```typescript
// ✅ Good
export const MAX_LOGIN_ATTEMPTS = 5;
export const FRAUD_DETECTION = { ... };
export const NAMQR_CURRENCY_NAD = '516';

// ✅ Also fine: object constant groups
export const RATE_LIMITS = {
  '/api/auth/login': { requests: 5, window: '15 m' },
  default:           { requests: 100, window: '1 m' },
} as const;
```

**Existing DRY violation:** `RATE_LIMITS` is defined in **both** `lib/config/constants.ts:176` and `lib/utils/rate-limit.ts:23`. The copy in `constants.ts` appears to be documentation/reference only while `rate-limit.ts` is the runtime source. **Action:** delete the copy from `constants.ts` and re-export from `rate-limit.ts` if needed elsewhere.

### 4.4 Generics
Single uppercase letter for simple generics; descriptive name for complex ones:

```typescript
function get<T>(id: string): Promise<T>              // ✅
function transform<TInput, TOutput>(x: TInput): TOutput  // ✅
function load<GuestType>(...)                        // ❌ verbose
```

---

## 5. Files, Modules, and Services

### 5.1 Service Classes
**Pattern:** `PascalCase.ts`, filename = class name, `Service` suffix for pure service classes.

```
lib/services/booking/BookingService.ts      ✅
lib/services/loyalty/LoyaltyService.ts      ✅
lib/services/payment/AdumoVirtualService.ts ✅
```

**Specialised suffixes:**
- `*Service.ts` — stateful service class
- `*Gate.ts` — validation/guard (e.g., `PsdPaymentFraudGate.ts`)
- `*Router.ts` — provider/strategy router (e.g., `LLMProviderRouter.ts`)
- `*Adapter.ts` — external protocol adapter (e.g., `VoiceChannelAdapter.ts`)
- `*Bridge.ts` — cross-domain connector (e.g., `CrmMemoryBridge.ts`)
- `*Extractor.ts` — data extraction (e.g., `SofiaGuestFactExtractor.ts`)

### 5.2 Utility Functions (Non-Class Files)
**Pattern:** `kebab-case.ts` for files containing only functions (no class).

```
lib/utils/rate-limit.ts         ✅
lib/utils/api-helpers.ts        ✅
lib/services/booking/bookingLifecycleSideEffects.ts   ⚠️  camelCase — use kebab-case
lib/services/crm/crmGuestInsights.ts                  ⚠️  camelCase — use kebab-case
lib/services/ai/sofia-api-handlers.ts                 ✅ already kebab-case
lib/services/qr/namqr-core.ts                         ✅ already kebab-case
```

#### The one rule that governs file casing (read this before "fixing" a filename)

A file's casing is decided **by what the file exports, not by which folder it lives in**:

| File's primary export… | Casing | Example |
|------------------------|--------|---------|
| A `class` | `PascalCase.ts`, filename = class name | `FraudDetectionService.ts` |
| Only functions / constants / types (no class) | `kebab-case.ts` | `tenant-fraud-rules.ts`, `namqr-core.ts` |

**`lib/services/` deliberately mixes both casings in the same folder — this is correct, not an inconsistency
to "clean up."** A domain folder holds its stateful service class next to its pure-function helpers, and each
file follows its own rule:

```
lib/services/fraud/
├── FraudDetectionService.ts   ← class      → PascalCase  ✅
└── tenant-fraud-rules.ts      ← functions  → kebab-case  ✅   (same folder, different casing — by design)

lib/services/qr/
├── NamQrService.ts            ← class      → PascalCase  ✅
└── namqr-core.ts              ← functions  → kebab-case  ✅
```

> ⚠️ **Do not rename a kebab-case helper inside `lib/services/` to PascalCase to "match its neighbours."**
> If it exports no class, kebab-case is its intended, correct name.
>
> `lib/utils/` is uniformly kebab-case only because it contains no service classes — that uniformity is a
> consequence of its contents, not a folder-level rule. Never infer "this folder is all kebab-case" or "all
> PascalCase" from a folder name; check the file's exports.

The camelCase files flagged ⚠️ above are the only genuine violations here: they export functions but use
camelCase instead of kebab-case. See the migration table below.

**Existing violations** (camelCase non-class files — rename when touching these files):

| Current | Correct |
|---------|---------|
| `bookingLifecycleSideEffects.ts` | `booking-lifecycle-side-effects.ts` |
| `linkGuestAccount.ts` | `link-guest-account.ts` |
| `crmGuestInsights.ts` | `crm-guest-insights.ts` |
| `guestStayAccess.ts` | `guest-stay-access.ts` |
| `findGuestByWhatsappPhone.ts` | `find-guest-by-whatsapp-phone.ts` |
| `tenantWhatsappLookup.ts` | `tenant-whatsapp-lookup.ts` |
| `settleOffPlatformFolio.ts` | `settle-off-platform-folio.ts` |
| `applyDiningAdumoDeposit.ts` | `apply-dining-adumo-deposit.ts` |
| `completeAdumoVirtualPayment.ts` | `complete-adumo-virtual-payment.ts` |

### 5.3 NamQR Naming (Deduplication Required)
There are currently **three** representations of "NamQR" in service file names:

| File | Problem |
|------|---------|
| `NAMQRService.ts` | ALL_CAPS acronym |
| `NamQRService.ts` | Mixed acronym capitalisation |
| `HospitalityNamQrPaymentService.ts` | Inconsistent again |
| `namqr-core.ts` | All-lowercase (utility — acceptable) |

**Standard:** Use `NamQr` (treating "NamQR" as a two-part word: "Nam" + "Qr").

| Current | Correct |
|---------|---------|
| `NAMQRService.ts` | `NamQrService.ts` |
| `HospitalityNamQrPaymentService.ts` | `NamQrPaymentService.ts` ← remove `Hospitality` prefix (redundant in hotel context) |

### 5.4 Feature Folders (Components)
**Pattern:** singular domain noun.

**Existing inconsistency** in `components/features/`:

| Folder | Rule | Action |
|--------|------|--------|
| `booking` | ✅ singular | keep |
| `bookings` | ❌ should be `booking` | merge contents into `booking/`, remove `bookings/` |
| `room` | — only has `rooms/` | ✅ |
| `rooms` | ✅ matches the app route (`/dashboard/rooms`) | keep as-is; route domain plurals are acceptable |
| `payment` | singular service code | keep |
| `payments` | matches route | keep — route-aligned folders may stay plural |

**Decision rule:** If a folder maps 1:1 to a dashboard route (`/dashboard/bookings`), using plural is acceptable. If it contains generic domain components reused across routes, use singular.

**`components/dining/` orphan:** All dining components live here instead of `components/features/restaurant/`. These are public-facing dining menu components, not dashboard restaurant ops. Keep the split:
- `components/dining/` — public-facing menu book components
- `components/features/restaurant/` — staff restaurant management components

### 5.5 Test Files
**Pattern:** `kebab-case.test.ts`. Mirrors the file being tested.

```
lib/services/loyalty/LoyaltyService.ts  →  tests/loyalty/loyalty-service.test.ts  ✅
                                        ❌ tests/loyalty/LoyaltyService.test.ts    (PascalCase — non-standard)
```

**Existing violation:**  
`tests/loyalty/LoyaltyService.test.ts` → **done**, renamed to `loyalty-service.test.ts`.

---

## 6. Variables, Parameters, and Booleans

### 6.1 Local Variables
**Pattern:** `camelCase`. No single-letter names except loop indexes `i`, `j`, `k` and well-understood math.

```typescript
// ✅ Good
const tenantId = params.tenantId;
const checkInDate = new Date(body.checkInDate);

// ❌ Bad
const tid = params.tenantId;     ← unexplained abbreviation
const d = new Date();             ← meaningless
const x = req.body;               ← meaningless
```

### 6.2 Booleans
**Pattern:** `is*`, `has*`, `can*`, `should*`.

```typescript
// ✅ Good
const isActive = tenant.status === 'active';
const hasUnpaidCharges = folio.openLines.length > 0;
const canCheckOut = isActive && !hasUnpaidCharges;

// ❌ Bad
const active = ...;          ← adjective without prefix
const checkOutAllowed = ...;  ← passive — prefer canCheckOut
```

### 6.3 Function Parameters
Name parameters after the concept, not the type:

```typescript
// ✅ Good
function getBookings(tenantId: string, propertyId: string): Promise<Booking[]>
function charge(booking: Booking, amount: number): Promise<void>

// ❌ Bad
function getBookings(id1: string, id2: string): Promise<Booking[]>   ← ambiguous
function charge(b: Booking, n: number): Promise<void>                ← abbreviated
```

### 6.4 Event Handlers (React)
**Pattern:** `handle*` for implementations, `on*` for prop callbacks.

```tsx
// ✅ Good
<Button onClick={handleSave}>Save</Button>

function BookingForm({ onSubmit }: { onSubmit: (booking: Booking) => void }) {
  function handleSubmit(e: FormEvent) { ... onSubmit(booking); }
  return <form onSubmit={handleSubmit}>...
}
```

---

## 7. Environment Variables

### 7.1 Naming Pattern
**Pattern:** `SCREAMING_SNAKE_CASE`. Grouped by vendor/domain prefix.

| Prefix | Purpose |
|--------|---------|
| `DATABASE_*` | Database connection |
| `NEXTAUTH_*` | NextAuth.js internals |
| `NEXT_PUBLIC_*` | Browser-exposed config |
| `ADUMO_*` | Adumo payment gateway |
| `EMAIL_*` | SMTP / transactional email |
| `HOTEL_ETUNA_*` | Property-specific business config |
| `BUFFR_*` | Platform/billing config |
| `QDRANT_*` | Vector DB |
| `DEEPSEEK_*` | AI provider |
| `AWS_S3_*` | Object storage |
| `TWILIO_*` | SMS provider |
| `BON_*` | Bank of Namibia API |
| `LINEAR_*` | Issue tracker |
| `MEM0_*` | Long-term AI memory |

### 7.2 Existing Inconsistency
Stack Auth variables use two different prefix schemes:

| Variable | Prefix |
|----------|--------|
| `STACK_AUTH_PROJECT_ID` | `STACK_AUTH_` |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | `NEXT_PUBLIC_STACK_` |
| `STACK_SECRET_SERVER_KEY` | `STACK_` |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | `NEXT_PUBLIC_STACK_` |

**Rule:** Server-only Stack Auth vars should use `STACK_AUTH_*`; browser-exposed vars are forced to `NEXT_PUBLIC_*` by Next.js. This is acceptable — the inconsistency is a Next.js constraint.

### 7.3 Booleans
Use `true`/`false` strings, not `1`/`0` or `yes`/`no`:
```
HOTEL_ETUNA_PRICES_VAT_INCLUSIVE=true   ✅
RAG_ENABLED=true                         ✅
```

---

## 8. React Components

### 8.1 Component Files
**Pattern:** `PascalCase.tsx`. Filename = component name.

```
BookingForm.tsx          ✅
ErrorDisplay.tsx         ✅
AMLDashboard.tsx         ✅
use-toast.tsx            ✅  (hook, kebab-case is correct)
```

### 8.2 Props Interfaces
**Pattern:** `<ComponentName>Props`. No `I` prefix.

```typescript
// ✅ Good
interface ErrorDisplayProps { error: string | Error; title?: string; }
interface BookingFormProps  { onSubmit: (b: Booking) => void; }

// ❌ Bad
interface IErrorDisplayProps { ... }     ← I prefix
interface ErrorDisplayPropsType { ... }  ← Type suffix
```

### 8.3 Component Organisation
Components follow a three-tier hierarchy:

```
components/
├── <ComponentName>.tsx         ← cross-cutting, no domain only (RootErrorBoundary, PlatformToastProvider)
│                               ← domain UI lives under components/features/<domain>/ (e.g. rooms/RoomPhotoTour)
├── brand/                      ← Hotel Etuna brand assets only
├── dining/                     ← public digital menu (no staff ops)
├── compliance/                 ← standalone compliance widgets
├── shared/                     ← truly reusable primitives (ErrorDisplay, EmptyState)
└── features/
    └── <domain>/               ← domain-scoped components (booking, crm, fraud, …)
```

**Rule:** A component belongs in `shared/` only if it has zero domain knowledge. Once it knows about a `Booking`, `Guest`, or `Tenant`, it goes in `features/<domain>/`.

---

## 9. Summary of Findings by Principle

### DRY Violations Found
| Location | Issue | Action |
|----------|-------|--------|
| `lib/config/constants.ts:176` + `lib/utils/rate-limit.ts:23` | `RATE_LIMITS` defined twice | Delete from `constants.ts`; re-export from `rate-limit.ts` where needed |
| `lib/services/qr/NAMQRService.ts` + `NamQRService.ts` | Two nearly-identical service files | Audit for actual duplication; delete one |
| `lib/types/booking.ts` `GuestData` + `lib/types/guest.ts` `GuestData` | Same interface name in two type files | Merge or distinguish clearly |

### KISS Violations Found
| Location | Issue | Action |
|----------|-------|--------|
| `components/features/booking/` | Consolidated singular booking domain folder | Keep as canonical booking feature path |
| `HospitalityNamQrPaymentService.ts` | Over-qualified name | Rename to `NamQrPaymentService.ts` |
| `bookingLifecycleSideEffects.ts` (camelCase) | Inconsistent with adjacent PascalCase files | Rename to `booking-lifecycle-side-effects.ts` |

### Boy Scout Rule — Applied Now
| File | Change |
|------|--------|
| `tests/loyalty/LoyaltyService.test.ts` | ✅ Renamed to `loyalty-service.test.ts` |

### Boy Scout Rule — Planned (Next PR)
These renames require import updates across multiple files — do them as a dedicated refactor PR:

| File | Target Name | Risk |
|------|-------------|------|
| `lib/services/qr/NAMQRService.ts` | `NamQrService.ts` | Medium — check imports |
| `lib/services/booking/bookingLifecycleSideEffects.ts` | `booking-lifecycle-side-effects.ts` | Medium |
| `lib/services/crm/crmGuestInsights.ts` | `crm-guest-insights.ts` | Low |
| `lib/services/booking/linkGuestAccount.ts` | `link-guest-account.ts` | Medium |
| `lib/services/payment/HospitalityNamQrPaymentService.ts` | `NamQrPaymentService.ts` | Medium |
| `lib/types/` — `*Data` types | Remove `Data` suffix | High — touches 40+ type usages |
| `lib/types/ai.ts` — `AIConversationChannel` | Lowercase values | Medium — check all switch statements |

---

## 10. Examples from the Codebase

### Good names (keep these as models)
```typescript
// Clear service class — name = file = class
class LoyaltyService { ... }                        // LoyaltyService.ts

// Self-documenting function parameters
async function requireTenantSessionUser(req: NextRequest)

// Boolean DB column with is_ prefix
is_active, is_signed_up, is_public

// Specific path param avoiding ambiguity
/guest/stays/[bookingId]/folio

// Descriptive migration with verb phrase
0009_booking_charges_folio.sql
0016_seed_fraud_detection_rules.sql

// SCREAMING constants group
export const RATE_LIMITS = { '/api/auth/login': ... }
```

### Names to fix (anti-patterns)
```typescript
// ❌ camelCase non-class service file
bookingLifecycleSideEffects.ts        → booking-lifecycle-side-effects.ts

// ❌ ALL_CAPS acronym
NAMQRService.ts                        → NamQrService.ts

// ❌ Redundant Data suffix
interface BookingData { ... }          → interface Booking { ... }

// ❌ ALL_CAPS union values
type AIConversationChannel = 'WEB'     → 'web' | 'email' | 'whatsapp' | 'phone'

// ❌ Context repetition
BookingService.getBookingById(bookingId) → BookingService.getById(id)

// ❌ DRY violation
export const RATE_LIMITS in constants.ts AND rate-limit.ts
```

---

## 11. Tooling Integration

These rules can be enforced via ESLint and TypeScript. Suggested additions to `.eslint.config.mjs`:

```javascript
// Disallow I-prefix on interfaces
'@typescript-eslint/naming-convention': [
  'error',
  { selector: 'interface', format: ['PascalCase'], custom: { regex: '^(?!I[A-Z])', match: true } },
  { selector: 'typeAlias', format: ['PascalCase'] },
  { selector: 'enum', format: ['PascalCase'] },
  { selector: 'enumMember', format: ['PascalCase'] },
  { selector: 'variable', modifiers: ['const', 'global'], format: ['UPPER_CASE', 'camelCase', 'PascalCase'] },
]
```

For file naming, add a custom ESLint rule or `eslint-plugin-filenames-simple`:
```javascript
'filenames-simple/naming-convention': ['error', { rule: 'kebab-case' }],
// Exception: PascalCase for class files tracked via tsconfig paths
```

---

*This document should be reviewed when major new domains are added to the platform. The team lead or CTO must approve deviations from these conventions.*
