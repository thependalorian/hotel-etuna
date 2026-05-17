# Hotel Etuna Scripts

## Production Scripts

These scripts are intended for production use and maintenance:

### Database Seeding
- **`seed-hotel-etuna.ts`** - Main production seeding script for Hotel Etuna hub tenant
  - Seeds property, rooms, restaurant, menu, staff, reviews, partners
  - Usage: `npx tsx scripts/seed-hotel-etuna.ts`

- **`seed-partners.ts`** - Seed partner tenants (JayLa, Aquarius)
  - Creates partner properties, rooms, and accounts
  - Usage: `npx tsx scripts/seed-partners.ts`

### Knowledge Base & RAG
- **`ingest-hotel-etuna-knowledge.ts`** - Ingest knowledge base for Sofia AI RAG
  - Chunks and embeds documentation
  - Uploads to Qdrant vector database
  - Usage: `npx tsx scripts/ingest-hotel-etuna-knowledge.ts`

### System Verification
- **`verify-system-design.js`** - Verify system design compliance
  - Checks DRY violations, security patterns
  - Usage: `node scripts/verify-system-design.js`

### Development Utilities
- **`clean-dev-cache.mjs`** - Clean Next.js development cache
  - Removes .next directory and node_modules/.cache
  - Usage: `node scripts/clean-dev-cache.mjs`

### Database Management
- **`db/`** - Database-related scripts
  - `verify-db.ts` - Schema/table smoke checks (`npm run test:db`)
  - `verify-tenant-rls.ts` - Verify RLS policies (`npm run test:db:rls`)
  - `verify-neon-migrations.ts` - Migration parity (`npm run test:db:migrations`)
  - `audit-neon-baseline.ts` - Neon baseline audit (`npm run db:audit:neon`)

### Environment & Vercel
- **`check-env-local.mjs`** — Audit `.env.local` vs `.env.example` (`npm run env:check`)
- **`sync-env-local.mjs`** — Append missing keys from example (`npm run env:sync`)
- **`push-env-to-vercel.mjs`** — Push `.env.local` secrets to linked Vercel project (`npm run env:push-vercel`). Applies production Adumo redirect/webhook URLs. **Never commit `.env.local` or `.env.vercel`.**

### Other production / ops scripts
- **`provision-platform-admin.ts`** - Create Buffr platform admin users
- **`security/run-preflight.ts`** - Pre-deploy security checks (`npm run security:preflight`)
- **`seed-menu-images.ts`**, **`validate-menu-images.ts`** - Menu image pipeline
- **`soc2/`**, **`compliance/`** - Evidence collection

Obsolete one-off debug/migration scripts were removed (May 2026); use Vitest/Playwright and `scripts/db/*` instead.

## Usage Guidelines

1. **Before running any script**, ensure environment variables are set:
   ```bash
   # Required
   DATABASE_URL=...
   HUB_TENANT_ID=...
   DEFAULT_PROPERTY_ID=...
   ```

2. **Seeding scripts** should be run once per environment:
   ```bash
   npx tsx scripts/seed-hotel-etuna.ts
   npx tsx scripts/seed-partners.ts
   ```

3. **RAG ingestion** requires Qdrant Cloud Inference (384d):
   ```bash
   QDRANT_URL=https://your-cluster.us-west-2-0.aws.cloud.qdrant.io
   QDRANT_API_KEY=...
   RAG_USE_QDRANT_INFERENCE=true
   QDRANT_INFERENCE_MODEL=intfloat/multilingual-e5-small
   QDRANT_INFERENCE_DIMENSIONS=384
   HUB_TENANT_ID=...
   npm run rag:seed
   ```

4. **Verification scripts** can be run anytime:
   ```bash
   node scripts/verify-system-design.js
   npx tsx scripts/db/verify-tenant-rls.ts
   ```

## Maintenance

- Keep only production-ready scripts in `scripts/` (no archive folder)
- Prefer Vitest (`tests/`) and Playwright (`e2e/`) over ad-hoc test scripts
- Document purpose and usage for all scripts in this README
