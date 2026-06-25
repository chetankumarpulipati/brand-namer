import { prisma } from "@/config/database";
import { config } from "@/config/env";
import crypto from "crypto";

export class WebhookService {
  async handleStripe(rawBody: string, signature: string) {
    // Stripe webhook is handled in BillingService
    return { received: true };
  }

  async handleSupabase(body: { type?: string; table?: string; record?: Record<string, unknown> }) {
    if (body.type === "INSERT" && body.table === "users") {
      // Handle new Supabase user sync
    }
    return { received: true };
  }

  async handleSlack(body: { challenge?: string; type?: string }) {
    if (body.challenge) return { challenge: body.challenge };
    return { received: true };
  }

  async handleDiscord(body: { type?: number; ping?: boolean }) {
    if (body.type === 1) return { type: 1 };
    return { received: true };
  }

  async handleWhatsApp(body: { messages?: Array<unknown> }) {
    return { received: true };
  }

  async handleTelegram(body: { message?: Record<string, unknown> }) {
    return { received: true };
  }

  async deliverWebhook(url: string, event: string, payload: Record<string, unknown>, secret?: string) {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = secret ? crypto.createHmac("sha256", secret).update(body).digest("hex") : "";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body,
      });
      return { status: response.status, ok: response.ok };
    } catch (error) {
      return { status: 0, ok: false, error: (error as Error).message };
    }
  }
}
