import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import ApiError from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

// Usage: router.post('/', validate(schema), controller)
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

    req[source] = value;
    next();
  };

export default validate;
