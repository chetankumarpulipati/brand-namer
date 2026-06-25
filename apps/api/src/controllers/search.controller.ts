import { Request, Response } from "express";
import { SearchService } from "@/services/search.service";
import { asyncHandler } from "@/middleware/error";

export class SearchController {
  constructor(private searchService: SearchService) {}

  search = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.generateNames({
      userId: req.user!.id,
      query: req.body.query,
      industry: req.body.industry,
      strategies: req.body.strategies,
      count: req.body.count,
      brief: req.body.brief,
    });
    res.json(result);
  });

  bulkSearch = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.bulkGenerate({
      userId: req.user!.id,
      keywords: req.body.keywords,
      countPerKeyword: req.body.countPerKeyword,
      industry: req.body.industry,
    });
    res.json(result);
  });

  history = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await this.searchService.getHistory(req.user!.id, page, limit);
    res.json(result);
  });

  historyDetail = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.getHistoryDetail(req.user!.id, req.params.id);
    res.json(result);
  });

  checkDomain = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.checkDomain(req.body.name, req.body.tlds);
    res.json(result);
  });

  checkTrademark = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.checkTrademark(req.body.name);
    res.json(result);
  });

  checkSocial = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.checkSocialHandles(req.body.name);
    res.json(result);
  });

  savedNames = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.searchService.getSavedNames(req.user!.id);
    res.json(result);
  });
}
