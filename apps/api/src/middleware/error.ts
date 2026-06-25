import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError, isPrismaError, handlePrismaError } from "@/utils/errors";
import { config } from "@/config/env";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  if (isPrismaError(err)) {
    const appError = handlePrismaError(err);
    res.status(appError.statusCode).json({
      error: {
        message: appError.message,
        code: appError.code,
      },
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: {
      message: config.isDev ? err.message : "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      next(new AppError(422, "Validation failed", "VALIDATION_ERROR", result.error.flatten()));
      return;
    }

    req.body = result.data.body ?? req.body;
    req.query = result.data.query ?? req.query;
    req.params = result.data.params ?? req.params;
    next();
  };
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
