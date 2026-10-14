class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors = null) {
    super(message, 400, errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or invalid token', errors = null) {
    super(message, 401, errors);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', errors = null) {
    super(message, 403, errors);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errors = null) {
    super(message, 404, errors);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict with current state', errors = null) {
    super(message, 409, errors);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
