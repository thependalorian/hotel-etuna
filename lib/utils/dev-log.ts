/**
 * Development-only logging — avoid credential noise in production logs.
 * Location: lib/utils/dev-log.ts
 */
import { serverLogger } from '@/lib/utils/server-logger';

export function devLog(message: string, details?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    serverLogger.info(message, details);
  }
}

export function devError(message: string, details?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    serverLogger.error(message, details);
  }
}
