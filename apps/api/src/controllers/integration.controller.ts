import { Request, Response } from "express";
import { IntegrationService } from "@/services/integration.service";
import { asyncHandler } from "@/middleware/error";

export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.list(req.user!.id));
  });

  connect = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.connect(req.user!.id, req.body));
  });

  disconnect = asyncHandler(async (req: Request, res: Response) => {
    await this.integrationService.disconnect(req.user!.id, req.params.id);
    res.json({ message: "Integration disconnected" });
  });

  slackCommand = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.handleSlackCommand(req.body));
  });

  discordInteraction = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.handleDiscordInteraction(req.body));
  });

  whatsappWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.handleWhatsAppWebhook(req.body));
  });

  telegramWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.handleTelegramWebhook(req.body));
  });

  zapierExecute = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.integrationService.handleZapierExecute(req.body));
  });
}
