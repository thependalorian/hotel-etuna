/**
 * @fileoverview Application error types and service-layer error handling.
 *
 * `AppError` carries an HTTP status code; `handleServiceError` normalizes
 * unknown errors and logs via securityLogger.
 * Location: lib/utils/errors.ts
 */
import { securityLogger } from '@/lib/utils/security-logger';

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
  securityLogger.error('Service error', error);
  throw new AppError(500, defaultMessage);
};
