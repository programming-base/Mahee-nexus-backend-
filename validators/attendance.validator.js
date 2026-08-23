const Joi = require('joi');

const logAttendanceSchema = Joi.object({
  date: Joi.string().isoDate().required().messages({
    'any.required': 'Date is required',
    'string.isoDate': 'Date must be a valid ISO date (YYYY-MM-DD)',
  }),
  status: Joi.string().valid('present', 'half_day', 'leave').required().messages({
    'any.required': 'Attendance status is required',
    'any.only': 'Status must be present, half_day, or leave',
  }),
  hoursWorked: Joi.number().min(0).max(24).precision(1).default(8.0).optional().messages({
    'number.max': 'Hours worked cannot exceed 24',
    'number.min': 'Hours worked cannot be negative',
  }),
  notes: Joi.string().trim().allow('', null).optional(),
});

module.exports = { logAttendanceSchema };
