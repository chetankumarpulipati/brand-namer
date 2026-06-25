import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { IntegrationController } from "@/controllers/integration.controller";
import { IntegrationService } from "@/services/integration.service";

const router = Router();
const service = new IntegrationService();
const controller = new IntegrationController(service);

router.get("/", authenticate, controller.list);
router.post("/connect", authenticate, controller.connect);
router.delete("/:id", authenticate, controller.disconnect);

// Bot endpoints
router.post("/slack/command", controller.slackCommand);
router.post("/discord/interaction", controller.discordInteraction);
router.post("/whatsapp/webhook", controller.whatsappWebhook);
router.post("/telegram/webhook", controller.telegramWebhook);
router.post("/zapier/execute", controller.zapierExecute);

export { router as integrationRouter };
