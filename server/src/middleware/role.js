import { ForbiddenError } from '../utils/errors.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required prior to authorization'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};
