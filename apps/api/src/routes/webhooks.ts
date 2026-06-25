import { Router } from "express";
import { WebhookController } from "@/controllers/webhook.controller";
import { WebhookService } from "@/services/webhook.service";

const router = Router();
const service = new WebhookService();
const controller = new WebhookController(service);

router.post("/stripe", controller.stripeWebhook);
router.post("/supabase", controller.supabaseWebhook);
router.post("/slack", controller.slackWebhook);
router.post("/discord", controller.discordWebhook);
router.post("/whatsapp", controller.whatsappWebhook);
router.post("/telegram", controller.telegramWebhook);

export { router as webhookRouter };
