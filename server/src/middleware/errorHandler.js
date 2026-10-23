import { AppError } from '../utils/errors.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists or duplicate value violates unique constraint';
    if (err.detail) {
      errors = [{ message: err.detail }];
    }
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced entity does not exist';
    if (err.detail) {
      errors = [{ message: err.detail }];
    }
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    statusCode = 400;
    message = 'Data check constraint violated (e.g. invalid status or negative quantity/price)';
  }

  // Handle invalid JSON body syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (statusCode === 500) {
    console.error('[UNHANDLED SERVER ERROR]', {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.env === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};
