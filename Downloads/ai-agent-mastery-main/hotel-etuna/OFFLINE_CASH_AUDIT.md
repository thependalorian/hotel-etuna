# Offline & Cash Payments Audit Report

**Date:** April 28, 2026  
**Status:** ⚠️ **CRITICAL GAPS IDENTIFIED**  
**Context:** Hotel Etuna operates in Ongwediva, Namibia where internet is unreliable and cash payments are common

---

## Executive Summary

This audit reveals **critical operational gaps** that prevent Hotel Etuna from functioning effectively in its Namibian context:

1. ❌ **No offline/PWA capabilities** — App becomes unresponsive if internet drops
2. ⚠️ **Partial cash payment support** — Infrastructure exists but not exposed in UX
3. ❌ **No cash reconciliation workflow** — Cannot track daily cash-ups or discrepancies

**Risk Level:** 🔴 **HIGH** — These gaps directly impact daily operations and guest experience.

---

## 1. Audit Findings

### 1.1 PWA & Offline Support ❌ NOT IMPLEMENTED

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Web App Manifest** | ❌ Missing | N/A | No `public/manifest.json` |
| **Service Worker** | ❌ Missing | N/A | No caching, no offline fallback |
| **Offline UI** | ❌ Missing | N/A | No banner, no retry mechanism |
| **Background Sync** | ❌ Missing | N/A | No IndexedDB queue for bookings |
| **Install Prompt** | ❌ Missing | N/A | Cannot install as app |

**Impact:**
- If internet drops during booking, entire transaction is lost
- Guests arriving with weak mobile signal cannot access room information
- Staff cannot check guests in/out during connectivity issues

---

### 1.2 Cash Payment Infrastructure ⚠️ PARTIAL

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Payment Rails Definition** | ✅ Exists | `lib/payments/namibia-payment-rails.ts` | Line 24: `CASH: 'cash'` defined |
| **Payment Method Types** | ✅ Exists | `lib/payments/namibia-payment-rails.ts` | Full enum exported |
| **Bookings Schema** | ⚠️ Partial | `lib/db/schema.ts` (line 425) | Has `paymentStatus` but **no `paymentMethod` column** |
| **Payment Methods Table** | ✅ Exists | `lib/db/schema.ts` (line 474) | `type` column for method types |
| **Cash Payment API** | ❌ Missing | N/A | No endpoint to accept cash bookings |
| **Mark as Paid API** | ❌ Missing | N/A | No endpoint to mark cash as received |
| **Admin Cash UI** | ❌ Missing | N/A | No "Mark as Paid" button or modal |

**Key Finding:**  
Cash payments are defined in the payment rails (`CASH: 'cash'`) but:
- Bookings table has **no `paymentMethod` column** to store which method was used
- Bookings table **already has `paymentStatus`** column (✅ line 442)
- No API endpoints or admin UI to handle cash workflows

**Current Schema:**
```typescript
// lib/db/schema.ts (line 425-448)
export const bookings = pgTable('bookings', {
  // ... other fields ...
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // ✅ EXISTS
  // ❌ MISSING: paymentMethod column
});
```

---

### 1.3 Cash Reconciliation ❌ NOT IMPLEMENTED

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Reconciliation Table** | ❌ Missing | N/A | No `cash_reconciliations` table in schema |
| **Reconciliation API** | ⚠️ Empty | `app/api/payments/` | Folder exists but no reconciliation route |
| **Daily Cash-Up UI** | ❌ Missing | N/A | No dashboard page for cash reconciliation |
| **Discrepancy Tracking** | ❌ Missing | N/A | No logging of cash over/short |
| **Audit Trail** | ⚠️ Partial | Various | General audit logs exist but no cash-specific |

**Existing Payment Routes:**
```bash
app/api/payments/
├── 3ds-callback/
├── complete/
└── initiate/
```

**Missing:**
- `/api/payments/reconciliation` — No route for daily cash-up
- `/app/(dashboard)/payments/reconciliation` — No admin UI

---

## 2. Database Schema Analysis

### 2.1 Bookings Table (Current State)

**File:** `lib/db/schema.ts` (line 425)

```typescript
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingReference: varchar('booking_reference', { length: 100 }).unique().notNull(),
  status: varchar('status', { length: 50 }).default('confirmed'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // ✅ EXISTS
  // ❌ MISSING: paymentMethod VARCHAR(50) - which method was used?
  // ❌ MISSING: amountTendered DECIMAL(10,2) - for cash tracking
  // ❌ MISSING: changeGiven DECIMAL(10,2) - for cash tracking
  // ❌ MISSING: receiptNumber VARCHAR(100) - for cash receipt tracking
});
```

