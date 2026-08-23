const pool = require('../config/db');

/**
 * Find the latest attendance records for an assignment (most recent 30).
 * @param {number} assignmentId
 * @returns {Promise<Array>}
 */
async function findByAssignment(assignmentId) {
  const { rows } = await pool.query(
    `SELECT id, assignment_id, employee_id, date, status, hours_worked, notes
     FROM attendance
     WHERE assignment_id = $1
     ORDER BY date DESC
     LIMIT 30`,
    [assignmentId]
  );
  return rows;
}

/**
 * Check for a duplicate attendance entry for the same assignment + user + date.
 * @param {number} assignmentId
 * @param {number} employeeUserId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<object|null>}
 */
async function findDuplicate(assignmentId, employeeUserId, date) {
  const { rows } = await pool.query(
    `SELECT id FROM attendance
     WHERE assignment_id = $1 AND employee_id = $2 AND date = $3
     LIMIT 1`,
    [assignmentId, employeeUserId, date]
  );
  return rows[0] || null;
}

/**
 * Insert a new attendance record.
 * @param {object} params
 * @param {number} params.assignmentId
 * @param {number} params.employeeUserId
 * @param {string} params.date - ISO date string (YYYY-MM-DD)
 * @param {string} params.status - 'present' | 'half_day' | 'leave'
 * @param {number} [params.hoursWorked=8.0]
 * @param {string} [params.notes]
 * @returns {Promise<object>}
 */
async function createAttendance({ assignmentId, employeeUserId, date, status, hoursWorked, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO attendance (assignment_id, employee_id, date, status, hours_worked, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, assignment_id, employee_id, date, status, hours_worked, notes`,
    [assignmentId, employeeUserId, date, status, hoursWorked ?? 8.0, notes || null]
  );
  return rows[0];
}

module.exports = { findByAssignment, findDuplicate, createAttendance };
