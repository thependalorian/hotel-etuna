# Security Prompt Pack for Hotel Etuna

**Based on the "Security Prompt Pack" framework, tailored specifically for Hotel Etuna (Next.js, Neon PostgreSQL, Adumo Virtual, Sofia AI, RLS tenant isolation).**  
Use these prompts after building features or before deployment to catch what AI tools miss.

---

## How to Use This Pack

1. Build your feature first – get it working.
2. Find the relevant section below for what you just built.
3. Copy the prompt into your AI tool (Claude, ChatGPT, Cursor, etc.).
4. Let the AI fix what it finds, then run the prompt again – it catches layers.
5. Run **The Master Security Review** (§14) after every feature.
6. Run **Deployment Pre-Flight** (§15) before pushing to production.

### Automated pre-flight (repo checks)

```bash
npm run security:preflight
# Evidence: compliance/evidence/security/preflight-YYYY-MM-DD.json
```

Static checks live in `lib/compliance/security-pack/preflight-checks.ts` (secrets, CORS, debug routes, rate limits, XSS sanitization, RLS script, CMS upload rules). The script also runs `npm audit --audit-level=critical`.

**Automated checks (repo):** `npm run security:preflight` runs static §15 checks (secrets, CORS, rate limits, XSS sanitization, RLS script, `npm audit` critical). Evidence JSON: `compliance/evidence/security/`. Implementation: `lib/compliance/security-pack/`.

---

## 1. Frontend-Only Validation

**Why it matters for Hotel Etuna:**  
Guest forms (checkout, room service orders, profile updates) have frontend validation, but backend validation may be missing. An attacker can bypass the browser and send raw JSON to `/api/bookings`, `/api/guest/stays/*/orders`, or `/api/crm/guests` – potentially creating malformed bookings, injecting script into review text, or triggering unwanted charges.

### Prompt 1.1 – Check if backend validation exists
```
Review every form and user input in Hotel Etuna. List all API endpoints that accept user input from:
- Booking creation (`POST /api/bookings`)
- Guest stay orders (`POST /api/guest/stays/[bookingId]/orders`)
- Review submission (`POST /api/crm/reviews`)
- Partner property updates (`PATCH /api/partner/property`)
- Cash payment (`PATCH /api/bookings/[id]/payment`)
- Adumo virtual payment initiation (`POST /api/payments/virtual/initiate`)

For each, tell me: (1) Is there frontend validation? (2) Is there backend validation? (3) What specific checks (type, length, range, enum)? Flag any where backend accepts data without validating first.
```

### Prompt 1.2 – Add backend validation to a feature
```
The [booking / room order / review] feature has frontend validation but not backend validation. Add backend validation for every field using Zod or similar. Check:
- Required fields present
- Data types (string, number, boolean, date)
- String max lengths (e.g., review text ≤ 2000 chars, name ≤ 100)
- Numeric ranges (e.g., room service quantity between 1 and 10)
- Enum fields (paymentMethod: 'cash'|'card', orderType: 'dine-in'|'room_service')
- Email format for guest email

Reject invalid input with 400 error and clear message. Do not rely on frontend validation.
```

### Prompt 1.3 – Full input sanitization for user-generated content
```
Hotel Etuna displays user-generated content in:
- Guest reviews (on landing page, `/crm/reviews`)
- Guest names (folio, receipts)
- Partner property descriptions

Ensure all user input is sanitized before storage and display. Use parameterized queries for DB. Escape HTML characters when rendering (React does this by default for text, but check for `dangerouslySetInnerHTML` or any raw HTML injection points). Also sanitize any input that goes into audit logs or email templates.
```

---

## 2. Hardcoded Secrets & API Keys

**Why it matters:**  
Hotel Etuna uses many secrets: Adumo JWT secret, Voyage AI key, Qdrant API key, SMTP credentials, Neon database URLs, NextAuth secret. These must never be in source code.

