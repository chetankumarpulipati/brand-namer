import { Request, Response } from "express";
import { WebhookService } from "@/services/webhook.service";
import { asyncHandler } from "@/middleware/error";

export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    res.json(await this.webhookService.handleStripe(JSON.stringify(req.body), sig));
  });

  supabaseWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.webhookService.handleSupabase(req.body));
  });

  slackWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.webhookService.handleSlack(req.body));
  });

  discordWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.webhookService.handleDiscord(req.body));
  });

  whatsappWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.webhookService.handleWhatsApp(req.body));
  });

  telegramWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.webhookService.handleTelegram(req.body));
  });
}
