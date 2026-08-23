const pool = require('../config/db');

/**
 * Find an assignment by its primary key.
 * @param {number} assignmentId
 * @returns {Promise<object|null>}
 */
async function findById(assignmentId) {
  const { rows } = await pool.query(
    'SELECT * FROM assignments WHERE id = $1 LIMIT 1',
    [assignmentId]
  );
  return rows[0] || null;
}

/**
 * Find the active assignment for a job seeker.
 * @param {number} employeeUserId
 * @returns {Promise<object|null>}
 */
async function findActiveByEmployee(employeeUserId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.employer_id, a.monthly_salary, a.start_date, a.end_date, a.status,
            j.title AS job_title, j.location,
            c.name AS company_name, c.logo_path AS company_logo
     FROM assignments a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.employee_id = $1 AND a.status = 'active'
     LIMIT 1`,
    [employeeUserId]
  );
  return rows[0] || null;
}

/**
 * List all assignments for a job seeker.
 * @param {number} employeeUserId
 * @returns {Promise<Array>}
 */
async function findByEmployee(employeeUserId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.monthly_salary, a.start_date, a.end_date, a.status,
            j.title AS job_title, j.location,
            c.name AS company_name, c.logo_path AS company_logo,
            COUNT(CASE WHEN att.status = 'present' THEN 1 END) AS present_days,
            COALESCE(SUM(att.hours_worked), 0) AS total_hours
     FROM assignments a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     LEFT JOIN attendance att ON att.assignment_id = a.id
     WHERE a.employee_id = $1
     GROUP BY a.id, j.title, j.location, c.name, c.logo_path
     ORDER BY a.start_date DESC`,
    [employeeUserId]
  );
  return rows;
}

/**
 * List all assignments for an employer.
 * @param {number} employerProfileId
 * @returns {Promise<Array>}
 */
async function findByEmployer(employerProfileId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.monthly_salary, a.start_date, a.end_date, a.status,
            j.title AS job_title,
            jsp.first_name AS employee_first_name, jsp.last_name AS employee_last_name,
            u.email AS employee_email, u.id AS employee_user_id,
            jsp.phone AS employee_phone,
            COUNT(CASE WHEN att.status = 'present' THEN 1 END) AS present_days,
            COALESCE(SUM(att.hours_worked), 0) AS total_hours
     FROM assignments a
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = a.employee_id
     JOIN job_seeker_profiles jsp ON jsp.user_id = a.employee_id
     LEFT JOIN attendance att ON att.assignment_id = a.id
     WHERE a.employer_id = $1
     GROUP BY a.id, j.title, jsp.first_name, jsp.last_name, u.email, u.id, jsp.phone
     ORDER BY a.start_date DESC`,
    [employerProfileId]
  );
  return rows;
}

/**
 * List all assignments for the admin view.
 * @returns {Promise<Array>}
 */
async function findAllForAdmin() {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.employer_id, a.employee_id,
            a.monthly_salary, a.start_date, a.end_date, a.status, a.created_at,
            j.title AS job_title,
            c.name AS company_name,
            jsp.first_name AS employee_first_name, jsp.last_name AS employee_last_name,
            u.email AS employee_email,
            COUNT(CASE WHEN att.status = 'present' THEN 1 END) AS present_days,
            COALESCE(SUM(att.hours_worked), 0) AS total_hours
     FROM assignments a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN users u ON u.id = a.employee_id
     JOIN job_seeker_profiles jsp ON jsp.user_id = a.employee_id
     LEFT JOIN attendance att ON att.assignment_id = a.id
     GROUP BY a.id, j.title, c.name, jsp.first_name, jsp.last_name, u.email
     ORDER BY a.created_at DESC`
  );
  return rows;
}

/**
 * Check for an existing active assignment for the same job + employee.
 * @param {number} jobId
 * @param {number} employeeUserId
 * @returns {Promise<object|null>}
 */
async function findActiveByJobAndEmployee(jobId, employeeUserId) {
  const { rows } = await pool.query(
    `SELECT id FROM assignments
     WHERE job_id = $1 AND employee_id = $2 AND status = 'active'
     LIMIT 1`,
    [jobId, employeeUserId]
  );
  return rows[0] || null;
}

/**
 * Insert a new assignment row inside an active transaction.
 * Must receive a pg PoolClient.
 * @param {import('pg').PoolClient} client
 * @param {object} params
 * @param {number} params.jobId
 * @param {number} params.employerProfileId
 * @param {number} params.employeeUserId
 * @param {number} params.assignedByAdminId
 * @param {number} params.monthlySalary
 * @returns {Promise<object>}
 */
async function createAssignment(client, {
  jobId,
  employerProfileId,
  employeeUserId,
  assignedByAdminId,
  monthlySalary,
}) {
  const { rows } = await client.query(
    `INSERT INTO assignments
       (job_id, employer_id, employee_id, assigned_by_admin_id,
        start_date, monthly_salary, status)
     VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'active')
     RETURNING *`,
    [jobId, employerProfileId, employeeUserId, assignedByAdminId, monthlySalary]
  );
  return rows[0];
}

module.exports = {
  findById,
  findActiveByEmployee,
  findByEmployee,
  findByEmployer,
  findAllForAdmin,
  findActiveByJobAndEmployee,
  createAssignment,
};