### Prompt 2.1 – Scan for hardcoded secrets
```
Scan the entire Hotel Etuna codebase for hardcoded secrets:
- API keys (Adumo, Voyage, Qdrant, OpenAI, Anthropic, Groq, DeepSeek)
- Database URLs (DATABASE_URL, DATABASE_URL_UNPOOLED)
- JWT secrets (ADUMO_JWT_SECRET, NEXTAUTH_SECRET)
- SMTP passwords
- Any password, token, or key that looks like a secret.

Check all files: `*.ts`, `*.tsx`, `*.js`, `*.env*`, `*.example`, `lib/config/*`, `scripts/*`. For each found, report: file, line, whether it's in frontend (client) or backend, and recommend moving to environment variables.
```

### Prompt 2.2 – Set up environment variables correctly
```
Move all secrets in Hotel Etuna to environment variables. Create/verify `.env.local` with variables from `.env.example`. Ensure `.env` is in `.gitignore`. Verify that every reference to a secret in code uses `process.env.NAME`. List any file that still has hardcoded secrets.
```

### Prompt 2.3 – Check for secrets in frontend code
```
Search all frontend files (under `app/` except `api/`, `components/`, `public/`) for any API keys, tokens, or secrets. Frontend code is visible to visitors – no secret keys allowed. If any Adumo, Qdrant, or other secret appears, move the logic to a backend API route immediately.
```

### Prompt 2.4 – Verify .gitignore and Git history
```
Check that `.env` is in `.gitignore`. Then search Git history for any committed secrets:
git log --all --full-history -- .env
git log --all -p --diff-filter=A -- '*.env'
If any secret was ever committed, list it so I can rotate those keys.
```

### Prompt 2.5 – Separate public vs secret keys
```
Review each API key in Hotel Etuna. For each, identify if it's a public key (safe in frontend) or secret key (backend only). Check especially:
- Adumo JWT secret (secret, never in frontend)
- NextAuth secret (secret)
- Voyage/Qdrant keys (secret)
- Stripe-like keys (none currently, but for future)

If any secret is in frontend code, move it to a backend API route immediately.
```

### Prompt 2.6 – Handle new API keys safely
```
I need to add [new service, e.g., Sentry, Mailgun] to Hotel Etuna. Set up the integration using environment variables. Never put the actual key in any code file. Show me where in Vercel project settings to add the real value for production. Remind me to never paste the actual key into this chat.
```

---

## 3. Authentication & Session Security

**Why it matters:**  
Hotel Etuna uses NextAuth.js with session tokens. Guest and staff authentication must have proper token expiry, secure cookies, logout invalidation, and brute-force protection.

### Prompt 3.1 – Full authentication audit
```
Review the entire authentication system in Hotel Etuna (NextAuth.js). Check:
1. Are passwords hashed with bcrypt/argon2? (Check `lib/auth` and database `users` table)
2. Do session tokens expire? What is the lifetime? (We set 30m idle, 8h absolute)
3. Are tokens stored in httpOnly, secure, sameSite cookies? (Not localStorage)
4. Does logout (`/api/auth/signout`) invalidate the session on the server side?
5. Is there rate limiting on login attempts? (Check `proxy.ts` rate limits)
6. Are password reset tokens single-use and time-limited?
List every issue.
```

### Prompt 3.2 – Secure session configuration
```
Review session/token configuration in NextAuth. Ensure:
- Access tokens expire after 15-30 minutes (or our configured 30m)
- Refresh tokens (if any) expire after reasonable period
- Cookies have: `secure: true` (HTTPS only), `httpOnly: true`, `sameSite: 'lax'`
- Logout endpoint invalidates the session server-side
- Password change invalidates all existing sessions
```

### Prompt 3.3 – Add password security requirements
```
Review the signup and password change forms. Add:
- Minimum 8 characters
- Check against common breached passwords (use haveibeenpwned API or local list)
- No arbitrary complexity rules (length > complexity)
- Rate-limit password attempts to 5 per minute per account
- Never log or display passwords anywhere (check `console.log` in auth flows)
```

### Prompt 3.4 – Secure password reset flow
```
Review the password reset flow end-to-end:
1. Reset token is random, long (at least 32 chars), unpredictable
2. Token expires after 15-30 minutes
3. Token can be used only once
4. After reset, invalidate all other sessions for that user
5. Reset email does NOT reveal whether account exists – always say "If an account exists, we sent a reset link"
6. Reset page validates token before showing form
Fix any gaps.
```

### Prompt 3.5 – Protect against session fixation and hijacking
```
Add these session security measures:
- Generate new session ID after every successful login
- Bind session to IP or user agent (optional, but consider flagging changes)
- Add "log out everywhere" feature for guests/staff
- Ensure cookies have `secure` flag (already, but verify)
- Set `sameSite='strict'` or `'lax'` on auth cookies to prevent CSRF
```

**Tip:** Open browser DevTools → Application → Cookies → look for `next-auth.session-token`. It should have `httpOnly`, `secure`, `SameSite` flags.

---

## 4. Missing Permission Checks (Broken Access Control)

**Why it matters:**  
This is the #1 vulnerability in web apps. Hotel Etuna has tenant isolation via RLS, but API endpoints must also check that the authenticated user owns or is allowed to access a specific resource (e.g., a guest viewing another guest's folio, a staff member accessing another tenant's data).

### Prompt 4.1 – Full permission audit
```
Review every API endpoint in Hotel Etuna (`app/api/**/route.ts`). For each, tell me:
1. Does it check authentication (user is logged in)?
2. Does it check authorization (user is allowed to access this specific resource)?
   - For guest endpoints: Does it verify `booking.guest.email === session.user.email`?
   - For staff endpoints: Does it verify role (owner, manager, admin) AND tenant context?
   - For partner endpoints: Does it verify `tenant_id` matches session tenant?
3. What happens if an unauthenticated or unauthorized user sends a direct request?
Flag any endpoint missing either check. Pay special attention to:
- `/api/guest/stays/[bookingId]/folio`
- `/api/bookings/[id]` (PATCH, DELETE)
- `/api/crm/guests/[id]`
- `/api/partner/*` endpoints
- `/api/admin/*` endpoints
```

### Prompt 4.2 – Add ownership checks to guest features
```
The guest folio and ordering features allow users to view, pay, and order from their stay. Add ownership verification to every endpoint under `/api/guest/stays/[bookingId]/*`. Before returning or modifying any data, check that `booking.guest.email` matches `session.user.email`. If not, return 403 Forbidden. Do not rely on hiding UI buttons – enforce on backend.
```

### Prompt 4.3 – Protect admin-only features
```
The following features are admin-only: partner invite, platform billing, tenant management, system settings. Add role checks on the backend: verify that `session.user.role` is `owner`, `manager`, or `admin` (as defined in `lib/auth/middleware.ts`). Return 403 for unauthorized users. Also check that the user's `tenant_id` is the hub tenant (for platform-wide admin actions) – partners should never access these.
```

### Prompt 4.4 – Test for URL tampering (IDOR)
```
Check every route that uses an ID parameter in the URL or request body:
- `/api/bookings/[id]`
- `/api/guest/stays/[bookingId]/...`
- `/api/crm/guests/[id]`
- `/api/partners/[slug]` (should be public read, but check write)
Verify that the backend checks ownership or permission – not just that user is logged in. A guest changing `bookingId` should never see another guest's folio.
```

### Prompt 4.5 – Add universal permission middleware
```
Create a reusable middleware or helper function that:
- Verifies authentication (401 if not)
- Accepts a function to check authorization (e.g., `canAccessResource(user, resourceId)`)
- Returns 403 if authorization fails
- Logs unauthorized access attempts (IP, user, attempted resource)
Apply it to all protected routes. Show me how to apply it to an existing route (e.g., `/api/bookings/[id]/payment`) as an example.
```

### Prompt 4.6 – Use non-guessable IDs
```
Hotel Etuna uses UUIDs for most primary keys (bookings, guests, tenants). Verify that any resource exposed via API uses UUIDs, not sequential integers. Check tables: `tenants`, `properties`, `rooms`, `bookings`, `guests`. If any sequential IDs appear in URLs or API responses, switch to UUIDs. Sequential IDs allow enumeration of all records.
```

---

## 5. Sensitive Error Messages & Data Leaks

**Why it matters:**  
Production error responses should never expose stack traces, file paths, database schema, or internal details. Hotel Etuna's `lib/utils/api-helpers.ts` has `sanitizeErrorDetails`, but we need to ensure it's used everywhere.

### Prompt 5.1 – Fix error messages for production
```
Review how Hotel Etuna handles errors. Check every API route – do they use `sanitizeErrorDetails` or a similar wrapper? Replace any error responses that expose:
- Stack traces
- File paths (e.g., `/app/api/bookings/route.ts:42`)
- Database column names or table names
- Query details
- Internal IPs or hostnames

Log full technical details on the server (serverless logs) but return generic "Internal server error" or "Invalid request" to the client.
```

### Prompt 5.2 – Clean up console.log statements
```
Search entire codebase for `console.log`, `console.error`, `console.warn`, `console.debug`. List every statement that outputs sensitive information: user data, tokens, session IDs, request bodies containing PII, database results, API keys. Remove them or replace with structured logging that redacts sensitive fields. Use server-side logging only (e.g., `console.error` in API routes is fine but ensure it doesn't go to client).
```

### Prompt 5.3 – Add global error handling
```
Set up global error handling:
- Frontend: Add React Error Boundary to catch rendering errors and show a friendly fallback (not crash). Wrap layout or root.
- Backend: Add a catch-all error handler for API routes (Next.js already does, but ensure it doesn't leak details). For unhandled promise rejections, log but return 500.
- Ensure no error response includes stack traces in production (check `NODE_ENV=production` behavior).
```

### Prompt 5.4 – Check what failed requests reveal
```
Test each API endpoint with bad data:
- Invalid ID (non-existent UUID)
- Missing required fields
- Wrong data types
- Expired session token
- Unauthorized access (wrong tenant)

For each, show the exact error response a client would see. Flag any that reveal internal details like table names, column names, file paths, or stack traces.
```

---

## 6. Injection Attacks (SQL, XSS, CSRF)

**Why it matters:**  
Hotel Etuna uses Drizzle ORM with parameterized queries – good for SQL injection. But XSS could occur in reviews or guest names if not escaped. CSRF could affect state-changing endpoints if cookies aren't protected.

### Prompt 6.1 – Check for SQL injection vulnerabilities
```
Review all database queries in Hotel Etuna. Drizzle is parameterized, but check for any raw SQL execution using `sql` tagged template literals with user input concatenation. Look for:
- `db.execute(sql`...${userInput}...`)` – unsafe
- Any string concatenation inside `sql` fragments
- Edge cases in `lib/services/*` where raw queries might be built.

Ensure every query uses Drizzle's parameterized API or `sql` with placeholders (`${param}` is safe as long as param is a value, not a fragment). List any unsafe patterns.
```

### Prompt 6.2 – Check for XSS vulnerabilities
```
Review every place where user-generated content is displayed:
- Guest reviews on landing page (`app/page.tsx` review section)
- Guest names in folio, receipts, admin panels
- Partner property descriptions on `/partners/[slug]`
- Any content from database that came from user input.

React escapes by default, but check for:
- Use of `dangerouslySetInnerHTML`
- Direct DOM manipulation (e.g., `innerHTML`)
- Unescaped output in email templates (Sofia emails)
- Any place where we inject HTML from CMS or user input.

Flag any vulnerable spots and fix by escaping or using safe rendering.
```

### Prompt 6.3 – CSRF protection
```
Does Hotel Etuna have CSRF protection? Check:
- Are state-changing requests (POST, PUT, PATCH, DELETE) protected? NextAuth.js includes CSRF protection by default for auth endpoints, but custom API routes need protection.
- Are cookies set with `sameSite='lax'` or `'strict'`? (NextAuth defaults to `lax`, verify)
- For non-auth API routes, consider using CSRF tokens or double-submit cookies.

If missing, add CSRF protection using Next.js built-in or a library like `csrf`. Show me what to change.
```

### Prompt 6.4 – Full injection audit
```
Audit entire Hotel Etuna for injection vulnerabilities:
1. SQL injection: all Drizzle queries safe?
2. XSS: all user content escaped?
3. NoSQL injection? (not using NoSQL)
4. Command injection: any `exec` or `spawn` with user input? (check `lib/integrations/*`, scripts)
5. Path traversal: file uploads and downloads? (Adumo webhook maybe)
6. LDAP injection? (none)
List any found and fix.
```

### Prompt 6.5 – Protect against DOM-based XSS
```
Review client-side JavaScript (frontend components, `components/` , any `useEffect` that reads from `window.location` or URL params). Check for:
- Reading `window.location.hash` or `searchParams` and writing to DOM with `innerHTML` or `dangerouslySetInnerHTML`
- Using `eval()` with user input
- Dynamically creating script tags

Fix any instances.
```

### Prompt 6.6 – Protect against open redirects
```
Check every redirect in Hotel Etuna:
- Login redirect (`?redirect=`) – does it validate the redirect URL?
- After payment success/failure redirects (Adumo returns to `/payment/success?redirect=`)
- Any custom redirect logic.

Add a whitelist of allowed destinations (relative paths only, no external URLs unless explicitly allowed). Reject any redirect URL that points to a different domain or uses `javascript:`.
```

**Tip:** Quick XSS test – try submitting a review with `<script>alert('XSS')</script>`. If an alert pops up when viewing the review, you have an XSS vulnerability.

---

## 7. File Upload Security

**Why it matters:**  
Hotel Etuna allows file uploads for:
- Property images (via CMS, Vercel Blob)
- Partner property images
- Guest profile pictures (if implemented)
- Document uploads for compliance (KYC)

### Prompt 7.1 – Audit all file upload endpoints
```
Review every file upload feature in Hotel Etuna:
- `POST /api/cms/media` (property images)
- Partner image uploads (`/api/partner/media` maybe)
- Any other upload endpoints.

For each, tell me:
1. What file types are allowed?
2. Is validation by extension only or by content (magic bytes)?
3. File size limit? (should be ≤5MB for images)
4. Where are files stored? (Vercel Blob, local disk?)
5. Are filenames sanitized? (no path traversal like `../../../etc/passwd`)
6. Are scanned for malicious content?
List missing protections.
```

### Prompt 7.2 – Add proper file validation
```
For all file uploads, add:
- Validate actual content type by reading file header (magic bytes), not just extension. Use `file-type` library or similar.
- Max file size: 5MB for images, 10MB for documents.
- Allowed types: only `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- Reject double extensions (`file.php.jpg`).
- Strip metadata from images (EXIF) using `sharp`.
- Generate a new random filename for every upload – never trust original filename.
```

### Prompt 7.3 – Secure file storage
```
Review where uploaded files are stored. Currently using Vercel Blob – ensure:
- Files are not publicly accessible via direct URL without authentication (unless intended, like public property images). Vercel Blob allows public URLs – that's fine for property photos, but ensure no sensitive documents are publicly exposed.
- For sensitive documents (KYC), serve through an API endpoint that checks permissions.
- Set `Content-Disposition: attachment` for downloads to prevent execution.
```

### Prompt 7.4 – Scan uploads for malicious content
```
Add scanning for uploaded files:
- For images: re-encode using `sharp` – this strips any embedded scripts.
- For PDFs: use a library to check for JavaScript or embedded forms.
- Log all upload attempts with user ID, IP, file name, result.
- Reject any file that cannot be safely processed.
```

### Prompt 7.5 – Prevent denial-of-service via uploads
```
Add protections:
- Set max file size at server/middleware level (Vercel has limits, but also in code).
- Limit number of uploads per user per minute (rate limit).
- Process uploads asynchronously for large files (Vercel Blob is async by nature).
- Add timeout limits.
Show me where each limit is implemented.
```

**Tip:** Try uploading a `.txt` file renamed to `.jpg`. If accepted, your validation is extension-only – fix it by checking actual MIME type.

---

## 8. Rate Limiting & Brute Force

**Why it matters:**  
Hotel Etuna has rate limits on partner invite (5/hr) and some public APIs (100/min/IP), but login, signup, password reset, and payment endpoints need limits.

### Prompt 8.1 – Add rate limiting to login
```
Add rate limiting to `/api/auth/login` (or NextAuth's internal login). After 5 failed attempts from same IP, block further attempts for 15 minutes. After 10 failed attempts for same account (regardless of IP), lock the account and require email verification to unlock. Return same error message for wrong username and wrong password: "Invalid email or password".
```

### Prompt 8.2 – Add rate limiting to API endpoints
```
Add rate limiting to all API endpoints using a consistent middleware. Set limits:
- Authentication endpoints (login, signup, password reset): 5-10 per minute per IP
- Read endpoints (GET /api/bookings, /api/rooms, etc.): 100 per minute per user/IP
- Write endpoints (POST /api/bookings, PATCH /api/guest/stays/*/settle): 30 per minute per user
- File upload: 10 per minute per user
- Payment initiation: 5 per minute per user (critical)

