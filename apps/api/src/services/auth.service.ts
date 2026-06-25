import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { prisma } from "@/config/database";
import { config } from "@/config/env";
import { AppError, UnauthorizedError, ConflictError } from "@/utils/errors";

export class AuthService {
  async register(data: { email: string; password: string; name: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: "VIEWER",
        tier: "FREE",
        subscriptions: {
          create: { tier: "FREE", creditsPerDay: 3, dailyCreditsUsed: 0 },
        },
        portfolio: { create: { displayName: data.name } },
      },
      select: { id: true, email: true, name: true, role: true, tier: true, createdAt: true },
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedError("Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    if (user.totpEnabled) {
      return { requiresTotp: true, userId: user.id };
    }

    const tokens = this.generateTokens(user);
    await this.createSession(user.id);

    return {
      user: {
        id: user.id, email: user.email, name: user.name,
        role: user.role, tier: user.tier, image: user.image,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, role: true, tier: true, image: true },
      });
      if (!user) throw new UnauthorizedError("User not found");
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, image: true, role: true, tier: true,
        credits: true, lifetimeCredits: true, xp: true, level: true,
        totpEnabled: true, createdAt: true,
        subscriptions: { select: { status: true, tier: true, currentPeriodEnd: true } },
        _count: { select: { brandNames: true, searchHistory: true, wishlists: true } },
      },
    });
    if (!user) throw new UnauthorizedError("User not found");
    return user;
  }

  async setupTotp(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(userId, "Brand Namer", secret);
    const qrCode = await toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    });

    return { secret, qrCode, otpauth };
  }

  async verifyTotpSetup(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true } });
    if (!user?.totpSecret) throw new AppError(400, "TOTP not initialized", "TOTP_NOT_INIT");

    const valid = authenticator.verify({ token, secret: user.totpSecret });
    if (!valid) throw new AppError(400, "Invalid TOTP token", "INVALID_TOTP");

    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
  }

  async disableTotp(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
  }

  async listSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, isActive: true },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  private generateTokens(user: { id: string; email: string; role: string; tier: string }) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tier: user.tier },
      config.jwt.secret,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: "7d" },
    );
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async createSession(userId: string) {
    await prisma.session.create({
      data: {
        userId,
        sessionToken: crypto.randomUUID(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }
}
