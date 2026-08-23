const pool = require('../config/db');

/**
 * Insert an audit log entry.
 * This is called after every admin state-changing action.
 *
 * Can be called with either the pool (standalone) or a pg PoolClient
 * when inside an active transaction.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} db - pool or transaction client
 * @param {object} params
 * @param {number} params.adminId
 * @param {string} params.action - e.g. 'Employer Verified'
 * @param {string} params.targetType - e.g. 'employer_profile'
 * @param {number} params.targetId
 * @param {string} [params.details]
 * @returns {Promise<object>}
 */
async function createAuditLog(db, { adminId, action, targetType, targetId, details }) {
  const { rows } = await db.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, admin_id, action, target_type, target_id, details, created_at`,
    [adminId, action, targetType, targetId, details || null]
  );
  return rows[0];
}

/**
 * Fetch the most recent audit log entries for the admin dashboard.
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
async function findRecent(limit = 10) {
  const { rows } = await pool.query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.details, al.created_at,
            u.email AS admin_email
     FROM audit_logs al
     JOIN users u ON u.id = al.admin_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { createAuditLog, findRecent };
