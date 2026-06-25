import { Router } from "express";
import { BillingController } from "@/controllers/billing.controller";
import { BillingService } from "@/services/billing.service";
import { authenticate } from "@/middleware/auth";

const router = Router();
const service = new BillingService();
const controller = new BillingController(service);

router.post("/create-checkout-session", authenticate, controller.createCheckoutSession);
router.post("/create-portal-session", authenticate, controller.createPortalSession);
router.post("/webhook", controller.webhook);
router.get("/subscription", authenticate, controller.getSubscription);
router.get("/invoices", authenticate, controller.getInvoices);
router.get("/usage-alerts", authenticate, controller.getUsageAlerts);
router.post("/usage-alerts", authenticate, controller.upsertUsageAlert);
router.delete("/usage-alerts/:id", authenticate, controller.deleteUsageAlert);
router.post("/purchase", authenticate, controller.createPurchase);

export { router as billingRouter };
