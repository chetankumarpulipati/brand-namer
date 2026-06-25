import { Request, Response } from "express";
import { CommunityService } from "@/services/community.service";
import { asyncHandler } from "@/middleware/error";

export class CommunityController {
  constructor(private communityService: CommunityService) {}

  listMarketplace = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listMarketplace(page, limit));
  });

  createMarketplaceListing = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createMarketplaceListing(req.user!.id, req.body));
  });

  getMarketplaceListing = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getMarketplaceListing(req.params.id));
  });

  listAuctions = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listAuctions(page, limit));
  });

  createAuction = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createAuction(req.user!.id, req.body));
  });

  getAuction = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getAuction(req.params.id));
  });

  placeBid = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.placeBid(req.user!.id, req.params.id, req.body.amount));
  });

  listContests = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listContests(page, limit));
  });

  createContest = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createContest(req.user!.id, req.body));
  });

  submitToContest = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.submitToContest(req.user!.id, req.params.id, req.body));
  });

  listPolls = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listPolls(page, limit));
  });

  createPoll = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createPoll(req.user!.id, req.body));
  });

  getPoll = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getPoll(req.params.id));
  });

  votePoll = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.votePoll(req.user!.id, req.params.id, req.body.optionIndex));
  });

  listForumCategories = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.listForumCategories());
  });

  listForumThreads = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listForumThreads(req.params.id, page, limit));
  });

  createForumThread = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createForumThread(req.user!.id, req.body));
  });

  getForumThread = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getForumThread(req.params.id));
  });

  createForumPost = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createForumPost(req.user!.id, req.params.id, req.body.content));
  });

  voteForumThread = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.voteForumThread(req.user!.id, req.params.id, req.body.voteType));
  });

  listStories = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listStories(page, limit));
  });

  createStory = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.createStory(req.user!.id, req.body));
  });

  likeStory = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.likeStory(req.user!.id, req.params.id));
  });

  listExperts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listExperts(page, limit));
  });

  bookConsultation = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.bookConsultation(req.user!.id, req.body));
  });

  getPortfolio = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getPortfolio(req.params.userId));
  });

  listCaseStudies = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.listCaseStudies(page, limit));
  });

  getTodaysChallenge = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getTodaysChallenge());
  });

  submitChallenge = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await this.communityService.submitChallenge(req.user!.id, req.params.id, req.body));
  });

  submitQuiz = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.submitQuiz(req.user!.id, req.body.answers));
  });

  listBadges = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await this.communityService.listBadges());
  });

  getUserBadges = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getUserBadges(req.user!.id));
  });

  getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) ?? "weekly";
    const metricType = (req.query.metricType as string) ?? "xp";
    const limit = parseInt(req.query.limit as string) || 20;
    res.json(await this.communityService.getLeaderboard(period, metricType, limit));
  });

  getSeoDirectory = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.communityService.getSeoDirectory(req.params.industry));
  });
}
