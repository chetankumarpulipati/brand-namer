import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { WorkspaceController } from "@/controllers/workspace.controller";
import { WorkspaceService } from "@/services/workspace.service";

const router = Router();
const service = new WorkspaceService();
const controller = new WorkspaceController(service);

router.get("/", authenticate, controller.list);
router.post("/", authenticate, controller.create);
router.get("/:id", authenticate, controller.getById);
router.patch("/:id", authenticate, controller.update);
router.delete("/:id", authenticate, controller.delete);
router.post("/:id/invite", authenticate, controller.invite);
router.delete("/:id/members/:memberId", authenticate, controller.removeMember);

export { router as workspaceRouter };
