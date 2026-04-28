# Hotel Etuna — Implementation Plan

## Step 1: Neon DB Migration

1. Keep Drizzle as ORM.
2. Set:
   - `DATABASE_URL` (pooled)
   - `DATABASE_URL_UNPOOLED` (direct)
3. Remove Supabase runtime dependencies/usages.
4. Validate with Drizzle migration flow.

## Step 2: Tenant Type Migration

Add/confirm:

```sql
CREATE TYPE "TenantType" AS ENUM ('hub', 'partner');
ALTER TABLE tenants ADD COLUMN "type" "TenantType" NOT NULL DEFAULT 'hub';
ALTER TABLE tenants ADD COLUMN "parent_tenant_id" text REFERENCES tenants(id);
ALTER TABLE tenants ADD COLUMN "commission_percent" numeric(5,2) DEFAULT 10;
ALTER TABLE bookings ADD COLUMN "commission_amount" numeric(12,2);
```

## Step 3: Middleware Adaptation

- Inject tenant context from JWT claims.
- Hub routes use `HUB_TENANT_ID` defaults where appropriate.
- Partner routes enforce `tenant_type='partner'` and own-tenant scope.
- Block partners from `/api/ai/*`, `/api/sofia/*`, `/api/crm/*` with `403`.

## Step 4: Hub/Partner UI Shells

- Hub sidebar: Hotel Etuna brand, no workspace switcher.
- Partner sidebar: Dashboard, My Property, Rooms, Rates, Bookings, Settings.
- No AI/CRM/Sofia navigation in partner layout.

## Step 5: Landing & Public Experience

- Implement final Hotel Etuna landing structure and copy.
- Implement `/partners` and `/[partnerSlug]`.
- Ensure partner pages show contact form/phone instead of Sofia widget.

## Step 6: Partner Invite & Claim Flow

- `POST /api/partners/invite`
  - Validate hub admin
  - Create token + expiry in `partner_invites`
  - Send branded invitation email
- `POST /api/partners/claim-invite`
  - Validate token
  - Create `partner_admin` user, `partner` tenant, property
  - Link `parent_tenant_id` to hub

## Step 7: Booking + Commission Flow

- Booking creation checks tenant context.
- For partner bookings, compute and persist `commission_amount`.
- Hub dashboard aggregates commissions by partner and date range.

## Step 8: Hotel Etuna Email Overhaul

- Create `lib/email/HotelEtunaEmailBase.ts`.
- Route all booking lifecycle emails through branded wrapper.
- Ensure sender identities match Hotel Etuna domains.

## Step 9: Sofia Hub-Only Enablement

- Ingest Hotel Etuna knowledge into Qdrant (hub namespace only).
- Update Sofia prompt and response behavior for Hotel Etuna operations.
- Verify no partner AI ingestion path exists.

## Step 10: Testing & Security

- Integration tests for:
  - invite/claim lifecycle
  - tenant isolation
  - commission calculation
  - 403 restrictions on hub-only AI/CRM routes
- E2E tests for:
  - hub booking flow
  - partner onboarding
  - partner listing booking flow

## Step 11: Domain & Launch

- Configure Namecheap DNS to Vercel.
- Add `hoteletuna.com` and optional partner subdomain.
- Deploy staging first, then production after checklist validation.

---

Use `TASK.md` as execution tracker; this file is the technical sequence reference.
