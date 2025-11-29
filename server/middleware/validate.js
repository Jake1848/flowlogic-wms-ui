import { ZodError } from 'zod';

/**
 * Validation middleware factory
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      // Replace the original data with the parsed/transformed data
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request body
 * @param {import('zod').ZodSchema} schema
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 * @param {import('zod').ZodSchema} schema
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 * @param {import('zod').ZodSchema} schema
 */
export const validateParams = (schema) => validate(schema, 'params');
