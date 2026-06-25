import Stripe from "stripe";
import { prisma } from "@/config/database";
import { config } from "@/config/env";
import { AppError } from "@/utils/errors";

export class BillingService {
  private stripe: Stripe | null = null;

  private getStripe(): Stripe {
    if (!this.stripe) {
      if (!config.stripe.secretKey) throw new Error("Stripe secret key not configured");
      this.stripe = new Stripe(config.stripe.secretKey, { apiVersion: "2024-06-20" });
    }
    return this.stripe;
  }

  async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.getStripe().customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId },
      });
    }

    const session = await this.getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      allow_promotion_codes: true,
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string, returnUrl: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });
    if (!subscription?.stripeCustomerId) throw new AppError(404, "No Stripe customer found", "NO_CUSTOMER");

    const session = await this.getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: string, signature: string) {
    const event = this.getStripe().webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId) {
          const tier = session.metadata?.tier ?? "PRO";
          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              tier: tier as any,
              status: "active",
              currentPeriodStart: new Date(session.created * 1000),
              currentPeriodEnd: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
              creditsPerDay: tier === "PRO" ? 100 : 10000,
            },
          });
          await prisma.user.update({
            where: { id: userId },
            data: { tier: tier as any },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (subscription) {
            await prisma.invoice.create({
              data: {
                subscriptionId: subscription.id,
                stripeInvoiceId: invoice.id,
                number: invoice.number ?? invoice.id,
                amount: invoice.total / 100,
                currency: invoice.currency,
                status: "paid",
                pdfUrl: invoice.invoice_pdf,
                periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
                periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
                paidAt: new Date(),
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subRecord = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (subRecord) {
          const tier = sub.metadata?.tier ?? (sub.items.data[0]?.price?.nickname === "pro" ? "PRO" : "ENTERPRISE");
          await prisma.subscription.update({
            where: { id: subRecord.id },
            data: {
              status: sub.status,
              currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              tier: tier as any,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: deletedSub.id },
          data: { status: "canceled", tier: "FREE" },
        });
        break;
      }
    }

    return { received: true };
  }

  async getCurrentSubscription(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { usageAlerts: true },
    });
  }

  async getInvoices(userId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { userId }, select: { id: true } });
    if (!subscription) return [];
    return prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getUsageAlerts(userId: string) {
    return prisma.usageAlert.findMany({ where: { userId } });
  }

  async upsertUsageAlert(userId: string, data: { alertType: number; threshold: number; emailEnabled?: boolean; webhookEnabled?: boolean }) {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new AppError(404, "No subscription found", "NO_SUBSCRIPTION");

    const existing = await prisma.usageAlert.findFirst({
      where: { subscriptionId: subscription.id, alertType: data.alertType },
    });

    if (existing) {
      return prisma.usageAlert.update({
        where: { id: existing.id },
        data: {
          threshold: data.threshold,
          emailEnabled: data.emailEnabled ?? existing.emailEnabled,
          webhookEnabled: data.webhookEnabled ?? existing.webhookEnabled,
        },
      });
    }

    return prisma.usageAlert.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        alertType: data.alertType,
        threshold: data.threshold,
        emailEnabled: data.emailEnabled ?? true,
        webhookEnabled: data.webhookEnabled ?? false,
      },
    });
  }

  async deleteUsageAlert(alertId: string) {
    await prisma.usageAlert.delete({ where: { id: alertId } });
  }

  async processOneTimePurchase(userId: string, productId: string, productType: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    const paymentIntent = await this.getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: subscription?.stripeCustomerId ?? undefined,
      metadata: { userId, productId, productType },
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async handlePurchaseSuccess(userId: string, productType: string) {
    const creditsMap: Record<string, number> = {
      logo_gen: 500,
      taglines: 200,
      brand_kit: 1000,
      brand_audit: 2000,
      nft_cert: 100,
      elevator_pitch: 150,
      identity_report: 3000,
    };

    const credits = creditsMap[productType] ?? 100;
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    });

    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: credits,
        type: "PURCHASE",
        description: `One-time purchase: ${productType}`,
      },
    });
  }
}
