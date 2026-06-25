import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/error";
import { UserController } from "@/controllers/user.controller";
import { UserService } from "@/services/user.service";
import { z } from "zod";

const router = Router();
const service = new UserService();
const controller = new UserController(service);

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    image: z.string().url().optional(),
  }),
});

router.get("/profile", authenticate, controller.getProfile);
router.patch("/profile", authenticate, validate(updateProfileSchema), controller.updateProfile);
router.get("/credits", authenticate, controller.getCredits);
router.get("/transactions", authenticate, controller.getTransactions);
router.post("/api-keys", authenticate, controller.createApiKey);
router.get("/api-keys", authenticate, controller.listApiKeys);
router.delete("/api-keys/:id", authenticate, controller.revokeApiKey);

// Webhook Configs
router.get("/webhooks", authenticate, controller.listWebhookConfigs);
router.post("/webhooks", authenticate, controller.createWebhookConfig);
router.patch("/webhooks/:id", authenticate, controller.updateWebhookConfig);
router.delete("/webhooks/:id", authenticate, controller.deleteWebhookConfig);
router.get("/webhooks/:id/logs", authenticate, controller.getWebhookLogs);

// Email Signatures
router.get("/email-signatures", authenticate, controller.listEmailSignatures);
router.post("/email-signatures", authenticate, controller.createEmailSignature);
router.delete("/email-signatures/:id", authenticate, controller.deleteEmailSignature);

// Social Posts
router.get("/social-posts", authenticate, controller.listSocialPosts);
router.post("/social-posts", authenticate, controller.createSocialPost);
router.delete("/social-posts/:id", authenticate, controller.deleteSocialPost);

// Shareable Cards
router.get("/shareable-cards", authenticate, controller.listShareableCards);
router.post("/shareable-cards", authenticate, controller.createShareableCard);
router.delete("/shareable-cards/:id", authenticate, controller.deleteShareableCard);

export { router as userRouter };
