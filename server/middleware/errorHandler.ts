import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || "INTERNAL_ERROR";
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

// Standardized API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Response helper functions
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, error: ApiError, statusCode?: number) {
  const response: ApiResponse = {
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "Internal server error",
      details: error.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode || error.statusCode || 500).json(response);
}

// Global error handler middleware
export function errorHandler(
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  const errorDetails = {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  };

  logger.error(err.message, errorDetails);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError("Validation failed", err.errors);
    return sendError(res, validationError);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return sendError(res, err);
  }

  // Handle unknown errors
  const unknownError: ApiError = {
    name: "UnknownError",
    message: process.env.NODE_ENV === "production" 
      ? "An unexpected error occurred" 
      : err.message,
    statusCode: 500,
    code: "INTERNAL_ERROR",
  };

  return sendError(res, unknownError);
}

