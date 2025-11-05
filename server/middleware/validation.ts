import type { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { ValidationError, sendError } from "./errorHandler";

type ValidationSchema = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError("Validation failed", error.errors);
        return sendError(res, validationError);
      }
      next(error);
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid("Invalid UUID format"),
  pagination: {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  },
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
};

