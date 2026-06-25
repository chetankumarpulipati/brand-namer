import { prisma } from "@/config/database";
import { AppError } from "@/utils/errors";
import { AiProvider, createAiProvider } from "@/providers/ai.provider";
import { checkDomainAvailability } from "@/providers/domain.provider";
import { checkTrademark } from "@/providers/trademark.provider";
import { checkSocialHandles } from "@/providers/social.provider";

interface GenerateNamesParams {
  userId: string;
  query: string;
  industry?: string;
  strategies?: string[];
  count?: number;
  brief?: string;
}

interface BulkGenerateParams {
  userId: string;
  keywords: string[];
  countPerKeyword?: number;
  industry?: string;
}

const SCORING_PROMPT = `You are a brand naming expert. Score each name on these dimensions (0-100):
- Memorability: How easy is it to remember?
- Pronounceability: How easy is it to say?
- Meaning: Does it convey the brand's essence?
- Uniqueness: How distinctive is it?
- SEO: How search-engine friendly is it?

Return a JSON object with scores and an overall score (weighted average).`;

export class SearchService {
  private ai: AiProvider | null = null;

  private getAi(): AiProvider {
    if (!this.ai) {
      try {
        this.ai = createAiProvider();
      } catch {
        throw new Error("AI provider not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
      }
    }
    return this.ai;
  }

  async generateNames(params: GenerateNamesParams) {
    await this.deductCredits(params.userId, 1);

    const strategies = params.strategies ?? [
      "ACRONYM", "COMPOUND", "THESAURUS", "EMOTIONAL", "METAPHOR", "PORTMANTEAU",
    ];

    const results: Array<{
      name: string;
      strategy: string;
      meaning?: string;
      scores?: { memorability: number; pronounceability: number; meaning: number; uniqueness: number; seo: number; overall: number; explanation?: string };
    }> = [];

    for (const strategy of strategies.slice(0, 3)) {
      const generated = await this.generateWithStrategy(strategy, params.query, params.industry, params.brief, params.count ?? 10);
      for (const item of generated) {
        const scores = await this.scoreName(item.name, params.query);
        results.push({ name: item.name, strategy, meaning: item.meaning, scores });
      }
    }

    results.sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0));
    const topResults = results.slice(0, params.count ?? 10);

    // Save to DB
    const searchRecord = await prisma.searchHistory.create({
      data: {
        userId: params.userId,
        query: params.query,
        industry: params.industry,
        strategies,
        resultCount: topResults.length,
        metadata: { brief: params.brief },
      },
    });

    for (const r of topResults) {
      await prisma.brandName.create({
        data: {
          searchHistoryId: searchRecord.id,
          userId: params.userId,
          name: r.name,
          strategy: r.strategy as any,
          meaning: r.meaning ?? r.scores?.explanation,
          memorability: r.scores?.memorability,
          pronounceability: r.scores?.pronounceability,
          uniqueness: r.scores?.uniqueness,
          seoScore: r.scores?.seo,
          overallScore: r.scores?.overall,
        },
      });
    }

