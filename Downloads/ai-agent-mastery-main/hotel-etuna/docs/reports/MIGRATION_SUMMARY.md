# Hotel Etuna Migration Summary

**Date:** April 28, 2026  
**From:** Buffr Host (multi-tenant SaaS)  
**To:** Hotel Etuna (hub-and-spoke with partner network)

---

## ✅ Completed Changes

### 1. Database Migrations

**Migration Created:** `database/drizzle/0003_hotel_etuna_partner_network.sql`

**Schema Updates:**

| Table | Change | Description |
|-------|--------|-------------|
| `tenants` | Added `type` enum | Distinguishes 'hub' (Hotel Etuna) from 'partner' (Jayla, Aquarius) |
| `tenants` | Added `parent_tenant_id` | Links partner tenants to hub tenant for commission tracking |
| `tenants` | Added `commission_percent` | Configurable commission rate (default 10%) for partner bookings |
| `bookings` | Added `commission_amount` | Tracks commission retained by hub on partner bookings |
| **NEW** `partner_invites` | Created table | Manages invite tokens for onboarding referral partners |

**Indexes Created:**
- `idx_tenants_type` - Fast filtering by tenant type
- `idx_tenants_parent_tenant_id` - Partner -> hub lookups
- `idx_bookings_commission_amount` - Commission reporting
- `idx_partner_invites_email` - Invite email lookups
- `idx_partner_invites_token` - Token validation
- `idx_partner_invites_claimed` - Filter claimed/unclaimed invites
- `idx_partner_invites_expires_at` - Expire old tokens

**Constraints Added:**
- Commission percent: 0-100 range validation
- Commission amount: Non-negative validation
- Hub tenants: Cannot have parent_tenant_id
- Partner tenants: Must have parent_tenant_id
- Partner invites: Unique tokens

### 2. Schema File Updates

**File:** `lib/db/schema.ts`

- Updated header documentation (Buffr Host → Hotel Etuna)
- Version bumped to 2.0.0
- Added `tenantTypeEnum` ('hub', 'partner')
- Updated `tenants` table definition with new fields
- Updated `bookings` table with `commissionAmount` field
- Added `partnerInvites` table definition

### 3. Documentation Cleanup

**Removed Old Buffr Host Files:**
- SOFIA_AI_FUNCTIONALITY_TEST_REPORT.md
- BON_PSD_COMPLIANCE_ANALYSIS.md
- SOFIA_COMPREHENSIVE_TEST_IMPLEMENTATION.md
- QUICK_START_DEPLOYMENT.md
- SOFIA_TEST_SUMMARY.md
- DEPLOYMENT.md
- PRODUCTION_TEST_SUITE_FINAL_REPORT.md
- TESTING_GUIDE.md
- COMPREHENSIVE_TEST_COVERAGE_REPORT.md
- ISSUE_RESOLUTION_SUMMARY.md
- PRODUCTION_DEPLOYMENT_GUIDE.md
- tests/MISSING_TESTS_AUDIT.md
- FINAL_COMPREHENSIVE_TEST_SUMMARY.md
- START_HERE.md
- TEST_IMPLEMENTATION_COMPLETE.md
- FINAL_COMPREHENSIVE_SUMMARY.md
- E2E_UI_UX_FIXES_SUMMARY.md
- TEST_SUITE_VERIFICATION_SUMMARY.md
- components/ui/DESIGN_SYSTEM_V1.md
- database/DRIZZLE_NEON_WORKFLOW.md

**Retained Core Documentation:**
- PRD.md (updated to Hotel Etuna v2.0.0)
- TASK.md (implementation checklist)
- PLANNING.md (architecture decisions)
- IMPLEMENTATION_PLAN.md (technical steps)
- README.md (needs update)

---

## 🔄 Next Steps

### Phase 1: Apply Migration

```bash
# Set up Neon database connection
export DATABASE_URL="postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Apply migration
npx drizzle-kit push

# Verify tables
psql $DATABASE_URL -c "\d tenants"
psql $DATABASE_URL -c "\d bookings"
psql $DATABASE_URL -c "\d partner_invites"
```

### Phase 2: Seed Hub Tenant

Create seed script: `scripts/seed-hotel-etuna.ts`

