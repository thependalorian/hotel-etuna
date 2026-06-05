import { securityLogger } from '@/lib/utils/security-logger';

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
