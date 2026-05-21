// ═══════════════════════════════════════════════
// src/middleware/errorHandler.js
//
// Centralized error handling for the entire API.
// Every unhandled error in every route flows here.
//
// HOW TO USE IN ROUTES:
//   try {
//     // ... your logic
//   } catch (error) {
//     next(error); // ← that's it, this handler does the rest
//   }
//
// Or create a custom error:
//   const err = new AppError('Not found', 404);
//   next(err);
// ═══════════════════════════════════════════════

const { sendError } = require('../utils/response');

// ───────────────────────────────────────────────
// AppError — Custom error class
//
// WHY a custom class? Because JavaScript's built-in
// Error only has a message. We need to also carry:
// - statusCode (what HTTP status to return)
// - isOperational (was this expected or a bug?)
//
// Operational errors: user sent bad input, resource
// not found, unauthorized — these are EXPECTED.
// Programming errors: null reference, wrong variable
// type — these are BUGS and need different handling.
// ───────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor with the message
    // This sets this.message and captures the stack trace
    super(message);

    this.statusCode = statusCode;

    // Operational = expected error we deliberately threw
    // (vs a programming bug that threw unexpectedly)
    this.isOperational = true;

    // Capture stack trace, excluding the constructor call
    // from the stack — keeps stack traces clean
    Error.captureStackTrace(this, this.constructor);
  }
}

// ───────────────────────────────────────────────
// handleMongooseErrors — converts Mongoose-specific
// errors into clean AppError instances
//
// Mongoose throws its own error types that we need
// to translate into user-friendly messages
// ───────────────────────────────────────────────
const handleMongooseErrors = (error) => {
  // CastError: happens when you pass a malformed MongoDB ID
  // e.g. GET /api/expenses/not-a-valid-id
  // Mongoose throws: "Cast to ObjectId failed for value..."
  if (error.name === 'CastError') {
    return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  // Duplicate key error: happens when you try to create
  // a document that violates a unique index
  // e.g. registering with an email that already exists
  // MongoDB error code 11000 = duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new AppError(
      `${field} '${value}' already exists. Please use a different value.`,
      409 // 409 Conflict
    );
  }

  // ValidationError: happens when Mongoose schema validation fails
  // e.g. required field missing, enum value not allowed
  if (error.name === 'ValidationError') {
    // ValidationError can have MULTIPLE field errors at once
    // We extract all of them and join into one message
    const messages = Object.values(error.errors).map((err) => err.message);
    return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
  }

  // Not a Mongoose error we recognize — return as-is
  return error;
};

// ───────────────────────────────────────────────
// handleJWTErrors — converts JWT errors into
// clean messages
// ───────────────────────────────────────────────
const handleJWTErrors = (error) => {
  // JsonWebTokenError: token is malformed or signature invalid
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again.', 401);
  }

  // TokenExpiredError: token was valid but has expired
  if (error.name === 'TokenExpiredError') {
    return new AppError('Your session has expired. Please log in again.', 401);
  }

  return error;
};

// ───────────────────────────────────────────────
// globalErrorHandler — the actual Express middleware
// This is what gets registered in server.js
// ───────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  // Set defaults if the error didn't come with them
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal server error';

  // Log every error in development so we can debug
  // In production we'd send this to a logging service
  // like Sentry, Datadog, or CloudWatch
  if (process.env.NODE_ENV === 'development') {
    console.error('─────────────────────────────────');
    console.error('❌ ERROR:', err.message);
    console.error('Status:', err.statusCode);
    console.error('Stack:', err.stack);
    console.error('─────────────────────────────────');
  }

  // Translate known error types into clean AppErrors
  let processedError = { ...err, message: err.message };
  processedError = handleMongooseErrors(processedError);
  processedError = handleJWTErrors(processedError);

  // DEVELOPMENT: send full error details including stack trace
  // Helps you debug quickly during development
  if (process.env.NODE_ENV === 'development') {
    return sendError(
      res,
      processedError.message,
      processedError.statusCode,
      {
        stack: err.stack,
        originalError: err.name,
      }
    );
  }

  // PRODUCTION: only send safe information to the client
  // Never expose stack traces or internal details in production
  // Operational errors are safe to show (we wrote those messages)
  // Programming errors get a generic message (don't leak internals)
  if (processedError.isOperational) {
    return sendError(res, processedError.message, processedError.statusCode);
  }

  // Unknown/programming error in production
  // Log it internally but send generic message to client
  console.error('PROGRAMMING ERROR — investigate immediately:', err);
  return sendError(res, 'Something went wrong. Please try again.', 500);
};

module.exports = { globalErrorHandler, AppError };