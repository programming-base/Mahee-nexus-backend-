const profileRepo = require('../repositories/profile.repository');
const appService = require('../services/application.service');
const assignService = require('../services/assignment.service');
const attendanceService = require('../services/attendance.service');
const payrollService = require('../services/payroll.service');
const messagingService = require('../services/messaging.service');
const storageService = require('../services/storage.service');
const { success } = require('../utils/response');

async function getDashboard(req, res, next) {
  try {
    const profile = await profileRepo.findJobSeekerByUserId(req.user.id);
    const assignments = await assignService.listMyAssignments(req.user.id);
    const applications = await appService.listMyApplications(req.user.id);

    return success(res, {
      profile,
      activeAssignments: assignments.filter((a) => a.status === 'active'),
      recentApplications: applications.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await profileRepo.findJobSeekerByUserId(req.user.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await profileRepo.updateJobSeekerProfile(req.user.id, req.body);
    return success(res, profile, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }

    const resumePath = await storageService.uploadResume(req.file);
    const updated = await profileRepo.updateJobSeekerResume(req.user.id, resumePath);
    return success(res, { resumePath: updated.resume_path }, 'Resume uploaded successfully');
  } catch (err) {
    next(err);
  }
}

async function listApplications(req, res, next) {
  try {
    const data = await appService.listMyApplications(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const data = await assignService.listMyAssignments(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAttendance(req, res, next) {
  try {
    const data = await attendanceService.getMyAttendance(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function logAttendance(req, res, next) {
  try {
    const record = await attendanceService.logAttendance(req.user.id, req.body);
    return success(res, record, 'Attendance logged successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getPayroll(req, res, next) {
  try {
    const data = await payrollService.listMyPayroll(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const data = await messagingService.getMyMessages(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.sendMessageToAdmin(req.user.id, req.body.message);
    return success(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadResume,
  listApplications,
  listAssignments,
  getAttendance,
  logAttendance,
  getPayroll,
  getMessages,
  sendMessage,
};
