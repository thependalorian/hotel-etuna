/**
 * Database Connection - Single source (Drizzle)
 *
 * Purpose: Re-export Drizzle db from lib/db. Use db from '@/lib/db' for all queries.
 * Location: /lib/database/connection.ts
 *
 * Application code (services, API routes, cron) uses Drizzle only.
 * Scripts in scripts/ and tests/seed/ that still referenced prisma must use
 * db and executeRawSql from '@/lib/db' (or this module). See DRIZZLE_MIGRATION.md.
 *
 * @version 2.0.0
 * @since February 2026
 */

export { db, sql, executeRawSql, healthCheck, getDatabaseStats } from '@/lib/db/connection';
export type { DbStats } from '@/lib/db/connection';
