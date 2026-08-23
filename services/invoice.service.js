const pool = require('../config/db');
const invoiceRepo = require('../repositories/invoice.repository');
const assignRepo = require('../repositories/assignment.repository');
const profileRepo = require('../repositories/profile.repository');
const { auditLog } = require('./audit.service');
const { DEFAULTS, AUDIT_ACTIONS } = require('../utils/constants');

/**
 * Generate an invoice number in the form INV-YYYYMMDD-XXX.
 * @returns {string}
 */
function generateInvoiceNumber() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 900) + 100); // 100–999
  return `INV-${datePart}-${random}`;
}

/**
 * Generate an employer invoice for an assignment (admin action).
 * Runs in a transaction: insert invoice + insert audit log.
 *
 * @param {number} assignmentId
 * @param {number} adminUserId
 * @returns {Promise<object>}
 */
async function generateInvoice(assignmentId, adminUserId) {
  const assignment = await assignRepo.findById(assignmentId);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }

  const monthlySalary = assignment.monthly_salary || DEFAULTS.FALLBACK_SALARY;
  const amount = parseFloat((monthlySalary * DEFAULTS.INVOICE_MULTIPLIER).toFixed(2));

  const today = new Date();
  const issueDate = today.toISOString().slice(0, 10);
  const dueDate = new Date(today.getTime() + DEFAULTS.INVOICE_DUE_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);

  const invoiceNumber = generateInvoiceNumber();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invoice = await invoiceRepo.createInvoice(client, {
      assignmentId,
      employerProfileId: assignment.employer_id,
      invoiceNumber,
      amount,
      issueDate,
      dueDate,
    });

    await auditLog({
      adminId: adminUserId,
      action: AUDIT_ACTIONS.INVOICE_GENERATED,
      targetType: 'invoice',
      targetId: invoice.id,
      details: `Invoice ${invoiceNumber} generated for assignment ${assignmentId}`,
      client,
    });

    await client.query('COMMIT');
    return invoice;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List all invoices for an employer.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listEmployerInvoices(userId) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }
  return invoiceRepo.findByEmployer(profile.id);
}

/**
 * Mark an invoice as paid (demo action — no real payment gateway).
 * @param {number} invoiceId
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function payInvoice(invoiceId, userId) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }

  const invoice = await invoiceRepo.findByIdAndEmployer(invoiceId, profile.id);
  if (!invoice) {
    const err = new Error('Invoice not found');
    err.statusCode = 404;
    throw err;
  }

  return invoiceRepo.updateStatus(invoiceId, 'paid');
}

module.exports = { generateInvoice, listEmployerInvoices, payInvoice };
