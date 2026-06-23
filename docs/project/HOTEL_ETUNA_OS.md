# Hotel Etuna — Single-Property Operating System

**Canonical product doc:** [`PRD.md`](./PRD.md) · **Architecture:** [`PLANNING.md`](./PLANNING.md) · **Tracker:** [`TASK.md`](./TASK.md)

**Last updated:** 2026-06-22

---

## What this is

Hotel Etuna is the **operating system for one flagship property** in Ongwediva, Namibia — not a multi-tenant Buffr Host SaaS signup. The public site (`https://www.hoteletuna.com`) is the guest and staff surface; **referral partner listings** (JayLa, Aquarius) share the same domain with strict tenant RLS and **no Sofia AI**.

| Layer | Role |
|-------|------|
| **Hub tenant** | Hotel Etuna — PMS, folio, F&B, Sofia concierge, payroll, compliance |
| **Partner tenants** | Self-service listings + commission; no AI/CRM |
| **Platform admin** | `@buffr.ai` Buffr Hub console for billing and cross-tenant ops |

---

## Brand & copy spine

| File | Purpose |
|------|---------|
| `docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf` | Official corporate identity (colors, typography, logo variants) |
| `lib/copy/brand.ts` | Legal name, trade name, tone, CI colors, logo asset paths |
| `lib/copy/public.ts` | Marketing strings |
| `lib/copy/contact-emails.ts` | `frontdesk@hoteletuna.com`, etc. |
| `lib/config/platform-console.ts` | Platform admin labels |
| `lib/utils/public-app-url.ts` | Canonical `https://www.hoteletuna.com` |

**Intentional Buffr references:** platform admin auth (`@buffr.ai`), Buffr ↔ Etuna B2B platform billing — not guest-facing SaaS positioning.

---

## Payments (Namibia)

| Rail | Scope |
|------|--------|
| **Adumo Virtual** | Card checkout (SAQ A — hosted page) |
| **NamQR v5** | Desk + guest folio (`HospitalityNamQrPaymentService`) |
| **Cash / manual EFT** | Folio settlement |
| **Open banking PIS** | Sandbox BoN routes + guest folio panel |

**Not in scope:** Stripe, RealPay, e-money issuance, licensed PSP.

Settlement account: Nedbank `11000481744` (`lib/platform/settlement-accounts.ts`).

---

## Data & migrations

- **ORM:** Drizzle — `lib/db/schema.ts` (~113 tables)
- **Migrations:** `database/drizzle/0000`–`0064` — index in [`MIGRATION_MASTER.md`](./MIGRATION_MASTER.md)
- **Apply:** `npm run db:migrate:all` · **Verify:** `npm run test:db:migrations`

---

## Loyalty

Loyalty tiers and earn/burn are **hub-exclusive** (flagship property guests only). Partners do not receive loyalty programme access.

---

## Refactor log (2026-06-11)

DRY/KISS audit execution (see [`docs/audit/CODEBASE_AUDIT_2026-06-10.md`](../audit/CODEBASE_AUDIT_2026-06-10.md)):

- Night audit VAT now uses `computeNightAuditTariffCharges` from `lib/platform/namibia-tax.ts` (replaces hardcoded 15%).
- Cron routes share `lib/utils/cron-auth.ts` (`verifyCronRequest`).
- This file created to fix broken README / Archon links.

**Not removed (active features):** `fnb_print_jobs`, hospitality domain naming, `HospitalityNamQrPaymentService`.
