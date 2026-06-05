/**
 * Development-only logging — avoid credential noise in production logs.
 * Location: lib/utils/dev-log.ts
 */
import { securityLogger } from '@/lib/utils/security-logger';

export function devLog(message: string, details?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    securityLogger.info(message, details);
  }
}

export function devError(message: string, details?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    securityLogger.error(message, details);
  }
}