**Assessment:**
- ✅ `paymentStatus` already exists — can track pending/paid/refunded
- ❌ `paymentMethod` missing — cannot distinguish cash vs card vs NamQR
- ❌ Cash-specific fields missing — no way to track tender/change

---

### 2.2 Payment Methods Table (Current State)

**File:** `lib/db/schema.ts` (line 474)

```typescript
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  guestId: uuid('guest_id').references(() => guests.id),
  type: varchar('type', { length: 50 }).notNull(), // ✅ Can store 'cash'
  provider: varchar('provider', { length: 50 }),
  lastFour: varchar('last_four', { length: 4 }),
  // ...
});
```

**Assessment:**
- ✅ This table can store saved payment methods
- ⚠️ But it's separate from bookings — doesn't link payment method to specific booking
- ✅ The `type` field can already store `'cash'` from payment rails
- ❌ No reconciliation table exists

---

## 3. Required Database Changes

### Migration 0007: Cash Payments & Reconciliation

```sql
-- File: lib/db/migrations/0007_add_cash_payments.sql

-- Add payment method to bookings (links to payment rails)
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card'
  CHECK (payment_method IN ('card', 'cash', 'namqr', 'bank_transfer', 'ewallet', 'eft', 'bank_deposit', 'open_banking_transfer'));

-- Add cash-specific tracking fields
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS amount_tendered DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS change_given DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

-- Create cash reconciliation table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  shift VARCHAR(20), -- 'morning', 'afternoon', 'evening'
  expected_amount DECIMAL(12,2) NOT NULL,
  actual_amount DECIMAL(12,2) NOT NULL,
  discrepancy DECIMAL(12,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
  notes TEXT,
  staff_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_tenant_date 
  ON cash_reconciliations(tenant_id, reconciliation_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_property 
  ON cash_reconciliations(property_id, reconciliation_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method 
  ON bookings(payment_method) WHERE payment_method = 'cash';

-- Comments for documentation
COMMENT ON COLUMN bookings.payment_method IS 'Payment method used for this booking (matches payment rails)';
COMMENT ON COLUMN bookings.amount_tendered IS 'Cash tendered by guest (only for cash payments)';
COMMENT ON COLUMN bookings.change_given IS 'Change given to guest (only for cash payments)';
COMMENT ON COLUMN bookings.receipt_number IS 'Physical receipt number (for cash audit trail)';
COMMENT ON TABLE cash_reconciliations IS 'Daily cash-up records for audit and discrepancy tracking';
```

---

## 4. Implementation Roadmap

### Phase 1: Cash Payments (PRIORITY 1) 🔴

**Timeline:** This week  
**Impact:** Enables basic cash operations

| Task | File(s) | Status |
|------|---------|--------|
| ✅ Database migration | `lib/db/migrations/0007_add_cash_payments.sql` | To implement |
| ✅ Update bookings schema | `lib/db/schema.ts` | To implement |
| ✅ Create "Mark as Paid" API | `app/api/bookings/[id]/payment/route.ts` | To implement |
| ✅ Admin booking detail UI | `app/(dashboard)/bookings/[id]/page.tsx` | To implement |
| ✅ Cash payment modal | `components/features/bookings/CashPaymentModal.tsx` | To implement |
| ✅ Receipt printing | `components/features/bookings/BookingReceipt.tsx` | To implement |

---

### Phase 2: Cash Reconciliation (PRIORITY 2) 🟡

**Timeline:** Next week  
**Impact:** Enables daily cash-up and audit trails

| Task | File(s) | Status |
|------|---------|--------|
| ✅ Reconciliation API | `app/api/payments/reconciliation/route.ts` | To implement |
| ✅ Daily cash-up dashboard | `app/(dashboard)/payments/reconciliation/page.tsx` | To implement |
| ✅ Reconciliation service | `lib/services/payments/ReconciliationService.ts` | To implement |
| ✅ Discrepancy reporting | Part of dashboard | To implement |

---

### Phase 3: PWA & Offline Support (PRIORITY 3) 🟠

**Timeline:** Within 2 weeks  
**Impact:** Enables offline browsing and app install

| Task | File(s) | Status |
|------|---------|--------|
| ✅ Web App Manifest | `public/manifest.json` | To implement |
| ✅ Service Worker | `public/sw.js` or via `next-pwa` | To implement |
| ✅ Offline banner component | `components/OfflineBanner.tsx` | To implement |
| ✅ Offline fallback page | `app/offline/page.tsx` | To implement |
| ✅ Cache strategy config | `next.config.js` | To implement |

---

### Phase 4: Offline Booking Queue (PRIORITY 4) ⚪

**Timeline:** Within 3 weeks  
**Impact:** Enables booking during internet outages

