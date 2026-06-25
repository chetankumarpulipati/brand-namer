import { prisma } from "@/config/database";
import { AppError } from "@/utils/errors";
import crypto from "crypto";

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, image: true, role: true, tier: true,
        credits: true, lifetimeCredits: true, xp: true, level: true,
        totpEnabled: true, createdAt: true,
        subscriptions: {
          select: { tier: true, status: true, creditsPerDay: true, currentPeriodEnd: true },
        },
      },
    });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, image: true, role: true, tier: true },
    });
  }

  async getCredits(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, lifetimeCredits: true, tier: true },
    });
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { creditsPerDay: true, dailyCreditsUsed: true, lastCreditResetAt: true },
    });
    return { ...user, subscription: sub };
  }

  async getTransactions(userId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.creditTransaction.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createApiKey(userId: string, name: string, scopes?: string[]) {
    const raw = `bn_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = raw.slice(0, 12);
    const keyHash = crypto.createHash("sha256").update(raw).digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        keyPrefix,
        keyHash,
        name,
        scopes: JSON.stringify(scopes ?? ["read"]),
      },
    });

    return { id: apiKey.id, name: apiKey.name, keyPrefix: apiKey.keyPrefix, rawKey: raw, scopes: apiKey.scopes };
  }

  async listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeApiKey(userId: string, keyId: string) {
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new AppError(404, "API key not found", "KEY_NOT_FOUND");
    await prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
  }

  // --- Webhook Configs ---
  async listWebhookConfigs(userId: string) {
    return prisma.webhookConfig.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async createWebhookConfig(userId: string, data: { url: string; events: string[]; secret?: string }) {
    return prisma.webhookConfig.create({
      data: {
        userId,
        url: data.url,
        events: data.events,
        secret: data.secret ?? crypto.randomBytes(16).toString("hex"),
      },
    });
  }

  async updateWebhookConfig(userId: string, id: string, data: { url?: string; events?: string[]; isActive?: boolean }) {
    const config = await prisma.webhookConfig.findFirst({ where: { id, userId } });
    if (!config) throw new AppError(404, "Webhook config not found", "WEBHOOK_NOT_FOUND");
    return prisma.webhookConfig.update({ where: { id }, data });
  }

  async deleteWebhookConfig(userId: string, id: string) {
    const config = await prisma.webhookConfig.findFirst({ where: { id, userId } });
    if (!config) throw new AppError(404, "Webhook config not found", "WEBHOOK_NOT_FOUND");
    await prisma.webhookConfig.delete({ where: { id } });
  }

  async getWebhookLogs(userId: string, configId: string) {
    const config = await prisma.webhookConfig.findFirst({ where: { id: configId, userId } });
    if (!config) throw new AppError(404, "Webhook config not found", "WEBHOOK_NOT_FOUND");
    return prisma.webhookLog.findMany({
      where: { webhookConfigId: configId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // --- Email Signatures ---
  async listEmailSignatures(userId: string) {
    return prisma.emailSignature.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async createEmailSignature(userId: string, data: { name: string; title?: string; company?: string; html: string }) {
    return prisma.emailSignature.create({
      data: { userId, name: data.name, title: data.title, company: data.company, html: data.html },
    });
  }

  async deleteEmailSignature(userId: string, id: string) {
    const sig = await prisma.emailSignature.findFirst({ where: { id, userId } });
    if (!sig) throw new AppError(404, "Email signature not found", "SIG_NOT_FOUND");
    await prisma.emailSignature.delete({ where: { id } });
  }

  // --- Social Posts ---
  async listSocialPosts(userId: string) {
    return prisma.socialPost.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async createSocialPost(userId: string, data: { platform: string; content: string; mediaUrl?: string; brandNameId?: string }) {
    return prisma.socialPost.create({
      data: { userId, platform: data.platform, content: data.content, mediaUrl: data.mediaUrl, brandNameId: data.brandNameId },
    });
  }

  async deleteSocialPost(userId: string, id: string) {
    const post = await prisma.socialPost.findFirst({ where: { id, userId } });
    if (!post) throw new AppError(404, "Social post not found", "POST_NOT_FOUND");
    await prisma.socialPost.delete({ where: { id } });
  }

  // --- Shareable Cards ---
  async listShareableCards(userId: string) {
    return prisma.shareableCard.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async createShareableCard(userId: string, data: { brandNameId: string; title?: string }) {
    const shortCode = crypto.randomBytes(4).toString("hex");
    return prisma.shareableCard.create({
      data: { userId, brandNameId: data.brandNameId, title: data.title, shortCode },
    });
  }

  async deleteShareableCard(userId: string, id: string) {
    const card = await prisma.shareableCard.findFirst({ where: { id, userId } });
    if (!card) throw new AppError(404, "Shareable card not found", "CARD_NOT_FOUND");
    await prisma.shareableCard.delete({ where: { id } });
  }
}
