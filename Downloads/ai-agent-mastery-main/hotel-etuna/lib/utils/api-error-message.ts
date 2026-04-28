/**
 * Normalize API error messages for UI (toasts, alerts)
 * Location: lib/utils/api-error-message.ts
 */

export function messageFromApiBody(body: unknown, fallback: string): string {
  if (body === null || body === undefined) {
    return fallback;
  }
  if (typeof body === 'string' && body.length > 0 && body.length < 500) {
    return body;
  }
  if (typeof body !== 'object') {
    return fallback;
  }
  const b = body as Record<string, unknown>;
  if (typeof b.error === 'string' && b.error.length > 0) {
    return b.error;
  }
  if (b.error && typeof b.error === 'object' && b.error !== null) {
    const e = b.error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
  }
  if (typeof b.message === 'string') return b.message;
  if (Array.isArray(b.errors) && b.errors.every((x) => typeof x === 'string')) {
    return (b.errors as string[]).join(', ');
  }
  return fallback;
}

/** After a failed `fetch`, parse body once and return a user-facing message */
export async function messageFromFailedResponse(
  res: Response,
  fallback = 'Request failed.'
): Promise<string> {
  try {
    const text = await res.text();
    if (!text) {
      return fallbackForStatus(res.status, fallback);
    }
    try {
      const json = JSON.parse(text) as unknown;
      return messageFromApiBody(json, fallbackForStatus(res.status, fallback));
    } catch {
      return text.length < 400 ? text : fallbackForStatus(res.status, fallback);
    }
  } catch {
    return fallbackForStatus(res.status, fallback);
  }
}

export function fallbackForStatus(status: number, generic: string): string {
  switch (status) {
    case 400:
      return 'Invalid request.';
    case 401:
      return 'Sign in again — session may have expired.';
    case 403:
      return 'You do not have permission for this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Try again later.';
    default:
      return generic;
  }
}

export async function rateLimitMessage(res: Response, body?: unknown): Promise<string> {
  let parsedBody = body;
  if (parsedBody === undefined) {
    try {
      const text = await res.text();
      if (text) {
        try {
          parsedBody = JSON.parse(text) as unknown;
        } catch {
          parsedBody = text;
        }
      }
    } catch {
      parsedBody = undefined;
    }
  }
  const base = messageFromApiBody(parsedBody, 'Too many requests');
  const retry = res.headers.get('Retry-After');
  if (retry) {
    return `${base} Retry in ${retry}s.`;
  }
  return base;
}

export function networkErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Network error — check your connection and try again.';
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request was cancelled.';
  }
  if (err instanceof Error && err.message) {
    return err.message.length < 200 ? err.message : 'Something went wrong.';
  }
  return 'Something went wrong.';
}
