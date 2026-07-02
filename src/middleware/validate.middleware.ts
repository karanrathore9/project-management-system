import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import ApiError from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

const validate =
  (schema: ObjectSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    // Express 5 exposes req.query as a getter computed live from the URL —
    // it cannot be reassigned. Store the validated/sanitized query
    // separately; body and params are still safe to overwrite directly.
    if (source === 'query') {
      req.validatedQuery = value;
    } else {
      req[source] = value;
    }
    next();
  };

export default validate;