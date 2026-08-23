const pool = require('../config/db');

/**
 * Find a payroll record by its primary key.
 * @param {number} payrollId
 * @returns {Promise<object|null>}
 */
async function findById(payrollId) {
  const { rows } = await pool.query(
    'SELECT * FROM payroll WHERE id = $1 LIMIT 1',
    [payrollId]
  );
  return rows[0] || null;
}

/**
 * List all payroll records for a job seeker.
 * @param {number} employeeUserId
 * @returns {Promise<Array>}
 */
async function findByEmployee(employeeUserId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.assignment_id, p.amount, p.pay_period_start, p.pay_period_end,
            p.status, p.payment_date, p.created_at,
            j.title AS job_title,
            c.name AS company_name
     FROM payroll p
     JOIN assignments a ON a.id = p.assignment_id
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE p.employee_id = $1
     ORDER BY p.created_at DESC`,
    [employeeUserId]
  );
  return rows;
}

/**
 * List all payroll records for a specific assignment.
 * @param {number} assignmentId
 * @returns {Promise<Array>}
 */
async function findByAssignment(assignmentId) {
  const { rows } = await pool.query(
    `SELECT id, assignment_id, employee_id, amount, pay_period_start,
            pay_period_end, status, payment_date, created_at
     FROM payroll
     WHERE assignment_id = $1
     ORDER BY created_at DESC`,
    [assignmentId]
  );
  return rows;
}

/**
 * Insert a new payroll record inside an active transaction.
 * Must receive a pg PoolClient.
 * @param {import('pg').PoolClient} client
 * @param {object} params
 * @param {number} params.assignmentId
 * @param {number} params.employeeUserId
 * @param {number} params.amount
 * @param {string} params.payPeriodStart - ISO date string
 * @param {string} params.payPeriodEnd - ISO date string
 * @param {string} params.paymentDate - ISO date string
 * @returns {Promise<object>}
 */
async function createPayroll(client, {
  assignmentId,
  employeeUserId,
  amount,
  payPeriodStart,
  payPeriodEnd,
  paymentDate,
}) {
  const { rows } = await client.query(
    `INSERT INTO payroll
       (assignment_id, employee_id, amount, pay_period_start, pay_period_end,
        status, payment_date)
     VALUES ($1, $2, $3, $4, $5, 'processed', $6)
     RETURNING id, assignment_id, employee_id, amount,
               pay_period_start, pay_period_end, status, payment_date, created_at`,
    [assignmentId, employeeUserId, amount, payPeriodStart, payPeriodEnd, paymentDate]
  );
  return rows[0];
}

module.exports = { findById, findByEmployee, findByAssignment, createPayroll };