```typescript
// Create Hotel Etuna hub tenant
const hubTenant = await db.insert(tenants).values({
  id: process.env.HUB_TENANT_ID,
  name: 'Hotel Etuna',
  type: 'hub',
  domain: 'hoteletuna.com',
  status: 'active',
  propertyType: 'hotel',
  hasRestaurantFeatures: true,
  roomCount: 50,
});

// Create Hotel Etuna property
const property = await db.insert(properties).values({
  id: process.env.DEFAULT_PROPERTY_ID,
  tenantId: process.env.HUB_TENANT_ID,
  name: 'Hotel Etuna',
  slug: 'hotel-etuna',
  address: '5544 Valley of the Leopard Street, Ongwediva, Namibia',
  phone: '+264 65 231 177',
  email: 'info@hoteletuna.com',
});
```

### Phase 3: Update Environment Variables

```env
# Switch from single-tenant to hub-and-spoke
SINGLE_TENANT_MODE=false
HUB_TENANT_ID=<generated-uuid>
DEFAULT_PROPERTY_ID=<generated-uuid>

# Neon database (replace Supabase)
DATABASE_URL=postgres://...
DATABASE_URL_UNPOOLED=postgres://...

# Remove Supabase vars
# SUPABASE_URL=...  # DELETE
# SUPABASE_ANON_KEY=...  # DELETE
```

### Phase 4: Remove Supabase Dependencies

```bash
# Uninstall Supabase client
npm uninstall @supabase/supabase-js

# Remove Supabase imports from code
rg "@supabase/supabase-js" -l | xargs sed -i '' '/@supabase\/supabase-js/d'

# Delete supabase directory
rm -rf supabase/
```

### Phase 5: Build Partner Features

1. Create API routes:
   - `POST /api/partners/invite`
   - `POST /api/partners/claim-invite`
   - `GET /api/partners/[id]`
   - `GET /api/commissions`

2. Build partner dashboard:
   - `app/(partner)/layout.tsx`
   - `app/(partner)/dashboard/page.tsx`
   - `app/(partner)/property/page.tsx`
   - `app/(partner)/bookings/page.tsx`

3. Create public partner pages:
   - `app/partners/page.tsx`
   - `app/[partnerSlug]/page.tsx`

4. Hub admin features:
   - `app/(dashboard)/admin/partners/page.tsx`
   - Partner invite UI
   - Commission reporting

---

## 🔒 Security Considerations

**Tenant Isolation:**
- RLS policies enforce strict data isolation
- Partners cannot access hub or other partner data
- Middleware blocks partners from AI/CRM endpoints (403 Forbidden)

**API Restrictions:**
- `/api/sofia/*` - Hub only
- `/api/ai/*` - Hub only
- `/api/crm/*` - Hub only
- Partners attempting access receive 403 with clear error message

**Invite Security:**
- Tokens are UUID v4 (cryptographically secure)
- Expiration enforced (default 7 days)
- One-time use (claimed flag prevents reuse)
- Email verification on claim

---

## 📊 Data Model Summary

### Tenant Types

**Hub (Hotel Etuna):**
- Full platform access
- Sofia AI exclusive
- CRM for all guests
- Partner management
- Commission reporting

**Partner (Jayla, Aquarius):**
- Self-service dashboard
- Property management
- Booking tracking
- Commission tracking
- No AI/CRM access

### Commission Flow

```
Guest books partner property
  ↓
Booking created with commission_amount
  = total_amount × (partner.commission_percent / 100)
  ↓
Payment collected by platform
  ↓
Commission retained by hub
  ↓
Remainder settled to partner
```

---

## ✅ Migration Checklist

- [x] Created migration file (0003)
- [x] Updated schema.ts
- [x] Removed old Buffr Host docs
- [x] Created partner_invites table
- [x] Added tenant type enum
- [x] Added commission tracking fields
- [x] Created indexes
- [x] Added constraints
- [ ] Apply migration to Neon
- [ ] Seed hub tenant
- [ ] Update environment variables
- [ ] Remove Supabase dependencies
- [ ] Build partner API routes
- [ ] Build partner dashboard
- [ ] Build public partner pages
- [ ] Test invite flow
- [ ] Test commission calculation
- [ ] Deploy to production

---

**Status:** Migration files ready. Awaiting deployment to Neon database.
