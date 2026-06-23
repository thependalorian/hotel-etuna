/**
 * @fileoverview Application error types and service-layer error handling.
 *
 * `AppError` carries an HTTP status code; `handleServiceError` normalizes
 * unknown errors and logs via securityLogger (server only).
 * Location: lib/utils/errors.ts
 */

/** Error with an attached HTTP status code, thrown by services and mapped by API routes. */
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleServiceError = (error: unknown, defaultMessage: string): never => {
  if (error instanceof AppError) {
    throw error;
  }
  if (typeof window === 'undefined') {
    void import('@/lib/utils/security-logger.server').then(({ securityLogger }) => {
      securityLogger.error('Service error', error);
    });
  }
  throw new AppError(500, defaultMessage);
};
