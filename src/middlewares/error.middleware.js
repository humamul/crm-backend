const ApiResponse = require('../dtos/responses/api.response');

/**
 * Centralized error handling middleware
 */
function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  // Log error stack for unexpected 500 errors
  if (statusCode === 500) {
    console.error('[ErrorMiddleware] Unhandled Server Error:', err);
  }

  const responseBody = ApiResponse.error(message, errors);
  
  // Attach stack trace only in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    responseBody.stack = err.stack;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * 404 Route Not Found handler
 */
function notFoundHandler(req, res, next) {
  return res.status(404).json(
    ApiResponse.error(`Route not found: ${req.method} ${req.originalUrl}`)
  );
}

module.exports = {
  errorMiddleware,
  notFoundHandler,
};
