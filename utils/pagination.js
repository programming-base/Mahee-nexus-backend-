/**
 * Parse and clamp pagination query parameters.
 * @param {object} query - req.query object
 * @param {number} [defaultLimit=20]
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build the pagination metadata object for API responses.
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total number of matching records
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildPaginationMeta };
