import { Request, Response } from "express";
import { BrandService } from "@/services/brand.service";
import { asyncHandler } from "@/middleware/error";

export class BrandController {
  constructor(private brandService: BrandService) {}

  saveName = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.saveName(req.user!.id, req.body.nameId);
    res.json(result);
  });

  unsaveName = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.unsaveName(req.user!.id, req.body.nameId);
    res.json(result);
  });

  createWishlist = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.createWishlist(req.user!.id, req.body.name);
    res.status(201).json(result);
  });

  listWishlists = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.listWishlists(req.user!.id);
    res.json(result);
  });

  listMoodBoards = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.listMoodBoards(req.user!.id);
    res.json(result);
  });

  createMoodBoard = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.createMoodBoard(req.user!.id, req.body);
    res.status(201).json(result);
  });

  getMoodBoard = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.getMoodBoard(req.user!.id, req.params.id);
    res.json(result);
  });

  checkNameDomains = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.checkNameDomains(req.user!.id, req.params.id, req.body.tlds);
    res.json(result);
  });

  checkNameTrademark = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.checkNameTrademark(req.user!.id, req.params.id);
    res.json(result);
  });

  checkNameSocial = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.checkNameSocial(req.user!.id, req.params.id);
    res.json(result);
  });

  generateTts = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.generateTts(req.user!.id, req.params.id);
    res.json(result);
  });

  getNameDetail = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.getNameDetail(req.user!.id, req.params.id);
    res.json(result);
  });

  updateName = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.brandService.updateName(req.user!.id, req.params.id, req.body);
    res.json(result);
  });
}
