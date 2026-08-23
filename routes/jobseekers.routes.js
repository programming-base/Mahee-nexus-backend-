const express = require('express');
const router = express.Router();

const controller = require('../controllers/jobseeker.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uploadResume } = require('../middleware/upload');
const { updateJobSeekerProfileSchema } = require('../validators/profile.validator');
const { logAttendanceSchema } = require('../validators/attendance.validator');
const { sendMessageSchema } = require('../validators/message.validator');

// All jobseeker routes require authentication + job_seeker active role
router.use(authenticate, authorize('job_seeker'));

// GET  /api/jobseeker/dashboard
router.get('/dashboard', controller.getDashboard);

// GET  /api/jobseeker/profile
router.get('/profile', controller.getProfile);

// PUT  /api/jobseeker/profile
router.put('/profile', validate(updateJobSeekerProfileSchema), controller.updateProfile);

// POST /api/jobseeker/profile/resume
router.post('/profile/resume', uploadResume, controller.uploadResume);

// GET  /api/jobseeker/applications
router.get('/applications', controller.listApplications);

// GET  /api/jobseeker/assignments
router.get('/assignments', controller.listAssignments);

// GET  /api/jobseeker/attendance
router.get('/attendance', controller.getAttendance);

// POST /api/jobseeker/attendance
router.post('/attendance', validate(logAttendanceSchema), controller.logAttendance);

// GET  /api/jobseeker/payroll
router.get('/payroll', controller.getPayroll);

// GET  /api/jobseeker/messages
router.get('/messages', controller.getMessages);

// POST /api/jobseeker/messages
router.post('/messages', validate(sendMessageSchema), controller.sendMessage);

module.exports = router;
