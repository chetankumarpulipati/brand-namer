import crypto from "crypto";
import { prisma } from "@/config/database";
import { AppError } from "@/utils/errors";

export class CommunityService {
  // --- Marketplace ---
  async listMarketplace(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brandName: { select: { name: true, overallScore: true } },
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.marketplaceListing.count({ where: { status: "active" } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createMarketplaceListing(userId: string, data: { brandNameId: string; price: number; description?: string }) {
    const name = await prisma.brandName.findFirst({ where: { id: data.brandNameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return prisma.marketplaceListing.create({
      data: {
        brandNameId: data.brandNameId,
        userId,
        price: data.price,
        description: data.description,
      },
    });
  }

  async getMarketplaceListing(listingId: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        brandName: { include: { domainChecks: true, trademarkChecks: true, socialChecks: true } },
        user: { select: { id: true, name: true, image: true, portfolio: true } },
      },
    });
    if (!listing) throw new AppError(404, "Listing not found", "LISTING_NOT_FOUND");
    return listing;
  }

  // --- Auctions ---
  async listAuctions(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.auctionListing.findMany({
        where: { status: "active" },
        orderBy: { endsAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brandName: { select: { name: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auctionListing.count({ where: { status: "active" } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createAuction(userId: string, data: { brandNameId: string; startPrice: number; reservePrice?: number; duration: number }) {
    const name = await prisma.brandName.findFirst({ where: { id: data.brandNameId, userId } });
    if (!name) throw new AppError(404, "Brand name not found", "NAME_NOT_FOUND");
    return prisma.auctionListing.create({
      data: {
        brandNameId: data.brandNameId,
        userId,
        startPrice: data.startPrice,
        reservePrice: data.reservePrice,
        duration: data.duration,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000),
      },
    });
  }

  async getAuction(auctionId: string) {
    const auction = await prisma.auctionListing.findUnique({
      where: { id: auctionId },
      include: {
        brandName: true,
        user: { select: { id: true, name: true } },
        bids: { orderBy: { amount: "desc" }, take: 10, include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!auction) throw new AppError(404, "Auction not found", "AUCTION_NOT_FOUND");
    return auction;
  }

  async placeBid(userId: string, auctionId: string, amount: number) {
    const auction = await prisma.auctionListing.findUnique({ where: { id: auctionId } });
    if (!auction) throw new AppError(404, "Auction not found", "AUCTION_NOT_FOUND");
    if (auction.status !== "active") throw new AppError(400, "Auction is not active", "AUCTION_CLOSED");
    if (new Date() > auction.endsAt) throw new AppError(400, "Auction has ended", "AUCTION_ENDED");
    if (auction.currentBid && amount <= Number(auction.currentBid)) {
      throw new AppError(400, `Bid must be higher than current bid of $${auction.currentBid}`, "BID_TOO_LOW");
    }
    if (!auction.currentBid && amount < Number(auction.startPrice)) {
      throw new AppError(400, `Bid must be at least $${auction.startPrice}`, "BID_TOO_LOW");
    }

    const bid = await prisma.bid.create({
      data: { auctionId, userId, amount },
    });

    await prisma.auctionListing.update({
      where: { id: auctionId },
      data: { currentBid: amount, bidCount: { increment: 1 } },
    });

    return bid;
  }

  // --- Contests ---
  async listContests(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.contest.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sponsor: { select: { name: true, image: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.contest.count({ where: { status: "active" } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createContest(userId: string, data: { title: string; brief: string; prize: number; deadline: string }) {
    return prisma.contest.create({
      data: {
        sponsorId: userId,
        title: data.title,
        brief: data.brief,
        prize: data.prize,
        deadline: new Date(data.deadline),
        status: "active",
      },
    });
  }

  async submitToContest(userId: string, contestId: string, data: { brandNameId: string; note?: string }) {
    return prisma.contestSubmission.create({
      data: {
        contestId,
        userId,
        brandNameId: data.brandNameId,
        note: data.note,
      },
    });
  }

  // --- Polls ---
  async listPolls(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.poll.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { votes: true } } },
      }),
      prisma.poll.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async createPoll(userId: string, data: { question: string; options: string[]; expiresInHours?: number }) {
    return prisma.poll.create({
      data: {
        userId,
        question: data.question,
        options: data.options,
        expiresAt: data.expiresInHours ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000) : undefined,
        shareToken: crypto.randomUUID(),
      },
    });
  }

  async getPoll(pollId: string) {
    return prisma.poll.findUnique({ where: { id: pollId }, include: { _count: { select: { votes: true } } } });
  }

  async votePoll(userId: string, pollId: string, optionIndex: number) {
    const existing = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });
    if (existing) throw new AppError(400, "Already voted", "ALREADY_VOTED");

    await prisma.pollVote.create({ data: { pollId, userId, optionIndex } });
    await prisma.poll.update({ where: { id: pollId }, data: { totalVotes: { increment: 1 } } });
  }

  // --- Forum ---
  async listForumCategories() {
    return prisma.forumCategory.findMany({ orderBy: { order: "asc" } });
  }

  async listForumThreads(categoryId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.forumThread.findMany({
        where: { categoryId },
        orderBy: [{ isPinned: "desc" }, { lastActivityAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { posts: true, votes: true } },
        },
      }),
      prisma.forumThread.count({ where: { categoryId } }),
    ]);
    return { items, total, page, limit };
  }

  async createForumThread(userId: string, data: { categoryId: string; title: string; content: string }) {
    return prisma.forumThread.create({
      data: {
        categoryId: data.categoryId,
        userId,
        title: data.title,
        posts: { create: { userId, content: data.content } },
      },
    });
  }

  async getForumThread(threadId: string) {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        posts: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!thread) throw new AppError(404, "Thread not found", "THREAD_NOT_FOUND");
    await prisma.forumThread.update({ where: { id: threadId }, data: { viewCount: { increment: 1 } } });
    return thread;
  }

  async createForumPost(userId: string, threadId: string, content: string) {
    const post = await prisma.forumPost.create({
      data: { threadId, userId, content },
    });
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { replyCount: { increment: 1 }, lastActivityAt: new Date() },
    });
    return post;
  }

  async voteForumThread(userId: string, threadId: string, voteType: number) {
    return prisma.forumVote.upsert({
      where: { threadId_userId: { threadId, userId } },
      update: { voteType },
      create: { threadId, userId, voteType },
    });
  }

  // --- Stories ---
  async listStories(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.brandStory.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.brandStory.count({ where: { isPublished: true } }),
    ]);
    return { items, total, page, limit };
  }

  async createStory(userId: string, data: { title: string; content: string; tags?: string[] }) {
    return prisma.brandStory.create({
      data: { userId, title: data.title, content: data.content, tags: data.tags, isPublished: true, publishedAt: new Date() },
    });
  }

  async likeStory(userId: string, storyId: string) {
    const existing = await prisma.storyLike.findUnique({ where: { storyId_userId: { storyId, userId } } });
    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      await prisma.brandStory.update({ where: { id: storyId }, data: { likesCount: { decrement: 1 } } });
      return { liked: false };
    }
    await prisma.storyLike.create({ data: { storyId, userId } });
    await prisma.brandStory.update({ where: { id: storyId }, data: { likesCount: { increment: 1 } } });
    return { liked: true };
  }

  // --- Experts ---
  async listExperts(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.expertProfile.findMany({
        where: { isAvailable: true },
        orderBy: { rating: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      prisma.expertProfile.count({ where: { isAvailable: true } }),
    ]);
    return { items, total, page, limit };
  }

  async bookConsultation(userId: string, data: { expertId: string; scheduledAt: string; duration?: number }) {
    return prisma.consultation.create({
      data: {
        expertId: data.expertId,
        clientId: userId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration ?? 60,
        status: "pending",
      },
    });
  }

  // --- Portfolios ---
  async getPortfolio(targetUserId: string) {
    const portfolio = await prisma.userPortfolio.findUnique({
      where: { userId: targetUserId },
      include: { user: { select: { name: true, image: true } } },
    });
    if (!portfolio) throw new AppError(404, "Portfolio not found", "PORTFOLIO_NOT_FOUND");
    return portfolio;
  }

  // --- Case Studies ---
  async listCaseStudies(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.caseStudy.findMany({
        where: { isPublished: true, isFree: true },
        orderBy: { rating: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, image: true } } },
      }),
      prisma.caseStudy.count({ where: { isPublished: true, isFree: true } }),
    ]);
    return { items, total, page, limit };
  }

  // --- Daily Challenge ---
  async getTodaysChallenge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let challenge = await prisma.dailyChallenge.findUnique({ where: { dayDate: today } });
    if (!challenge) {
      challenge = await prisma.dailyChallenge.create({
        data: {
          prompt: "Create a brand name for a futuristic sustainable energy company",
          dayDate: today,
        },
      });
    }
    return challenge;
  }

