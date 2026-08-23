const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
  roles: Joi.array()
    .items(Joi.string().valid('job_seeker', 'employer'))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one role must be selected',
      'any.required': 'Roles are required',
      'any.only': 'Role must be job_seeker or employer',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const roleSelectSchema = Joi.object({
  role: Joi.string().valid('employer', 'job_seeker').required().messages({
    'any.only': 'Role must be employer or job_seeker',
    'any.required': 'Role is required',
  }),
});

module.exports = { registerSchema, loginSchema, roleSelectSchema };
