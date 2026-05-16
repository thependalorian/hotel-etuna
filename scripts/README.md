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
  - `verify-tenant-rls.ts` - Verify RLS policies
  - `verify-billing-security.ts` - Verify billing security

## Archived Scripts

Ad-hoc debugging, testing, and migration scripts have been moved to `scripts/archive/`:

- **Test scripts** - `test-*.ts`, `test-*.sh`, `test-routes.js`
- **Debug scripts** - `debug-*.ts`
- **Migration scripts** - `run-*-migration.ts`
- **Setup scripts** - `setup-*.ts`
- **One-time utilities** - Various db verification and creation scripts

These are kept for reference but should not be used in production.

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

3. **RAG ingestion** requires additional environment variables:
   ```bash
   VOYAGE_API_KEY=...
   QDRANT_URL=...
   QDRANT_API_KEY=...
   EMBEDDING_MODEL=voyage-3
   EMBEDDING_DIMENSIONS=1024
   ```

4. **Verification scripts** can be run anytime:
   ```bash
   node scripts/verify-system-design.js
   npx tsx scripts/db/verify-tenant-rls.ts
   ```

## Maintenance

- Keep only production-ready scripts in root `scripts/`
- Move ad-hoc/debug scripts to `scripts/archive/`
- Document purpose and usage for all scripts
- Remove obsolete scripts after 6 months in archive
