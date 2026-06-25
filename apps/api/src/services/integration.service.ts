import { prisma } from "@/config/database";

export class IntegrationService {
  async list(userId: string) {
    return prisma.integration.findMany({
      where: { userId, isActive: true },
      select: { id: true, platform: true, isActive: true, createdAt: true, platformData: true },
    });
  }

  async connect(userId: string, data: { platform: string; accessToken: string; refreshToken?: string; platformUserId?: string; platformData?: Record<string, unknown> }) {
    return prisma.integration.upsert({
      where: { userId_platform: { userId, platform: data.platform } },
      update: { accessToken: data.accessToken, refreshToken: data.refreshToken, platformUserId: data.platformUserId, platformData: data.platformData as any, isActive: true },
      create: { userId, platform: data.platform, accessToken: data.accessToken, refreshToken: data.refreshToken, platformUserId: data.platformUserId, platformData: data.platformData as any },
    });
  }

  async disconnect(userId: string, integrationId: string) {
    await prisma.integration.update({
      where: { id: integrationId, userId },
      data: { isActive: false },
    });
  }

  async handleSlackCommand(body: { text?: string; user_name?: string }) {
    const query = body.text ?? "tech startup";
    return {
      response_type: "ephemeral",
      text: `🤖 *Brand Namer* — Here are 5 names for "${query}":\n1. Nexify\n2. BrandVault\n3. Lumina\n4. VoxCore\n5. ZenForge\n\nUse /brandnamer <brief> to try again!`,
    };
  }

  async handleDiscordInteraction(body: { data?: { name?: string; options?: Array<{ value?: string }> } }) {
    const query = body.data?.options?.[0]?.value ?? "tech startup";
    return {
      type: 4,
      data: {
        content: `✨ *Brand Namer Results for "${query}"*\n\n**1.** Nexify\n**2.** BrandVault\n**3.** Lumina\n**4.** VoxCore\n**5.** ZenForge\n\nVisit brandnamer.com for more!`,
        flags: 64,
      },
    };
  }

  async handleWhatsAppWebhook(body: { messages?: Array<{ from?: string; text?: { body?: string } }> }) {
    const message = body.messages?.[0];
    if (!message) return { status: "ok" };
    const query = message.text?.body ?? "tech startup";
    return {
      messaging_product: "whatsapp",
      to: message.from,
      text: { body: `🧠 Brand Namer — Top names for "${query}":\n1. Nexify\n2. BrandVault\n3. Lumina\n4. VoxCore\n5. ZenForge` },
    };
  }

  async handleTelegramWebhook(body: { message?: { text?: string; chat?: { id?: number } } }) {
    const query = body.message?.text?.replace("/start", "").replace("/generate", "").trim() ?? "tech startup";
    return {
      method: "sendMessage",
      chat_id: body.message?.chat?.id,
      text: `🤖 Brand Namer — Names for "${query}":\n1. Nexify\n2. BrandVault\n3. Lumina\n4. VoxCore\n5. ZenForge`,
    };
  }

  async handleZapierExecute(body: { query?: string }) {
    const query = body.query ?? "tech startup";
    return {
      names: ["Nexify", "BrandVault", "Lumina", "VoxCore", "ZenForge"],
      query,
      generatedAt: new Date().toISOString(),
    };
  }
}
