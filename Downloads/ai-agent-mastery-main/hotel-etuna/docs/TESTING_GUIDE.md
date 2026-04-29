# Testing Guide: Database-Driven Landing Page & Review Approval

**Location:** `docs/TESTING_GUIDE.md` (canonical). Use this for **local QA**, **staging**, and **production smoke tests** after deploy.

**Production:** App is **live** — use your deployed origin (e.g. `https://your-domain.com`) wherever examples show `http://localhost:3000`. Set `BASE_URL` in your shell for scripted checks: `export BASE_URL=https://your-domain.com`.

---

## 0. Production smoke test (run after each deploy)

Do this on the **live** site first; repeat on `localhost` only when debugging.

| # | Area | Action | Pass criteria |
|---|------|--------|----------------|
| 1 | Health | Open `/` | 200, no blank shell, footer contact loads |
| 2 | Public hub | `#rooms`, `#dining`, `#reviews`, `#partners` | Real DB content; gated prices off until login |
| 3 | Partner | `/partners/[slug]` | Page loads; rates gated |
| 4 | Staff login | `/login` → dashboard | Session works |
| 5 | Cash booking | `/bookings/[id]` (cash booking) | Mark paid → receipt / print OK |
| 6 | Reconciliation | `/payments/reconciliation` | Date filter + save discrepancy flow OK |
| 7 | Reviews CRM | `/crm/reviews` | Toggle `is_public`; landing `#reviews` updates after ISR window |
| 8 | Sofia | Hub Sofia chat | Reply without errors (RAG optional — see `docs/project/TASK.md`) |
| 9 | Vercel | Dashboard logs | No spike of 5xx on deploy |

Automated gates (also run locally before merge):

```bash
cd hotel-etuna
npx tsc --noEmit
npm run build
npx vitest run --reporter=verbose   # Playwright specs live under e2e/ — run npm run test:e2e separately
```

**Note:** `vitest.config.ts` **excludes** `e2e/**` so **`npm run test`** is Vitest-only; use **`npm run test:e2e`** for Playwright.

---

## Quick Start (local development)

```bash
# 1. Start development server
npm run dev

# 2. Visit http://localhost:3000
# Landing page should show real data from database

# 3. Login as admin — http://localhost:3000/login

# 4. Test review approval — http://localhost:3000/crm/reviews
# Toggle a review's public status
```

---

## 1. Test Landing Page (Public)

### 1.1 Rooms Section
**URL:** `http://localhost:3000#rooms`

**Expected:**
- ✅ Shows all unique room types from database
- ✅ Each card shows: room type, price, occupancy, amenities
- ✅ "View Details" links to `/rooms/[slug]`
- ✅ Slugs are auto-generated (e.g., "Family Room" → `family-room`)

**How to Verify:**
```bash
# Check rooms in database
psql $DATABASE_URL -c "
  SELECT room_type, base_rate, max_occupancy 
  FROM rooms 
  WHERE property_id = '$DEFAULT_PROPERTY_ID'
  ORDER BY base_rate;
"
```

### 1.2 Restaurant/Dining Section
**URL:** `http://localhost:3000#dining`

**Expected:**
- ✅ Shows "Etuna Restaurant"
- ✅ Displays breakfast hours (06:30 - 10:00)
- ✅ Shows 2 menu items per category (up to 3 categories)
- ✅ Only shows available items (`is_available = true`)
- ✅ "View Full Menu" links to `/dining`

**How to Verify:**
```bash
# Check restaurant and menu
psql $DATABASE_URL -c "
  SELECT r.name, r.description, mc.name as category, mi.name as item, mi.price
  FROM restaurants r
  LEFT JOIN menu_categories mc ON mc.restaurant_id = r.id
  LEFT JOIN cms_menu_items mi ON mi.category_id = mc.id
  WHERE r.property_id = '$DEFAULT_PROPERTY_ID'
    AND mc.is_active = true
    AND mi.is_available = true
  LIMIT 6;
"
```

### 1.3 Guest Reviews Section
**URL:** `http://localhost:3000#reviews`

**Expected:**
- ✅ Shows ONLY approved reviews (`is_public = true`)
- ✅ Maximum 6 reviews displayed
- ✅ Shows: rating (stars), review text, guest name, city/country
- ✅ Average rating calculated from approved reviews
- ✅ Review count shows total approved reviews
- ✅ Empty state if no approved reviews

**How to Verify:**
```bash
# Check approved reviews
psql $DATABASE_URL -c "
  SELECT gr.id, gr.rating, gr.review_text, gr.is_public, 
         g.first_name, g.city, g.country
  FROM guest_reviews gr
  LEFT JOIN guests g ON g.id = gr.guest_id
  WHERE gr.tenant_id = '$HUB_TENANT_ID'
    AND gr.is_public = true
  ORDER BY gr.created_at DESC
  LIMIT 6;
"
```

### 1.4 Referral Partners Section
**URL:** `http://localhost:3000#partners`

**Expected:**
- ✅ Shows up to 3 active partner properties
- ✅ Each card shows: property name, description, city, image
- ✅ Links to `/partners/[slug]`
- ✅ Only partners with `status = 'active'` shown

