export interface ErrorDetail {
  field: string;
  message: string;
}

// Custom error class thrown from services/controllers.
// The centralized error middleware knows how to unpack this shape.
export class ApiError extends Error {
  statusCode: number;
  details: ErrorDetail[] | null;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    details: ErrorDetail[] | null = null,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details: ErrorDetail[] | null = null) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, false);
  }
}

export default ApiError;
