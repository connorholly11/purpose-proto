/**
 * Error handling middleware for Express
 * Provides consistent error responses and logging
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
const errorHandler = async (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;
  
  // If in production, don't expose error details for 500 errors
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    details = null;
  }
  
  // Log error to database
  try {
    await prisma.log.create({
      data: {
        type: 'error',
        data: {
          path: req.path,
          method: req.method,
          statusCode,
          message,
          stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
          details
        }
      }
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    details: details,
    success: false
  });
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  ApiError
};