Use `lib/utils/rate-limit.ts` or a package like `upstash-ratelimit` with Redis or in-memory (Vercel edge compatible). Return 429 Too Many Requests with Retry-After header.
```

### Prompt 8.3 – Protect signup and password reset
```
Add abuse protection:
- Signup: limit to 3 accounts per IP per hour; add email verification before account active; add honeypot field (hidden CSS) to catch bots.
- Password reset: limit 3 requests per email per hour; don't reveal if email exists; rate limit the reset token verification endpoint to prevent brute-force on tokens.
```

### Prompt 8.4 – Add account lockout with notification
```
After too many failed login attempts for a specific account, temporarily lock. Send email to the account owner: "Someone tried to log into your account multiple times. If this wasn't you, please change your password." Include time, approximate location (from IP), and direct link to change password. Unlock automatically after 30 minutes or when user clicks email link.
```

### Prompt 8.5 – Protect expensive operations
```
Identify endpoints that trigger expensive or paid operations:
- Sofia AI chat (`/api/sofia/chat`) – costs per LLM call
- Email sending (SMTP) – may have limits
- Database heavy queries (e.g., analytics reports)

Add specific rate limits: AI chat: 20 requests per minute per user; email: 10 per hour per user. These limits are critical to avoid bill shock.
```

**Tip:** Use Vercel's Edge Config or Upstash Redis for distributed rate limiting. For development, an in-memory store works but resets on deploy.

---

## 9. HTTPS & Transport Security

**Why it matters:**  
Vercel handles HTTPS certificates, but we must enforce it in code and add security headers.

### Prompt 9.1 – Check for HTTPS enforcement
```
Review Hotel Etuna for HTTPS issues:
1. Does Next.js redirect HTTP to HTTPS? (Vercel does by default, but verify `next.config.ts` no `http` flag)
2. Are all API calls using `https://` URLs? Check hardcoded URLs in `lib/config/*`, `lib/integrations/*`
3. Are external resources (fonts, images, scripts) loaded over HTTPS?
4. Is HSTS header set? (Vercel can set it via `vercel.json`)
5. Are WebSocket connections (if any) using `wss://`?

