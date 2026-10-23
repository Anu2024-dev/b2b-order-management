export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: insufficient permissions') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = null) {
    super(message, 400, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict: resource already exists') {
    super(message, 409);
  }
}
