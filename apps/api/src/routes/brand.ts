import { Router } from "express";
import { BrandController } from "@/controllers/brand.controller";
import { BrandService } from "@/services/brand.service";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/error";
import { z } from "zod";

const router = Router();
const service = new BrandService();
const controller = new BrandController(service);

const saveNameSchema = z.object({
  body: z.object({
    nameId: z.string().uuid(),
  }),
});

const wishlistSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
  }),
});

router.post("/save", authenticate, validate(saveNameSchema), controller.saveName);
router.post("/unsave", authenticate, validate(saveNameSchema), controller.unsaveName);
router.post("/wishlist", authenticate, validate(wishlistSchema), controller.createWishlist);
router.get("/wishlists", authenticate, controller.listWishlists);
router.get("/moodboards", authenticate, controller.listMoodBoards);
router.post("/moodboards", authenticate, controller.createMoodBoard);
router.get("/moodboards/:id", authenticate, controller.getMoodBoard);
router.post("/name/:id/domain", authenticate, controller.checkNameDomains);
router.post("/name/:id/trademark", authenticate, controller.checkNameTrademark);
router.post("/name/:id/social", authenticate, controller.checkNameSocial);
router.post("/name/:id/tts", authenticate, controller.generateTts);
router.get("/name/:id", authenticate, controller.getNameDetail);
router.put("/name/:id", authenticate, controller.updateName);

export { router as brandRouter };