Fix any `http://` references, especially in environment variables (e.g., `NEXTAUTH_URL` must be https).
```

### Prompt 9.2 – Fix mixed content issues
```
Scan all frontend code, CSS, and HTML for resources loaded over plain HTTP. Use browser DevTools (Console) to identify mixed content warnings. Change any `http://` to `https://` or use protocol-relative URLs (//). Pay special attention to images loaded from CMS that might have stored `http://` URLs.
```

### Prompt 9.3 – Add security headers
```
Add these HTTP security headers to every response (in `next.config.ts` or `middleware.ts`):
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforce HTTPS for a year)
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://*.vercel.app; ...` (customize based on app needs)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Show me how to add these to Next.js middleware.
```

### Prompt 9.4 – Secure cookie transport
```
Review all cookies set by Hotel Etuna:
- `next-auth.session-token`
- Any custom cookies (e.g., for session)

Ensure each has: `Secure` (only sent over HTTPS), `HttpOnly` (not accessible by JS), `SameSite=Lax` or `Strict`. Also check that no sensitive data is stored in cookies (should only hold session reference).
```

**Tip:** Vercel automatically sets HSTS if you add it to `vercel.json`. For CSP, start with a relaxed policy and tighten over time.

---

## 10. Data Privacy & PII Handling

**Why it matters:**  
Hotel Etuna collects guest names, emails, phone numbers, addresses, and payment information. Must comply with GDPR (for EU guests) and POPIA (South Africa/Namibia). Also subject to Bank of Namibia PSD-12 for payment data.

### Prompt 10.1 – Map all personal data
```
Create an inventory of every place Hotel Etuna collects, stores, or transmits personal data (PII). For each, list:
- Data type (name, email, phone, address, ID number, payment info)
- Where collected (form, API endpoint)
- Where stored (database table/column, log file, cache)
- Who can access it (roles, systems)
- Is it encrypted at rest? (Neon encryption at rest, but also application-level?)
- Is it encrypted in transit? (HTTPS)
- Retention period
- Deletion mechanism

