/**
 * Development-only logging — avoid credential noise in production logs.
 * Location: lib/utils/dev-log.ts
 */

export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

export function devError(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}