**How to Verify:**
```bash
# Check active partners
psql $DATABASE_URL -c "
  SELECT t.name as tenant_name, t.status, p.name as property_name, p.slug, p.city
  FROM tenants t
  LEFT JOIN properties p ON p.tenant_id = t.id
  WHERE t.type = 'partner' AND t.status = 'active'
  LIMIT 3;
"
```

### 1.5 Footer/Contact Section
**URL:** `http://localhost:3000` (scroll to bottom)

**Expected:**
- ✅ Address: "5544 Valley of the Leopard Street, Ongwediva"
- ✅ Phone: +264 65 231 177, +264 81 802 4833
- ✅ Email: info@hoteletuna.com
- ✅ Check-in: 14:00, Check-out: 11:00

---

## 2. Test Admin Review Approval

### 2.1 Login as Admin
**URL:** `http://localhost:3000/login`

**Required Role:** `owner`, `manager`, or `admin`

### 2.2 Navigate to Reviews
**URL:** `http://localhost:3000/crm/reviews`

**Expected Page Features:**
- ✅ List of all reviews (approved + pending)
- ✅ Filter dropdown: All Reviews, Approved, Pending
- ✅ Sort dropdown: Date (Newest), Date (Oldest), Rating (Highest), Rating (Lowest)
- ✅ Search bar for guest name or review text
- ✅ Toggle button on each review card
- ✅ Status badge showing "Approved" or "Pending"
- ✅ Stats summary at bottom (Total, Approved, Pending counts)

### 2.3 Test Review Toggle

**Steps:**
1. Find a review with status "Pending"
2. Click the "Approve" button
3. **Expected:** 
   - Button changes to "Hide"
   - Badge changes to "Approved" (green)
   - UI updates instantly
   - Stats update (+1 Approved, -1 Pending)

4. Visit landing page: `http://localhost:3000`
5. **Expected (after 5 min or force refresh):**
   - Newly approved review appears in Guest Reviews section
   - Review count increases by 1

6. Go back to admin page, click "Hide" button
7. **Expected:**
   - Button changes to "Approve"
   - Badge changes to "Pending"
   - Review disappears from landing page (after cache refresh)

### 2.4 Test Filters

**Filter by Status:**
- Select "Approved" → Only approved reviews shown
- Select "Pending" → Only pending reviews shown
- Select "All Reviews" → All reviews shown

**Sort by Date/Rating:**
- Select "Date (Newest)" → Most recent first
- Select "Date (Oldest)" → Oldest first
- Select "Rating (Highest)" → 5-star reviews first
- Select "Rating (Lowest)" → 1-star reviews first

**Search:**
- Type a guest name → Only matching reviews shown
- Type review text keywords → Matching reviews shown
- Clear search → All reviews shown again

---

## 3. Test API Endpoints Directly

### 3.1 Get All Reviews (Admin Only)
```bash
# Requires authentication cookie
curl -v -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/crm/reviews
```

**Expected Response:**
```json
{
  "success": true,
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "reviewText": "Excellent!",
      "isPublic": true,
      "createdAt": "2026-04-28T...",
      "guest": { "firstName": "John", "city": "Windhoek" },
      "property": { "name": "Hotel Etuna" }
    }
  ],
  "count": 10
}
```

### 3.2 Toggle Review Visibility
```bash
# Approve a review
curl -v -X PATCH \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"is_public": true}' \
  http://localhost:3000/api/crm/reviews/REVIEW_ID

# Expected response:
# { "success": true, "message": "Review approved and is now public", "review": {...} }

# Hide a review
curl -v -X PATCH \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"is_public": false}' \
  http://localhost:3000/api/crm/reviews/REVIEW_ID
```

### 3.3 Test Authorization (Should Fail)
```bash
# Without authentication
curl -v http://localhost:3000/api/crm/reviews

# Expected: 401 Unauthorized

# With wrong role (e.g., regular user)
curl -v -H "Cookie: next-auth.session-token=REGULAR_USER_TOKEN" \
  http://localhost:3000/api/crm/reviews

# Expected: 403 Forbidden
```

---

## 4. Test Edge Cases

### 4.1 No Approved Reviews
```sql
-- Hide all reviews temporarily
UPDATE guest_reviews SET is_public = false WHERE tenant_id = '$HUB_TENANT_ID';
```

**Visit:** `http://localhost:3000`

**Expected:**
- "No reviews yet. Be the first to share your experience!" message
- No average rating badge
- No review cards

### 4.2 No Rooms
```sql
-- Temporarily delete rooms (DO NOT RUN ON PRODUCTION!)
DELETE FROM rooms WHERE property_id = '$DEFAULT_PROPERTY_ID';
```

**Expected:**
- Rooms section renders but is empty
- No console errors

### 4.3 Guest Deleted (Review Orphaned)
```sql
-- Delete a guest who has reviews
DELETE FROM guests WHERE id = 'some-guest-id';
```

**Expected:**
- Review still shows on landing page
- Guest name shows as "Guest" or "Anonymous"
- No errors

