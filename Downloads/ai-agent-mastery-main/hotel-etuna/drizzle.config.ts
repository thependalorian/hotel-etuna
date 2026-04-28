/**
 * Drizzle Kit Configuration
 * 
 * Purpose: Configure Drizzle Kit for migrations and schema management
 * Location: /drizzle.config.ts
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './database/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
