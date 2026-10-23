import { BadRequestError } from '../utils/errors.js';

export const validate = (schema, target = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[target];
      const parsed = await schema.parseAsync(dataToValidate);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new BadRequestError('Validation failed', formattedErrors));
      }
      next(err);
    }
  };
};