### 4.4 Partner Has No Property
```sql
-- Create partner with no property
INSERT INTO tenants (name, type, status) VALUES ('Test Partner', 'partner', 'active');
```

**Expected:**
- Partner does not appear on landing page
- No errors

---

## 5. Performance Testing

### 5.1 Check ISR (Incremental Static Regeneration)

1. Visit `http://localhost:3000`
2. Note the time
3. Change a room price in database
4. Refresh page immediately → **Should show old price**
5. Wait 5 minutes
6. Refresh page → **Should show new price**

**How to Force Revalidation:**
```typescript
// Add this to a debug endpoint (DO NOT commit)
import { revalidatePath } from 'next/cache';

export async function POST() {
  revalidatePath('/');
  return Response.json({ revalidated: true });
}
```

### 5.2 Check Database Query Performance

```bash
# Enable query logging in development
psql $DATABASE_URL -c "ALTER DATABASE your_db SET log_statement = 'all';"

# Visit landing page
# Check logs for query times
```

**Expected:**
- All queries < 100ms
- Total page load < 500ms (excluding images)

---

## 6. TypeScript & Build Verification

### 6.1 TypeScript Check
```bash
npx tsc --noEmit
```

**Expected:** Zero errors

### 6.2 Production Build
```bash
npm run build
```

**Expected:**
- ✅ No TypeScript errors
- ✅ No missing dependencies
- ✅ `app/page.tsx` builds successfully
- ✅ API routes build without errors

---

## 7. Manual checklist

### 7.1 Ongoing (production + staging)

Re-run after meaningful releases or config changes:

- [ ] All room cards display correct data
- [ ] Room detail pages load ("View Details")
- [ ] Restaurant section shows real menu items
- [ ] Only approved reviews (`is_public = true`) on public landing
- [ ] Admin can toggle review visibility in `/crm/reviews`
- [ ] Toggle persists in DB (`guest_reviews.is_public`)
- [ ] Partner cards link to `/partners/[slug]`
- [ ] Footer contact block correct
- [ ] No console errors on critical paths
- [ ] No 404s on nav and deep links tested in §0
- [ ] Cash: mark paid + receipt (`/bookings/[id]`)
- [ ] Reconciliation (`/payments/reconciliation`) for a known date

### 7.2 Build / CI gates

- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

---

## 8. Common Issues & Solutions

### Issue: Landing page shows stale data
**Solution:** Wait 5 minutes for ISR revalidation, or force revalidate with:
```typescript
revalidatePath('/');
```

### Issue: 401 Unauthorized on API routes
**Solution:** Ensure you're logged in as admin and have valid session cookie

### Issue: 403 Forbidden on review toggle
**Solution:** Check user role is `owner`, `manager`, or `admin`

### Issue: Reviews not appearing after approval
**Solution:** Wait 5 minutes for cache, or reduce ISR time:
```typescript
export const revalidate = 60; // 1 minute
```

### Issue: Menu items not showing
**Solution:** Check `cms_menu_items.is_available = true` in database

---

## 9. Database Seeding (If Needed)

If you need test data:

```sql
-- Seed a test review
INSERT INTO guest_reviews (tenant_id, property_id, guest_id, rating, review_text, is_public)
VALUES (
  '$HUB_TENANT_ID',
  '$DEFAULT_PROPERTY_ID',
  (SELECT id FROM guests LIMIT 1),
  5,
  'Amazing stay! The staff was incredibly friendly and the rooms were spotless.',
  true
);

-- Seed a pending review
INSERT INTO guest_reviews (tenant_id, property_id, guest_id, rating, review_text, is_public)
VALUES (
  '$HUB_TENANT_ID',
  '$DEFAULT_PROPERTY_ID',
  (SELECT id FROM guests LIMIT 1),
  4,
  'Great hotel, would recommend to friends!',
  false
);
```

---

## 10. Production operations (ongoing)

Deploys are assumed **automated** (e.g. push to `main` → Vercel). After each deploy:

1. Run **§0 Production smoke test** on the live origin.
2. Confirm **Vercel** env vars for that environment: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `HUB_TENANT_ID`, `DEFAULT_PROPERTY_ID`, plus LLM/SMTP and (when using RAG) Voyage + Qdrant.
3. Watch **Vercel** function logs and **Neon** for errors in the first hour.

```bash
git push origin main   # triggers deploy when connected
```

---

## 11. Cash payments & reconciliation (staff)

**URLs:** `/bookings/[id]` · `/payments/reconciliation`

**Steps (smoke):**

1. Open a booking with `payment_method = cash` and `payment_status = pending`.
2. **Mark as paid** — enter amount tendered; confirm change and receipt number.
3. Open **View / print receipt** — layout and print dialog OK.
4. Open **reconciliation** — pick the business date; enter **actual cash counted**; confirm **discrepancy** math and required notes when over threshold.

See **`docs/project/TASK.md`** for schema column names (`snake_case` in SQL).

---

**Further reading:** `docs/reports/DATABASE_DRIVEN_LANDING_PAGE.md` (implementation notes) · `docs/project/PRD.md` · `docs/project/PLANNING.md`
