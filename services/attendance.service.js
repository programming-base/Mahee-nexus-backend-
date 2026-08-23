const attendanceRepo = require('../repositories/attendance.repository');
const assignRepo = require('../repositories/assignment.repository');
const { DEFAULTS } = require('../utils/constants');

/**
 * Get attendance records for the authenticated job seeker's active assignment.
 * @param {number} userId
 * @returns {Promise<object>} { activeAssignment, records }
 */
async function getMyAttendance(userId) {
  const assignment = await assignRepo.findActiveByEmployee(userId);
  if (!assignment) {
    const err = new Error('No active assignment found');
    err.statusCode = 404;
    throw err;
  }

  const records = await attendanceRepo.findByAssignment(assignment.id);
  return { activeAssignment: assignment, records };
}

/**
 * Log a new attendance entry for the authenticated job seeker.
 * @param {number} userId
 * @param {object} body - Validated request body
 * @returns {Promise<object>}
 */
async function logAttendance(userId, body) {
  const assignment = await assignRepo.findActiveByEmployee(userId);
  if (!assignment) {
    const err = new Error('No active assignment found');
    err.statusCode = 422;
    throw err;
  }

  const duplicate = await attendanceRepo.findDuplicate(assignment.id, userId, body.date);
  if (duplicate) {
    const err = new Error('Attendance for this date has already been logged');
    err.statusCode = 409;
    throw err;
  }

  return attendanceRepo.createAttendance({
    assignmentId: assignment.id,
    employeeUserId: userId,
    date: body.date,
    status: body.status,
    hoursWorked: body.hoursWorked ?? DEFAULTS.ATTENDANCE_DEFAULT_HOURS,
    notes: body.notes,
  });
}

module.exports = { getMyAttendance, logAttendance };
