import { Router } from "express";
import { AdminController } from "@/controllers/admin.controller";
import { AdminService } from "@/services/admin.service";
import { authenticate, requireRole } from "@/middleware/auth";

const router: Router = Router();
const service = new AdminService();
const controller = new AdminController(service);

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", controller.getStats);
router.get("/users", controller.listUsers);
router.get("/users/:id", controller.getUser);
router.patch("/users/:id", controller.updateUser);
router.delete("/users/:id", controller.deleteUser);
router.post("/users/:id/impersonate", controller.impersonate);
router.get("/audit-logs", controller.getAuditLogs);
router.get("/feature-flags", controller.listFeatureFlags);
router.patch("/feature-flags/:id", controller.updateFeatureFlag);
router.get("/webhooks", controller.listWebhooks);
router.get("/webhooks/:id/logs", controller.getWebhookLogs);
router.post("/webhooks/:id/retry", controller.retryWebhook);

export { router as adminRouter };