| Task | File(s) | Status |
|------|---------|--------|
| ✅ IndexedDB queue service | `lib/services/offline/BookingQueueService.ts` | To implement |
| ✅ Background sync worker | `public/sw.js` (background sync) | To implement |
| ✅ Queue management UI | `components/features/offline/QueueStatus.tsx` | To implement |
| ✅ Sync status notifications | Toast messages | To implement |

---

## 5. Business Impact Analysis

### Without These Features

**Operational Risks:**
- 🔴 **Lost bookings** — If internet drops during transaction, guest must start over
- 🔴 **No cash tracking** — Manual spreadsheets required, error-prone
- 🔴 **No audit trail** — Cannot reconcile daily cash or detect discrepancies
- 🟡 **Poor guest experience** — Cannot browse offline, app unusable during outages

**Financial Risks:**
- Cash over/short cannot be tracked systematically
- No evidence for disputed transactions
- Compliance issues (PSD-12 requires audit trails)

### With These Features

**Operational Benefits:**
- ✅ **Resilient operations** — Staff can work during internet outages
- ✅ **Cash audit trail** — Every cash transaction logged with receipt number
- ✅ **Daily reconciliation** — Automated expected vs actual cash tracking
- ✅ **Better UX** — Guests can browse offline, install app on home screen

**Financial Benefits:**
- Accurate cash tracking reduces discrepancies
- Complete audit trail for compliance and disputes
- Faster checkout (cached data loads instantly)

---

## 6. Technical Dependencies

### Required for Phase 1 (Cash Payments)

- ✅ Neon DB migration support (already exists)
- ✅ Drizzle ORM (already configured)
- ✅ NextAuth session (for staff authentication)
- ✅ Payment rails definition (already exists)
- ⏳ New: Cash payment modal component
- ⏳ New: Receipt printing component

### Required for Phase 3 (PWA)

- ⏳ `next-pwa` package or custom service worker
- ⏳ Workbox (for caching strategies)
- ⏳ Web App Manifest
- ⏳ Service Worker registration

### Required for Phase 4 (Offline Queue)

- ⏳ IndexedDB (native browser API)
- ⏳ Background Sync API (service worker feature)
- ⏳ Queue management logic
- ⏳ Conflict resolution strategy

---

## 7. Recommendations

### Immediate Actions (This Week)

1. ✅ **Implement Phase 1: Cash Payments**
   - Create database migration
   - Build "Mark as Paid" API
   - Add admin UI for cash payments
   - Enable receipt printing

2. ✅ **Test with real cash flow**
   - Front desk staff receives cash booking
   - Marks as paid with amount tendered/change
   - Prints receipt with unique number

### Next Week

3. ✅ **Implement Phase 2: Cash Reconciliation**
   - Build reconciliation API
   - Create daily cash-up dashboard
   - Test end-of-shift cash-up workflow

### Within 2 Weeks

4. ✅ **Implement Phase 3: PWA Basics**
   - Create manifest and service worker
   - Test offline browsing
   - Enable app installation

### Within 3 Weeks

5. ✅ **Implement Phase 4: Offline Booking Queue**
   - Build IndexedDB queue
   - Test booking during internet outage
   - Verify background sync when online

---

## 8. Success Metrics

### Phase 1 Success Criteria

- ✅ Staff can mark cash bookings as paid
- ✅ Amount tendered and change are tracked
- ✅ Receipt prints with unique number
- ✅ Cash bookings appear in booking list with "Cash" badge

### Phase 2 Success Criteria

- ✅ Daily cash-up report generates correctly
- ✅ Discrepancy calculation is accurate
- ✅ Staff can enter notes for over/short amounts
- ✅ Historical reconciliations are searchable

### Phase 3 Success Criteria

- ✅ App works offline (cached pages load)
- ✅ "Install App" prompt appears
- ✅ Offline banner shows when disconnected
- ✅ Lighthouse PWA score > 90

### Phase 4 Success Criteria

- ✅ Booking queued when offline
- ✅ Booking submits automatically when online
- ✅ Guest receives confirmation after sync
- ✅ No duplicate bookings

---

## 9. Conclusion

**Current State:** Hotel Etuna has a solid foundation (payment rails, booking system, email receipts) but is **not operationally ready** for Ongwediva's internet reliability challenges or cash-heavy payment culture.

**Priority:** **Cash payments (Phase 1) must be implemented immediately** to enable basic operations. PWA/offline support can follow in phases 3-4.

**Estimated Effort:**
- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 3-5 days
- Phase 4: 5-7 days

**Total:** ~2-3 weeks for complete offline & cash support.

---

**Next Steps:**  
Proceed with Phase 1 implementation (Cash Payments) starting with database migration.

---

**Document Version:** 1.0  
**Last Updated:** April 28, 2026  
**Audited By:** AI Assistant
