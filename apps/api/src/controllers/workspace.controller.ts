import { Request, Response } from "express";
import { WorkspaceService } from "@/services/workspace.service";
import { asyncHandler } from "@/middleware/error";

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.workspaceService.list(req.user!.id);
    res.json(result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.workspaceService.create(req.user!.id, req.body);
    res.status(201).json(result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.workspaceService.getById(req.user!.id, req.params.id);
    res.json(result);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.workspaceService.update(req.user!.id, req.params.id, req.body);
    res.json(result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.workspaceService.delete(req.user!.id, req.params.id);
    res.json({ message: "Workspace deleted" });
  });

  invite = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.workspaceService.invite(req.user!.id, req.params.id, req.body);
    res.status(201).json(result);
  });

  removeMember = asyncHandler(async (req: Request, res: Response) => {
    await this.workspaceService.removeMember(req.user!.id, req.params.id, req.params.memberId);
    res.json({ message: "Member removed" });
  });
}
