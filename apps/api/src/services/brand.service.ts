import { prisma } from "@/config/database";
import { AppError } from "@/utils/errors";
import { checkDomainAvailability } from "@/providers/domain.provider";
import { checkTrademark } from "@/providers/trademark.provider";
import { checkSocialHandles } from "@/providers/social.provider";

export class BrandService {

  async saveName(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return prisma.brandName.update({ where: { id: nameId }, data: { isSaved: true } });
  }

  async unsaveName(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return prisma.brandName.update({ where: { id: nameId }, data: { isSaved: false } });
  }

  async createWishlist(userId: string, name: string) {
    return prisma.wishlist.create({ data: { userId, name } });
  }

  async listWishlists(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        items: {
          include: { brandName: { select: { id: true, name: true, overallScore: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listMoodBoards(userId: string) {
    return prisma.moodBoard.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createMoodBoard(userId: string, data: { name: string; description?: string }) {
    return prisma.moodBoard.create({
      data: { userId, name: data.name, description: data.description },
    });
  }

  async getMoodBoard(userId: string, boardId: string) {
    const board = await prisma.moodBoard.findFirst({
      where: { id: boardId, userId },
      include: {
        items: {
          include: { brandName: { select: { id: true, name: true } } },
          orderBy: { zIndex: "asc" },
        },
      },
    });
    if (!board) throw new AppError(404, "Mood board not found", "BOARD_NOT_FOUND");
    return board;
  }

  async checkNameDomains(userId: string, nameId: string, tlds?: string[]) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return checkDomainAvailability(name.name, tlds);
  }

  async checkNameTrademark(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return checkTrademark(name.name);
  }

  async checkNameSocial(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return checkSocialHandles(name.name);
  }

  async generateTts(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");

    const ttsUrl = `https://tts.brandnamer.com/audio/${name.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.mp3`;
    await prisma.brandName.update({ where: { id: nameId }, data: { pronunciationUrl: ttsUrl } });
    return { url: ttsUrl };
  }

  async getNameDetail(userId: string, nameId: string) {
    const name = await prisma.brandName.findFirst({
      where: { id: nameId, userId },
      include: {
        domainChecks: { orderBy: { checkedAt: "desc" } },
        trademarkChecks: { orderBy: { checkedAt: "desc" } },
        socialChecks: { orderBy: { checkedAt: "desc" } },
        versionHistories: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return name;
  }

  async updateName(userId: string, nameId: string, data: { name?: string; isSaved?: boolean }) {
    const name = await prisma.brandName.findFirst({ where: { id: nameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");

    const updated = await prisma.brandName.update({
      where: { id: nameId },
      data: { name: data.name, isSaved: data.isSaved },
    });

    if (data.name && data.name !== name.name) {
      await prisma.versionHistory.create({
        data: {
          brandNameId: nameId,
          userId,
          field: "name",
          oldValue: name.name,
          newValue: data.name,
        },
      });
    }

    return updated;
  }
}
