/**
 * Security Logger Utility
 *
 * Purpose: Types and barrel exports for security logging (server + client-safe logger).
 * Location: /lib/utils/security-logger.ts
 */

import { serverLogger } from '@/lib/utils/server-logger';

export type SecurityEventType =
  | 'unauthorized_access'
  | 'rate_limit_exceeded'
  | 'invalid_credentials'
  | 'session_expired'
  | 'tenant_access_denied'
  | 'role_access_denied'
  | 'api_error'
  | 'suspicious_activity';

const clientNoOpLogger = {
  info: (_message: string, _details?: unknown) => {},
  warn: (_message: string, _details?: unknown) => {},
  error: (_message: string, _details?: unknown) => {},
  debug: (_message: string, _details?: unknown) => {},
};

/** Server routes get structured logs; client bundles get a no-op. */
export const securityLogger =
  typeof window === 'undefined' ? serverLogger : clientNoOpLogger;
