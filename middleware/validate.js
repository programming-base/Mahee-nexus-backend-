const { error } = require('../utils/response');

/**
 * Validation middleware factory.
 * Accepts a Joi schema and validates req.body against it.
 * Returns 400 with structured field errors on failure.
 *
 * Usage:
 *   const { registerSchema } = require('../validators/auth.validator');
 *   router.post('/register', validate(registerSchema), controller.register);
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Part of the request to validate
 * @returns {import('express').RequestHandler}
 */
function validate(schema, source = 'body') {
  return function (req, res, next) {
    const { error: validationError, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validationError) {
      const errors = validationError.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));
      return error(res, 'Validation failed', 400, errors);
    }

    // Replace the source with the sanitized + coerced value from Joi
    req[source] = value;
    next();
  };
}

module.exports = validate;
