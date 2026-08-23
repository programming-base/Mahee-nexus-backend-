const { createAuditLog, findRecent } = require('../repositories/audit.repository');
const pool = require('../config/db');

/**
 * Write an audit log entry.
 * Pass a pg PoolClient as `db` when inside a transaction,
 * or omit it to use the pool directly.
 *
 * @param {object} params
 * @param {number} params.adminId
 * @param {string} params.action
 * @param {string} params.targetType
 * @param {number} params.targetId
 * @param {string} [params.details]
 * @param {import('pg').PoolClient} [params.client] - Optional transaction client
 * @returns {Promise<object>}
 */
async function auditLog({ adminId, action, targetType, targetId, details, client }) {
  const db = client || pool;
  return createAuditLog(db, { adminId, action, targetType, targetId, details });
}

/**
 * Fetch the latest audit log entries for the admin dashboard.
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
async function getRecentAuditLogs(limit = 10) {
  return findRecent(limit);
}

module.exports = { auditLog, getRecentAuditLogs };
