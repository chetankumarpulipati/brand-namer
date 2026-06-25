import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/env";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tier: string;
      };
      apiKey?: {
        id: string;
        userId: string;
        scopes: string[];
      };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError("No authorization header"));
  }

  const [type, token] = authHeader.split(" ");

  if (type === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        role: string;
        tier: string;
      };
      req.user = payload;
      return next();
    } catch {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
  }

  return next(new UnauthorizedError("Invalid authorization format"));
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const [type, token] = authHeader.split(" ");
  if (type === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        role: string;
        tier: string;
      };
      req.user = payload;
    } catch {
      // silently ignore
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError("Insufficient permissions"));
    next();
  };
}

export function requireTier(...tiers: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!tiers.includes(req.user.tier)) {
      return next(new ForbiddenError("Upgrade required for this feature"));
    }
    next();
  };
}
