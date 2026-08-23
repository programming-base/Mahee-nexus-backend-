/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {object} data - Payload to include under the "data" key
 * @param {string} [message]
 * @param {number} [statusCode=200]
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a successful list response with pagination metadata.
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {{ page: number, limit: number, total: number, totalPages: number }} pagination
 * @param {number} [statusCode=200]
 */
function successList(res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {Array} [errors] - Optional field-level error array
 */
function error(res, message, statusCode = 400, errors = []) {
  const body = { success: false, message };
  if (errors.length > 0) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, successList, error };
