const pool = require('../config/db');
const payrollRepo = require('../repositories/payroll.repository');
const assignRepo = require('../repositories/assignment.repository');
const { auditLog } = require('./audit.service');
const { DEFAULTS, AUDIT_ACTIONS } = require('../utils/constants');

/**
 * Process payroll for an assignment (admin action).
 * Runs in a transaction: insert payroll + insert audit log.
 *
 * @param {number} assignmentId
 * @param {number} adminUserId
 * @returns {Promise<object>}
 */
async function processPayroll(assignmentId, adminUserId) {
  const assignment = await assignRepo.findById(assignmentId);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  const amount = assignment.monthly_salary || DEFAULTS.FALLBACK_SALARY;

  const today = new Date();
  const paymentDate = today.toISOString().slice(0, 10);
  const payPeriodEnd = paymentDate;
  const payPeriodStart = new Date(today.getTime() - DEFAULTS.PAYROLL_PERIOD_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payroll = await payrollRepo.createPayroll(client, {
      assignmentId,
      employeeUserId: assignment.employee_id,
      amount,
      payPeriodStart,
      payPeriodEnd,
      paymentDate,
    });

    await auditLog({
      adminId: adminUserId,
      action: AUDIT_ACTIONS.PAYROLL_PROCESSED,
      targetType: 'payroll',
      targetId: payroll.id,
      details: `Payroll processed for assignment ${assignmentId}, amount ${amount}`,
      client,
    });

    await client.query('COMMIT');
    return payroll;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List payroll records for the authenticated job seeker.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listMyPayroll(userId) {
  return payrollRepo.findByEmployee(userId);
}

module.exports = { processPayroll, listMyPayroll };
