import { z, type ZodType } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// Reusable coercion: string param → positive integer
export const zIntId = z.coerce.number().int().positive();
export const zOptionalInt = z.coerce.number().int().positive().optional();
export const zOptionalString = z.string().optional();

type ValidatedFields = {
  params?: ZodType;
  query?: ZodType;
};

export function validate(schemas: ValidatedFields) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
      }
      req.params = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ error: result.error.errors[0].message });
        return;
      }
      req.validatedQuery = result.data;
    }

    next();
  };
}
