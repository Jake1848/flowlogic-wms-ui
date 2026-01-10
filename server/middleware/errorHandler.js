import { ZodError } from 'zod';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

/**
 * Centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging)
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle Prisma errors (check by name since instanceof may not work with ESM)
  if (err.name === 'PrismaClientKnownRequestError' || err.constructor?.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
          details: { fields: err.meta?.target },
        });
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Record not found',
        });
      case 'P2003':
        // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          error: 'Related record not found',
          details: { field: err.meta?.field_name },
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Database operation failed',
          details: process.env.NODE_ENV !== 'production' ? { code: err.code } : undefined,
        });
    }
  }

  if (err.name === 'PrismaClientValidationError' || err.constructor?.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided',
    });
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
