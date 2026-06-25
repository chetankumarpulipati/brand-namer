import { Request, Response } from "express";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error";

export class AdminController {
  constructor(private adminService: AdminService) {}

  getStats = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.getStats());
  });

  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    res.json(await this.adminService.listUsers(page, limit, search));
  });

  getUser = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.getUser(req.params.id));
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.updateUser(req.params.id, req.body));
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.deleteUser(req.params.id));
  });

  impersonate = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.impersonate(req.user!.id, req.params.id));
  });

  getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    res.json(await this.adminService.getAuditLogs(page, limit, userId));
  });

  listFeatureFlags = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.listFeatureFlags());
  });

  updateFeatureFlag = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.updateFeatureFlag(req.params.id, req.body));
  });

  listWebhooks = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.adminService.listWebhooks(page, limit));
  });

  getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.adminService.getWebhookLogs(req.params.id, page, limit));
  });

  retryWebhook = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.adminService.retryWebhook(req.params.id));
  });
}
