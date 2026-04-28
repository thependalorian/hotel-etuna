/**
 * Database Module - Main Export
 * 
 * Purpose: Central export for all database operations
 * Location: /lib/db/index.ts
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

// Export database instance
export { db, setTenantContext, clearTenantContext, healthCheck, getDatabaseStats, executeRawSql, sql } from './connection';

// Export all schema tables
export * from './schema';
export * from './rows';

// Re-export Drizzle ORM utilities
export { eq, and, or, not, isNull, isNotNull, inArray, notInArray, exists, notExists, gte, lte, lt, gt, sql as rawSql } from 'drizzle-orm';
export { desc, asc } from 'drizzle-orm';