Include: `guests` table, `bookings` (guest name, email), `guest_profiles`, `users` (staff), `audit_trail` (may contain PII), logs, and any third-party services (Adumo, Voyage, Qdrant).
```

### Prompt 10.2 – Minimize data collection
```
Review each form and data collection point. Ask: do we really need each field?
- Remove any optional fields that are not strictly necessary.
- For necessary fields, consider storing less sensitive versions (e.g., last 4 digits of phone, hashed email for analytics).
- Never collect more than needed.
```

### Prompt 10.3 – Encrypt sensitive data at rest
```
Check how sensitive data is stored in Neon:
- Passwords are hashed with bcrypt (good)
- Payment card data? Hotel Etuna never stores full PAN (Adomo Virtual handles it) – verify no accidental storage.
- Guest government ID if collected for KYC? Must be encrypted at application level (AES-256) or stored in a separate encrypted volume.
- Encryption keys must be stored separately (environment variables or KMS).

Ensure that any table with PII (except email/name which are less sensitive) is encrypted or has column-level encryption.
```

### Prompt 10.4 – Add user data deletion endpoint
```
Implement a GDPR/POPIA-compliant data deletion endpoint:
- `DELETE /api/guest/account` – deletes the guest's account and all associated data.
- Must cascade delete: `guests` -> `bookings` (anonymize or delete? retention laws may require keeping for 5-7 years for tax – need legal advice). For now, implement soft delete or anonymization.
- Remove files from Vercel Blob.
- Remove from logs and analytics (or mark as deleted).
- Send confirmation email.
- Log the deletion for audit.

