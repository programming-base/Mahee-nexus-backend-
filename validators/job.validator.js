const Joi = require('joi');

const createJobSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'any.required': 'Job title is required',
    'string.empty': 'Job title cannot be empty',
  }),
  description: Joi.string().trim().required().messages({
    'any.required': 'Job description is required',
    'string.empty': 'Job description cannot be empty',
  }),
  location: Joi.string().trim().allow('', null).optional(),
  employmentType: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance')
    .allow(null)
    .optional(),
  experienceLevel: Joi.string()
    .valid('Entry Level', 'Mid Level', 'Senior Level', 'Executive')
    .allow(null)
    .optional(),
  salaryMin: Joi.number().min(0).default(0).optional(),
  salaryMax: Joi.number().min(0).default(0).optional(),
  status: Joi.string().valid('open', 'closed').default('open').optional(),
  deadline: Joi.string().isoDate().allow(null).optional().messages({
    'string.isoDate': 'Deadline must be a valid ISO date (YYYY-MM-DD)',
  }),
});

// Update uses the same shape — all fields optional except those the
// PHP form enforced (title + description stay required for updates too)
const updateJobSchema = createJobSchema;

const jobQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  keyword: Joi.string().trim().allow('', null).optional(),
  location: Joi.string().trim().allow('', null).optional(),
});

module.exports = { createJobSchema, updateJobSchema, jobQuerySchema };