    return {
      id: searchRecord.id,
      query: params.query,
      industry: params.industry,
      results: topResults,
      generatedAt: searchRecord.createdAt,
    };
  }

  async bulkGenerate(params: BulkGenerateParams) {
    await this.deductCredits(params.userId, params.keywords.length);

    const allResults = [];
    for (const keyword of params.keywords) {
      const names = await this.generateWithStrategy("COMPOUND", keyword, params.industry, undefined, params.countPerKeyword ?? 5);
      for (const name of names) {
        const scores = await this.scoreName(name, keyword);
        allResults.push({ keyword, name, scores });
      }
    }

    const searchRecord = await prisma.searchHistory.create({
      data: {
        userId: params.userId,
        query: `Bulk: ${params.keywords.slice(0, 3).join(", ")}...`,
        industry: params.industry,
        strategies: ["COMPOUND"],
        resultCount: allResults.length,
        metadata: { keywords: params.keywords, isBulk: true },
      },
    });

    for (const r of allResults) {
      await prisma.brandName.create({
        data: {
          searchHistoryId: searchRecord.id,
          userId: params.userId,
          name: r.name,
          strategy: "COMPOUND",
          meaning: r.scores?.explanation,
          memorability: r.scores?.memorability,
          pronounceability: r.scores?.pronounceability,
          uniqueness: r.scores?.uniqueness,
          seoScore: r.scores?.seo,
          overallScore: r.scores?.overall,
          metadata: { sourceKeyword: r.keyword },
        },
      });
    }

    return {
      id: searchRecord.id,
      totalGenerated: allResults.length,
      keywordCount: params.keywords.length,
      results: allResults,
    };
  }

  async getHistory(userId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { names: true } } },
      }),
      prisma.searchHistory.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getHistoryDetail(userId: string, id: string) {
    const history = await prisma.searchHistory.findFirst({
      where: { id, userId },
      include: {
        names: {
          orderBy: { overallScore: "desc" },
          include: {
            domainChecks: true,
            trademarkChecks: true,
            socialChecks: true,
          },
        },
      },
    });
    if (!history) throw new AppError(404, "Search history not found", "HISTORY_NOT_FOUND");
    return history;
  }

  async checkDomain(name: string, tlds?: string[]) {
    return checkDomainAvailability(name, tlds);
  }

  async checkTrademark(name: string) {
    return checkTrademark(name);
  }

  async checkSocialHandles(name: string) {
    return checkSocialHandles(name);
  }

  async getSavedNames(userId: string) {
    return prisma.brandName.findMany({
      where: { userId, isSaved: true },
      orderBy: { updatedAt: "desc" },
      include: {
        domainChecks: { take: 1, orderBy: { checkedAt: "desc" } },
        trademarkChecks: { take: 1, orderBy: { checkedAt: "desc" } },
        socialChecks: { take: 20, orderBy: { checkedAt: "desc" } },
      },
    });
  }

  private async generateWithStrategy(
    strategy: string,
    query: string,
    industry?: string,
    brief?: string,
    count: number = 10,
  ): Promise<Array<{ name: string; meaning?: string }>> {
    const strategyPrompts: Record<string, string> = {
      ACRONYM: "Take descriptive phrases about the concept and use their initial letters to form a short, catchy acronym name.",
      COMPOUND: "Combine two meaningful words — one from the concept, one evoking trust, growth, or innovation — into a single brandable name.",
      THESAURUS: "Find rare, sophisticated synonyms or ancient roots (Latin, Greek) related to the concept and turn them into a modern brand name.",
      EMOTIONAL: "Create a name that evokes a specific feeling — ambition, calm, joy, strength — tied to what the brand stands for.",
      METAPHOR: "Use symbolic imagery from nature, science, mythology, or architecture to represent the concept indirectly.",
      PORTMANTEAU: "Blend two words together, taking the start of one and the end of the other, to form a completely new word.",
      GENERATIVE: "Invent a completely novel, made-up word that sounds like it could be a real brand — think Kodak, Sony, Zappos.",
    };

    const prompt = `You are a professional brand naming strategist. Generate ${count} unique, creative brand names using the "${strategy}" strategy.
${strategyPrompts[strategy] ?? ""}

Brand concept: "${query}"${industry ? `\nIndustry: ${industry}` : ""}${brief ? `\nBrand brief: ${brief}` : ""}

Rules:
- Name must be 2-12 characters long
- Easy to pronounce and spell
- Must feel like a real brand (not a description)
- No existing major brands or generic terms
- Available as .com domain

For EACH name, also provide a 1-sentence meaning/etymology.

Return ONLY a JSON array of objects: [{"name": "...", "meaning": "..."}]`;

    const response = await this.getAi().generate(prompt, { temperature: 0.9 });
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, count).map((item: unknown) => {
          if (typeof item === "string") return { name: item };
          if (typeof item === "object" && item !== null) {
            const obj = item as Record<string, unknown>;
            return { name: String(obj.name ?? ""), meaning: obj.meaning ? String(obj.meaning) : undefined };
          }
          return { name: "" };
        }).filter((x) => x.name);
      }
      return [];
    } catch {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, count).map((item: unknown) => {
              if (typeof item === "string") return { name: item };
              if (typeof item === "object" && item !== null) {
                const obj = item as Record<string, unknown>;
                return { name: String(obj.name ?? ""), meaning: obj.meaning ? String(obj.meaning) : undefined };
              }
              return { name: "" };
            }).filter((x) => x.name);
          }
        } catch {}
      }
      return response.split("\n").filter((l) => l.trim()).slice(0, count).map((n) => ({ name: n }));
    }
  }

  private async scoreName(
    name: string,
    context: string,
  ): Promise<{
    memorability: number;
    pronounceability: number;
    meaning: number;
    uniqueness: number;
    seo: number;
    overall: number;
    explanation?: string;
  }> {
    const prompt = `Evaluate this brand name: "${name}"
Context: ${context}

${SCORING_PROMPT}

Also provide a brief meaning/etymology (1 sentence).
Return JSON: { "memorability": 0-100, "pronounceability": 0-100, "meaning": 0-100, "uniqueness": 0-100, "seo": 0-100, "overall": 0-100, "explanation": "brief meaning" }`;

    try {
      const response = await this.getAi().generate(prompt, { temperature: 0.3 });
      const parsed = JSON.parse(response);
      return {
        memorability: Math.round(parsed.memorability ?? 50),
        pronounceability: Math.round(parsed.pronounceability ?? 50),
        meaning: Math.round(parsed.meaning ?? 50),
        uniqueness: Math.round(parsed.uniqueness ?? 50),
        seo: Math.round(parsed.seo ?? 50),
        overall: Math.round(parsed.overall ?? 50),
        explanation: parsed.explanation ?? "",
      };
    } catch {
      return {
        memorability: Math.round(Math.random() * 40 + 60),
        pronounceability: Math.round(Math.random() * 40 + 60),
        meaning: Math.round(Math.random() * 40 + 60),
        uniqueness: Math.round(Math.random() * 40 + 60),
        seo: Math.round(Math.random() * 40 + 60),
        overall: 75,
        explanation: "",
      };
    }
  }

  private async deductCredits(userId: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true, tier: true } });
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    if (user.credits < amount) {
      const subscription = await prisma.subscription.findUnique({ where: { userId } });
      if (!subscription || subscription.tier === "FREE") {
        throw new AppError(402, "Insufficient credits. Please upgrade your plan.", "INSUFFICIENT_CREDITS");
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });

    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "SEARCH",
        description: "Brand name generation",
      },
    });
  }
}
