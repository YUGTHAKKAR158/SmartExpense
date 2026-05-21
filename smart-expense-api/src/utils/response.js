// ═══════════════════════════════════════════════
// src/utils/response.js
//
// Standardizes ALL API responses across the entire
// application. Every route sends responses through
// these two functions — never res.json() directly.
//
// WHY: Without a standard format, your frontend
// never knows what shape the data will be in.
// With this, every response is always:
// { success: true/false, message: "...", data: {...} }
// ═══════════════════════════════════════════════

/**
 * Send a successful response
 * @param {object} res       - Express response object
 * @param {any}    data      - The payload to return (object, array, etc.)
 * @param {string} message   - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  // Build the standard response envelope
  const responseBody = {
    success: true,
    message,
    // Only include the data key if data was actually provided
    // This keeps responses clean — no { data: null } on simple confirmations
    ...(data !== null && { data }),
  };

  return res.status(statusCode).json(responseBody);
};

/**
 * Send an error response
 * @param {object} res       - Express response object
 * @param {string} message   - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {any}    errors    - Optional field-level validation errors
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const responseBody = {
    success: false,
    message,
    // Include validation errors if provided (e.g. from express-validator)
    ...(errors !== null && { errors }),
  };

  return res.status(statusCode).json(responseBody);
};

module.exports = { sendSuccess, sendError };