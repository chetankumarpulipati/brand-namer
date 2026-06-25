import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "@/utils/errors";
import { config } from "@/config/env";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export function rateLimit(options: { windowMs?: number; max?: number; keyPrefix?: string } = {}) {
  const { windowMs = 60_000, max = 60, keyPrefix = "global" } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const identifier = req.user?.id ?? req.ip ?? "unknown";
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      return next(new RateLimitError());
    }

    next();
  };
}
