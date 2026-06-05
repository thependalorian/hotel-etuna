/**
 * Client-safe Security Logger
 *
 * Purpose: Provide a no-op security logger for client components
 * to avoid bundling server-only modules (pg, drizzle, etc.)
 * Location: /lib/utils/security-logger.client.ts
 */

export const securityLogger = {
  info: (_message: string, _details?: unknown) => {
    // No-op in client components
  },
  warn: (_message: string, _details?: unknown) => {
    // No-op in client components
  },
  error: (_message: string, _details?: unknown) => {
    // No-op in client components
  },
  debug: (_message: string, _details?: unknown) => {
    // No-op in client components
  },
};
