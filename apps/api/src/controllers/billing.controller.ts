import { Request, Response } from "express";
import { BillingService } from "@/services/billing.service";
import { asyncHandler } from "@/middleware/error";

export class BillingController {
  constructor(private billingService: BillingService) {}

  createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.createCheckoutSession(
      req.user!.id,
      req.body.priceId,
      req.body.successUrl,
      req.body.cancelUrl,
    );
    res.json(result);
  });

  createPortalSession = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.createPortalSession(req.user!.id, req.body.returnUrl);
    res.json(result);
  });

  webhook = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    const result = await this.billingService.handleWebhook(JSON.stringify(req.body), sig);
    res.json(result);
  });

  getSubscription = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.getCurrentSubscription(req.user!.id);
    res.json(result);
  });

  getInvoices = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.getInvoices(req.user!.id);
    res.json(result);
  });

  getUsageAlerts = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.getUsageAlerts(req.user!.id);
    res.json(result);
  });

  upsertUsageAlert = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.upsertUsageAlert(req.user!.id, req.body);
    res.json(result);
  });

  deleteUsageAlert = asyncHandler(async (req: Request, res: Response) => {
    await this.billingService.deleteUsageAlert(req.params.id);
    res.json({ message: "Alert deleted" });
  });

  createPurchase = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.billingService.processOneTimePurchase(
      req.user!.id,
      req.body.productId,
      req.body.productType,
      req.body.amount,
    );
    res.json(result);
  });
}
