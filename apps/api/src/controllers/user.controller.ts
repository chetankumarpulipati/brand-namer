import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error";

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getProfile(req.user!.id);
    res.json(result);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.updateProfile(req.user!.id, req.body);
    res.json(result);
  });

  getCredits = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getCredits(req.user!.id);
    res.json(result);
  });

  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await this.userService.getTransactions(req.user!.id, page, limit);
    res.json(result);
  });

  createApiKey = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.createApiKey(req.user!.id, req.body.name, req.body.scopes);
    res.status(201).json(result);
  });

  listApiKeys = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.listApiKeys(req.user!.id);
    res.json(result);
  });

  revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.revokeApiKey(req.user!.id, req.params.id);
    res.json({ message: "API key revoked" });
  });

  // Webhook Configs
  listWebhookConfigs = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.listWebhookConfigs(req.user!.id));
  });

  createWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.userService.createWebhookConfig(req.user!.id, req.body));
  });

  updateWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.updateWebhookConfig(req.user!.id, req.params.id, req.body));
  });

  deleteWebhookConfig = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteWebhookConfig(req.user!.id, req.params.id);
    res.json({ message: "Webhook config deleted" });
  });

  getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.getWebhookLogs(req.user!.id, req.params.id));
  });

  // Email Signatures
  listEmailSignatures = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.listEmailSignatures(req.user!.id));
  });

  createEmailSignature = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.userService.createEmailSignature(req.user!.id, req.body));
  });

  deleteEmailSignature = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteEmailSignature(req.user!.id, req.params.id);
    res.json({ message: "Email signature deleted" });
  });

  // Social Posts
  listSocialPosts = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.listSocialPosts(req.user!.id));
  });

  createSocialPost = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.userService.createSocialPost(req.user!.id, req.body));
  });

  deleteSocialPost = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteSocialPost(req.user!.id, req.params.id);
    res.json({ message: "Social post deleted" });
  });

  // Shareable Cards
  listShareableCards = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.userService.listShareableCards(req.user!.id));
  });

  createShareableCard = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.userService.createShareableCard(req.user!.id, req.body));
  });

  deleteShareableCard = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteShareableCard(req.user!.id, req.params.id);
    res.json({ message: "Shareable card deleted" });
  });
}