This is required by law for EU guests.
```

### Prompt 10.5 – Add data export (portability)
```
Implement data export endpoint: `GET /api/guest/export` that returns a JSON or CSV file containing all guest's data:
- Profile (name, email, phone, preferences)
- Booking history (dates, room types, amounts, but not payment card details)
- Reviews written
- Loyalty points

Exclude other guests' data and internal system fields.
```

**Tip:** Even if not legally required, following these principles builds trust. Update privacy policy to explain what data you collect and why.

---

## 11. Insecure Configuration & Defaults

**Why it matters:**  
Development defaults can be dangerous in production: debug mode, CORS wildcard, exposed admin panels, test accounts.

### Prompt 11.1 – Production readiness check
```
Is Hotel Etuna configured for production? Check:
- Debug mode: Is `NODE_ENV=production`? (Vercel sets this)
- CORS: Are API endpoints accepting requests from all origins (`*`)? Review `proxy.ts` and any `cors()` middleware. Should only allow `https://hoteletuna.com` and maybe staging domain.
- Database: Is Neon database publicly accessible? (Neon endpoints are public but require auth – fine. Ensure no overly permissive security group.)
- Default credentials: Are there any test accounts still in the database? (e.g., `Test1234!` for partners – must be removed in production or disabled.)
- Error verbosity: Are detailed errors sent to client? (We sanitize, but double-check.)
- Vercel environment: Are preview deployments isolated from production data?
List everything that needs to change.
```

### Prompt 11.2 – Lock down CORS
```
Review CORS configuration in `next.config.ts`, `middleware.ts`, or `proxy.ts`. If any endpoint allows `Access-Control-Allow-Origin: *`, restrict to `https://hoteletuna.com` (and maybe `https://*.vercel.app` for previews). Also ensure that only necessary HTTP methods are allowed (GET, POST, PATCH, DELETE – not OPTIONS or TRACE). Do not allow credentials with wildcard origin.
```

### Prompt 11.3 – Database security review
```
Review Neon database configuration:
- Is the database publicly accessible? (Yes, with password – that's fine as long as password is strong and not leaked.)
- Are there any default or weak passwords? (Ensure `DATABASE_URL` uses a strong password.)
- Is SSL required? Neon enforces SSL by default.
- Is row-level security enabled? Yes, we have RLS policies. Verify they are active.
- Are there any overly permissive policies? (e.g., a policy that allows all reads for hub tenant? That's intended.)
- Are backups encrypted? (Neon does this.)
```

### Prompt 11.4 – Remove development artifacts
```
Scan the entire project for things that should not be in production:
- Test accounts in database (e.g., partner demo accounts) – disable or remove.
- Debug routes: `/api/debug/auth` – already returns 404 in production, but ensure it's not accessible.
- API documentation endpoints (like `/api-docs` or `/swagger`) – if any, disable or password-protect.
- `TODO` comments mentioning security or temporary fixes.
- Test API keys in `.env.example` – those are just placeholders, fine.
- Development-only middleware (e.g., logging every request).
```

---

## 12. Outdated & Vulnerable Dependencies

**Why it matters:**  
Dependencies can have known vulnerabilities. Hotel Etuna uses many packages (Next.js, Drizzle, etc.). Regular updates are critical.

### Prompt 12.1 – Run a security audit
```
Run `npm audit --audit-level=critical` on the Hotel Etuna codebase. List every critical and high vulnerability, its package, and the fixed version. Then apply safe fixes using `npm audit fix` for non-breaking changes. For any that require major version upgrades, tell me what might break (e.g., Next.js 15 to 16).
```

### Prompt 12.2 – Check for abandoned packages
```
Review all dependencies in `package.json`. Flag any package where:
- Last update was more than 12 months ago
- GitHub repo is archived or inactive
- Known vulnerabilities with no fix available

For each flagged package, suggest a well-maintained alternative.
```

### Prompt 12.3 – Safe update strategy
```
Create a plan to update dependencies safely. Update one package at a time, starting with those with security vulnerabilities. After each update, run `npm test` and manual smoke test for affected features. If something breaks, provide rollback instructions. Do not update everything at once.
```

### Prompt 12.4 – Lock down dependency versions
```
Review `package.json` – are versions pinned (exact) or using ranges (^, ~)? For production, pin to exact versions (remove ^). Ensure `package-lock.json` is committed to Git. Also check for any dependencies installed from Git URLs or tarballs – those could be tampered with.
```

### Prompt 12.5 – Scan transitive dependencies
```
List all transitive dependencies (packages that direct dependencies depend on) that are flagged as vulnerable. Use `npm ls --all` to see the tree. Fix by updating the direct dependency or using `overrides` in `package.json` to force a patched version.
```

**Tip:** Enable GitHub Dependabot for your repository. It automatically creates PRs for vulnerable dependencies.

---

## 13. Logging, Monitoring & Audit Trails

**Why it matters:**  
Without logging, you can't detect or investigate breaches. Hotel Etuna has an `audit_trail` table, but need to ensure it logs the right events and is monitored.

### Prompt 13.1 – Add security event logging
```
Add logging for these security-relevant events to `audit_trail` table (or a dedicated log stream):
- All login attempts (successful and failed) – with timestamp, IP, user agent, user ID
- All failed authorization attempts (403 responses) – include attempted resource
- All account changes (password change, email change, role change)
- All admin actions (partner invite, platform billing changes, system settings)
- All data exports or bulk data access (e.g., admin viewing all guests)
- All API errors above a threshold (e.g., 5xx errors)

Store logs in a secure location (audit_trail table with RLS) that cannot be modified by attackers who compromise the app (append-only).
```

### Prompt 13.2 – Set up alerts for suspicious activity
```
Add monitoring alerts for:
- More than 10 failed login attempts for a single account in 5 minutes
- Single IP making requests to more than 50 different guest accounts
- Bulk data access (e.g., API call that returns >100 records in one response)
- Login from a new country or unusual IP for an existing user
- Multiple password reset requests in a short period
- Any 403 or 401 errors above baseline (e.g., >10 per minute)

Send alerts via email (to admin) or integrate with Slack using webhook. Use Vercel Logs or a service like Sentry to detect anomalies.
```

### Prompt 13.3 – Create an audit trail for sensitive data
```
For sensitive data modifications, add audit trail entries:
- Who accessed or modified guest PII (name, email, phone)
- Who changed booking status (e.g., front desk staff)
- Who approved a review (admin)
- Previous value and new value for critical fields

Use `audit_trail` table with columns: `user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `timestamp`. Ensure this table has RLS but is readable by auditors.
```

### Prompt 13.4 – Set up application health monitoring
```
Configure health monitoring:
- Track error rate – alert if >5% of requests return 5xx
- Monitor response times – alert if p95 latency exceeds 2 seconds
- Uptime monitoring – use UptimeRobot or Vercel Analytics
- Database connection pool usage – alert if near limit

Use free tools: Sentry (error tracking), UptimeRobot (uptime), Vercel Analytics (performance). Set up a status page (optional).
```

### Prompt 13.5 – Ensure logs don't leak sensitive data
```
Review all logging statements (console.log, logger.info, etc.) and audit_trail entries. Ensure they never contain:
- Passwords or password hashes (even hashed – don't log)
- Full API keys or tokens (redact to first/last 4 chars)
- Credit card numbers or full PAN (should not be stored anyway)
- Session tokens or authentication cookies
- Full request bodies that include PII (redact email, name, etc.)

Replace sensitive values with redacted versions (e.g., `email: "u***@example.com"`). Ensure log files are not publicly accessible.
```

**Tip:** Start with logging to `audit_trail` table and use Vercel Logs for real-time monitoring. You can later add a service like Logtail or Better Stack.

---

## 14. The Master Security Review (Run After Every Feature)

**This is the most important prompt. Run it after every meaningful feature you build for Hotel Etuna.**

```
I just finished building [describe the feature, e.g., "guest room service ordering"].

Review only the new code for security issues. Check each of these specifically:

1. Are there permission checks on every endpoint – both authentication (is the user logged in?) and authorization (are they allowed to access this specific resource)? For guest features, verify email match with booking.

2. Are there any hardcoded secrets, API keys, or tokens?

3. Is user input validated on the backend, not just the frontend? Use Zod or similar.

4. Are error messages safe – no stack traces, file paths, database details exposed to the client?

5. Is all user-generated content sanitized before being stored or displayed? (No `dangerouslySetInnerHTML` without sanitization.)

6. Are database queries using parameterized queries (Drizzle does this by default, but check for raw SQL)?

7. If there are file uploads, are they validated (content type, size, magic bytes) and stored securely (random filename, not executable)?

8. Is there rate limiting on any endpoint that could be abused (e.g., order submission, payment initiation)?

9. Are there any CSRF vulnerabilities in state-changing operations? (Check if cookies have SameSite, or add tokens.)

10. Is sensitive data encrypted and not over-exposed in API responses? (Don't return internal IDs or internal flags.)

Flag everything you find, fix it, and then tell me what you changed and why.
```

### Why run it twice?
When the AI fixes one issue, it sometimes introduces a new pattern that has its own vulnerability. Run the master prompt again until it comes back clean.

---

## 15. Deployment Pre-Flight (Before Going Live)

**Run this comprehensive review before any production deployment.**

```
I'm about to deploy Hotel Etuna to production (Vercel). Do a comprehensive security review of the entire codebase. Check:

1. All secrets are in environment variables (Vercel project settings) – not in code. Verify no `.env` committed.

2. All user input is validated on the backend (no reliance on frontend).

3. All database queries use parameterized queries (Drizzle ORM is safe, but check raw SQL).

4. All API endpoints have authentication and authorization checks. Guest endpoints verify ownership. Admin endpoints verify role.

5. Error messages don't expose internal details (stack traces, file paths, database schema). Use `sanitizeErrorDetails`.

6. CORS is locked to `https://hoteletuna.com` (and maybe staging domains) – not `*`.

7. Debug mode is off (`NODE_ENV=production`). No debug routes accessible.

8. All cookies have `Secure`, `HttpOnly`, `SameSite` flags.

9. HTTPS is enforced (Vercel does this, but check any hardcoded HTTP URLs).

10. Rate limiting is in place on login, signup, password reset, and sensitive API endpoints (payments, orders).

11. File uploads are validated (type, size, magic bytes) and stored securely (Vercel Blob with random names). No executable files accepted.

12. Dependencies have no known critical vulnerabilities (`npm audit` returns 0 critical).

13. No test credentials, dummy data, or development artifacts remain (e.g., test users in database, debug endpoints).

14. Tenant isolation (RLS) is active and verified by `scripts/db/verify-tenant-rls.ts`.

15. Audit logging is enabled for security events (login attempts, permission failures, admin actions).

Give me a pass/fail for each item and fix anything that fails.
```

---

## Appendix: Quick Questions to Ask Yourself for Every Feature

1. **Who is allowed to use this?** Does my code actually check? (Auth + authz)
2. **What happens if someone types weird input?** (Validation + sanitization)
3. **What sensitive data am I touching?** Is it stored, sent, and shown safely? (Encryption, redaction)
4. **Am I using secure defaults?** Or did I keep whatever the AI gave me? (CORS, headers, cookies)
5. **If someone tried to abuse this, what would they do first?** (Rate limiting, brute force)
6. **Would I know if something went wrong?** (Logging, monitoring, alerts)

---

**End of Security Prompt Pack for Hotel Etuna.**  
Use these prompts regularly. Security is not a one-time checklist – it's a continuous process.