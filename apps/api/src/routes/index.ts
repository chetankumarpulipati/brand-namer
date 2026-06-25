import { Router } from "express";
import { authRouter } from "@/routes/auth";
import { searchRouter } from "@/routes/search";
import { userRouter } from "@/routes/user";
import { billingRouter } from "@/routes/billing";
import { workspaceRouter } from "@/routes/workspace";
import { communityRouter } from "@/routes/community";
import { adminRouter } from "@/routes/admin";
import { integrationRouter } from "@/routes/integrations";
import { webhookRouter } from "@/routes/webhooks";
import { brandRouter } from "@/routes/brand";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/workspaces", workspaceRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/integrations", integrationRouter);
apiRouter.use("/webhooks", webhookRouter);
apiRouter.use("/brands", brandRouter);
