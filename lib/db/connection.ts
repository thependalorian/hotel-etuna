/**
 * Database Connection - Drizzle ORM with Neon PostgreSQL
 * 
 * Purpose: Serverless-optimized database connection for Buffr Host
 * Location: /lib/db/connection.ts
 * 
 * Features:
 * - Neon serverless driver for optimal Edge/Vercel performance
 * - Connection pooling built-in
 * - TypeScript type safety with Drizzle ORM
 * - Multi-tenancy support via SET commands
 * - Connection timeout and retry logic for reliability
 * 
 * @version 1.0.1
 * @since January 28, 2026
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';
import { securityLogger } from '@/lib/utils/security-logger';

const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    : process.env.DATABASE_URL;

// Validate DATABASE_URL exists
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Connection timeout configuration (in milliseconds)
const CONNECTION_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create Neon serverless connection with timeout
const createConnection = () => {
  return neon(databaseUrl, {
    fetchOptions: {
      timeout: CONNECTION_TIMEOUT,
    },
  });
};

// Helper function to execute with retries
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      securityLogger.error(`Database attempt ${attempt}/${retries} failed:`, lastError.message);
      
      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw lastError;
}

// Create Neon serverless connection (HTTP driver — best on Vercel serverless)
const sql = createConnection();

// Default to node-postgres everywhere for stability.
// Enable Neon HTTP only with explicit opt-in env var.
// This avoids intermittent Neon HTTP payload parsing failures seen in production.
const useNeonHttpDriver = process.env.USE_NEON_HTTP === '1';

const isNodePostgresRuntime = !useNeonHttpDriver;
const nodePool = isNodePostgresRuntime
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
    })
  : null;

// Create Drizzle instance with schema
export const db = isNodePostgresRuntime && nodePool
  ? drizzleNode(nodePool, { schema })
  : drizzle(sql as never, { schema });

/**
 * Set tenant context for Row-Level Security (RLS)
 * 
 * @param tenantId - UUID of the tenant
 * @returns Promise<void>
 * 
 * @example
 * await setTenantContext('123e4567-e89b-12d3-a456-426614174000');
 * const properties = await db.select().from(schema.properties);
 * // Returns only properties for this tenant (enforced by RLS)
 */
export async function setTenantContext(
  tenantId: string,
  tenantType: 'hub' | 'partner' = 'hub'
): Promise<void> {
  if (isNodePostgresRuntime && nodePool) {
    await nodePool.query(
      "SELECT set_config('app.tenant_id', $1, true), set_config('app.current_tenant_id', $1, true), set_config('app.tenant_type', $2, true)",
      [tenantId, tenantType],
    );
    return;
  }
  await sql`SELECT set_config('app.tenant_id', ${tenantId}, true), set_config('app.current_tenant_id', ${tenantId}, true), set_config('app.tenant_type', ${tenantType}, true)`;
}

/**
 * Clear tenant context (use with caution)
 *
 * @returns Promise<void>
 *
 * @example
 * await clearTenantContext();
 * // Now queries are not tenant-isolated (use only for platform admin)
 */
export async function clearTenantContext(): Promise<void> {
  if (isNodePostgresRuntime && nodePool) {
    await nodePool.query(
      "SELECT set_config('app.tenant_id', '', true), set_config('app.current_tenant_id', '', true), set_config('app.tenant_type', '', true)",
    );
    return;
  }
  await sql`SELECT set_config('app.tenant_id', '', true), set_config('app.current_tenant_id', '', true), set_config('app.tenant_type', '', true)`;
}

/**
 * Execute raw SQL query (for complex operations)
 * 
 * @param query - SQL query string
 * @returns Promise<any[]>
 * 
 * @example
 * const result = await executeRawSql`SELECT * FROM properties WHERE type = ${'hotel'}`;
 */
export const executeRawSql = sql;

/**
 * Health check - Verify database connection
 * 
 * @returns Promise<boolean>
 * 
 * @example
 * const isHealthy = await healthCheck();
 * if (!isHealthy) securityLogger.error('Database connection failed');
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (isNodePostgresRuntime && nodePool) {
      const result = await executeWithRetry(() => nodePool!.query('SELECT NOW() as now'));
      return !!result.rows[0];
    }
    const result = await executeWithRetry(() => sql`SELECT NOW()`);
    return !!result;
  } catch (error) {
    securityLogger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 * 
 * @returns Promise<DbStats>
 * 
 * @example
 * const stats = await getDatabaseStats();
 * securityLogger.info(`Tables: ${stats.tableCount}, Size: ${stats.databaseSize}`);
 */
export interface DbStats {
  tableCount: number;
  databaseSize: string;
  activeConnections: number;
}

export async function getDatabaseStats(): Promise<DbStats> {
  if (isNodePostgresRuntime && nodePool) {
    const tableCountResult = await executeWithRetry(() =>
      nodePool!.query<{ count: string }>(
        "SELECT COUNT(*)::text as count FROM information_schema.tables WHERE table_schema = 'public'",
      ),
    );
    const dbSizeResult = await executeWithRetry(() =>
      nodePool!.query<{ size: string }>(
        'SELECT pg_size_pretty(pg_database_size(current_database())) as size',
      ),
    );
    const connectionsResult = await executeWithRetry(() =>
      nodePool!.query<{ count: string }>(
        "SELECT COUNT(*)::text as count FROM pg_stat_activity WHERE datname = current_database()",
      ),
    );
    return {
      tableCount: Number(tableCountResult.rows[0].count),
      databaseSize: dbSizeResult.rows[0].size,
      activeConnections: Number(connectionsResult.rows[0].count),
    };
  }

  const tableCountResult = await executeWithRetry(() => sql`
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);

  const dbSizeResult = await executeWithRetry(() => sql`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);

  const connectionsResult = await executeWithRetry(() => sql`
    SELECT COUNT(*) as count 
    FROM pg_stat_activity 
    WHERE datname = current_database()
  `);

  return {
    tableCount: Number(tableCountResult[0].count),
    databaseSize: dbSizeResult[0].size as string,
    activeConnections: Number(connectionsResult[0].count),
  };
}

// Export sql instance for direct queries when needed
export { sql };
