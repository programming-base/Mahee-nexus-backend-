const pool = require('../config/db');

/**
 * Find an invoice by its primary key.
 * @param {number} invoiceId
 * @returns {Promise<object|null>}
 */
async function findById(invoiceId) {
  const { rows } = await pool.query(
    'SELECT * FROM invoices WHERE id = $1 LIMIT 1',
    [invoiceId]
  );
  return rows[0] || null;
}

/**
 * Find an invoice by ID scoped to an employer (ownership check).
 * @param {number} invoiceId
 * @param {number} employerProfileId
 * @returns {Promise<object|null>}
 */
async function findByIdAndEmployer(invoiceId, employerProfileId) {
  const { rows } = await pool.query(
    `SELECT * FROM invoices
     WHERE id = $1 AND employer_id = $2
     LIMIT 1`,
    [invoiceId, employerProfileId]
  );
  return rows[0] || null;
}

/**
 * List all invoices for an employer.
 * @param {number} employerProfileId
 * @returns {Promise<Array>}
 */
async function findByEmployer(employerProfileId) {
  const { rows } = await pool.query(
    `SELECT id, assignment_id, invoice_number, amount, status,
            issue_date, due_date, created_at
     FROM invoices
     WHERE employer_id = $1
     ORDER BY created_at DESC`,
    [employerProfileId]
  );
  return rows;
}

/**
 * List all invoices for a specific assignment.
 * @param {number} assignmentId
 * @returns {Promise<Array>}
 */
async function findByAssignment(assignmentId) {
  const { rows } = await pool.query(
    `SELECT id, assignment_id, invoice_number, amount, status,
            issue_date, due_date, created_at
     FROM invoices
     WHERE assignment_id = $1
     ORDER BY created_at DESC`,
    [assignmentId]
  );
  return rows;
}

/**
 * Insert a new invoice row inside an active transaction.
 * Must receive a pg PoolClient.
 * @param {import('pg').PoolClient} client
 * @param {object} params
 * @param {number} params.assignmentId
 * @param {number} params.employerProfileId
 * @param {string} params.invoiceNumber - e.g. 'INV-20260822-123'
 * @param {number} params.amount
 * @param {string} params.issueDate - ISO date string
 * @param {string} params.dueDate - ISO date string
 * @returns {Promise<object>}
 */
async function createInvoice(client, {
  assignmentId,
  employerProfileId,
  invoiceNumber,
  amount,
  issueDate,
  dueDate,
}) {
  const { rows } = await client.query(
    `INSERT INTO invoices
       (assignment_id, employer_id, invoice_number, amount, status, issue_date, due_date)
     VALUES ($1, $2, $3, $4, 'unpaid', $5, $6)
     RETURNING id, assignment_id, invoice_number, amount, status, issue_date, due_date, created_at`,
    [assignmentId, employerProfileId, invoiceNumber, amount, issueDate, dueDate]
  );
  return rows[0];
}

/**
 * Update invoice status (employer demo-pay action or admin).
 * @param {number} invoiceId
 * @param {string} status - 'paid' | 'unpaid'
 * @returns {Promise<object>}
 */
async function updateStatus(invoiceId, status) {
  const { rows } = await pool.query(
    `UPDATE invoices
     SET status = $1
     WHERE id = $2
     RETURNING id, status`,
    [status, invoiceId]
  );
  return rows[0];
}

module.exports = {
  findById,
  findByIdAndEmployer,
  findByEmployer,
  findByAssignment,
  createInvoice,
  updateStatus,
};