  async submitChallenge(userId: string, challengeId: string, data: { brandNameId: string }) {
    return prisma.challengeSubmission.create({
      data: { challengeId, userId, brandNameId: data.brandNameId },
    });
  }

  // --- Quiz ---
  async submitQuiz(userId: string, answers: Record<string, string>) {
    const styles = ["Modern Minimalist", "Bold & Edgy", "Classic Elegant", "Playful & Fun", "Tech-forward"];
    const style = styles[Math.floor(Math.random() * styles.length)];

    return prisma.quizResult.create({
      data: {
        userId,
        answers,
        style,
        recommendations: { styles: [style], keywords: [], colorPalette: [] },
      },
    });
  }

  // --- Badges ---
  async listBadges() {
    return prisma.badge.findMany({ orderBy: { name: "asc" } });
  }

  async getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
  }

  // --- Leaderboard ---
  async getLeaderboard(period = "weekly", metricType = "xp", limit = 20) {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { period, metricType },
      orderBy: { points: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return { items: entries, period, metricType };
  }

  // --- SEO Directories ---
  async getSeoDirectory(industry: string) {
    const dir = await prisma.seoDirectory.findFirst({ where: { slug: industry } });
    if (dir) return dir;
    return {
      industry,
      title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Brand Names`,
      names: [],
      isGenerated: false,
    };
  }
}
