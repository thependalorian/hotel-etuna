/**
 * Server Logger
 *
 * Purpose: Structured logging for server-side code (API routes, middleware, cron).
 * Location: /lib/utils/server-logger.ts
 *
 * Dev: readable console output. Production: JSON lines without PII payloads.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = /password|secret|token|authorization|cookie|api[_-]?key/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.test(key)) {
    return '[redacted]';
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return redactDetails(value as Record<string, unknown>);
  }
  return value;
}

function redactDetails(details: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

function formatPayload(level: LogLevel, message: string, details?: unknown): string | Record<string, unknown> {
  const payload: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details !== undefined) {
    payload.details =
      details && typeof details === 'object' && !Array.isArray(details)
        ? redactDetails(details as Record<string, unknown>)
        : details;
  }

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(payload);
  }

  return payload;
}

function write(level: LogLevel, message: string, details?: unknown): void {
  const formatted = formatPayload(level, message, details);

  if (process.env.NODE_ENV === 'production') {
    const line = typeof formatted === 'string' ? formatted : JSON.stringify(formatted);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
    return;
  }

  const prefix = `[${level.toUpperCase()}]`;
  if (details !== undefined) {
    console.log(prefix, message, formatted);
  } else {
    console.log(prefix, message);
  }
}

export const serverLogger = {
  info: (message: string, details?: unknown) => write('info', message, details),
  warn: (message: string, details?: unknown) => write('warn', message, details),
  error: (message: string, details?: unknown) => write('error', message, details),
  debug: (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      write('debug', message, details);
    }
  },
};
