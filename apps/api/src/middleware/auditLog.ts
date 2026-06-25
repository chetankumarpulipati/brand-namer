import { Request, Response, NextFunction } from "express";

export function auditLog(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.id) {
      const logData = {
        userId: req.user.id,
        action,
        resource: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        timestamp: new Date().toISOString(),
      };
      // In production, push to queue for async processing
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("AUDIT:", JSON.stringify(logData));
      }
    }
    next();
  };
}
