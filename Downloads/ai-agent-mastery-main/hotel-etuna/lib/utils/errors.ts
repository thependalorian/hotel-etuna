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
  // Log the error for debugging purposes
  console.error(error);
  // Throw a generic error to the client
  throw new AppError(500, defaultMessage);
};
