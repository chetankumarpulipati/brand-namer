import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { AuthService } from "@/services/auth.service";
import { validate } from "@/middleware/error";
import { rateLimit } from "@/middleware/rateLimit";
import { authenticate } from "@/middleware/auth";
import { z } from "zod";

const router = Router();
const service = new AuthService();
const controller = new AuthController(service);

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const totpSchema = z.object({
  body: z.object({
    token: z.string().length(6),
  }),
});

router.post("/register", rateLimit({ windowMs: 900_000, max: 3, keyPrefix: "register" }), validate(registerSchema), controller.register);
router.post("/login", rateLimit({ windowMs: 300_000, max: 10, keyPrefix: "login" }), validate(loginSchema), controller.login);
router.post("/refresh", controller.refreshToken);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);
router.post("/totp/setup", authenticate, controller.setupTotp);
router.post("/totp/verify", authenticate, validate(totpSchema), controller.verifyTotp);
router.post("/totp/disable", authenticate, controller.disableTotp);
router.get("/sessions", authenticate, controller.listSessions);
router.delete("/sessions/:id", authenticate, controller.revokeSession);

export { router as authRouter };
