import { prisma } from "@/config/database";
import { AppError } from "@/utils/errors";
import jwt from "jsonwebtoken";
import { config } from "@/config/env";

export class AdminService {
  async getStats() {
    const [
      totalUsers,
      totalSearches,
      totalNames,
      activeSubscriptions,
      totalRevenue,
      searchesToday,
      signupsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.searchHistory.count(),
      prisma.brandName.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
      prisma.searchHistory.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    ]);

    return {
      totalUsers,
      totalSearches,
      totalNames,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      searchesToday,
      signupsToday,
      mrr: Number(totalRevenue._sum.amount ?? 0) / 12,
    };
  }

  async listUsers(page: number, limit: number, search?: string) {
    const where = search
      ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true, tier: true, credits: true,
          totpEnabled: true, createdAt: true, deletedAt: true,
          subscriptions: { select: { status: true, tier: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: { include: { invoices: { orderBy: { createdAt: "desc" }, take: 10 } } },
        _count: { select: { searchHistory: true, brandNames: true, apiKeys: true, sessions: true } },
      },
    });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return user;
  }

  async updateUser(userId: string, data: { role?: string; tier?: string; credits?: number; name?: string }) {
    return prisma.user.update({ where: { id: userId }, data: data as any });
  }

  async deleteUser(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  }

  async impersonate(adminId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    return {
      accessToken: jwt.sign(
        { id: user.id, email: user.email, role: "ADMIN", tier: user.tier },
        config.jwt.secret,
        { expiresIn: "1h" },
      ),
    };
  }

  async getAuditLogs(page: number, limit: number, userId?: string) {
    const where = userId ? { userId } : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async listFeatureFlags() {
    return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async updateFeatureFlag(flagId: string, data: { enabled?: boolean; rules?: Record<string, unknown> }) {
    return prisma.featureFlag.update({ where: { id: flagId }, data: data as any });
  }

  async listWebhooks(page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.webhookConfig.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.webhookConfig.count(),
    ]);
    return { items, total, page, limit };
  }

  async getWebhookLogs(webhookId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { webhookConfigId: webhookId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhookLog.count({ where: { webhookConfigId: webhookId } }),
    ]);
    return { items, total, page, limit };
  }

  async retryWebhook(logId: string) {
    const log = await prisma.webhookLog.findUnique({ where: { id: logId } });
    if (!log) throw new AppError(404, "Webhook log not found", "LOG_NOT_FOUND");
    return prisma.webhookLog.update({ where: { id: logId }, data: { status: "pending" } });
  }
}
