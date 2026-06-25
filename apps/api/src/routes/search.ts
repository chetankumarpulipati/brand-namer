import { Router } from "express";
import { SearchController } from "@/controllers/search.controller";
import { SearchService } from "@/services/search.service";
import { validate } from "@/middleware/error";
import { authenticate, optionalAuth } from "@/middleware/auth";
import { rateLimit } from "@/middleware/rateLimit";
import { z } from "zod";

const router = Router();
const service = new SearchService();
const controller = new SearchController(service);

const searchSchema = z.object({
  body: z.object({
    query: z.string().min(1).max(500),
    industry: z.string().optional(),
    strategies: z.array(z.enum(["ACRONYM", "COMPOUND", "THESAURUS", "EMOTIONAL", "METAPHOR", "PORTMANTEAU", "GENERATIVE"])).optional(),
    count: z.number().int().min(1).max(50).optional().default(10),
    brief: z.string().max(5000).optional(),
  }),
});

const bulkSchema = z.object({
  body: z.object({
    keywords: z.array(z.string().min(1)).min(1).max(500),
    countPerKeyword: z.number().int().min(1).max(20).optional().default(5),
    industry: z.string().optional(),
  }),
});

const domainSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    tlds: z.array(z.string()).min(1).max(20).optional(),
  }),
});

router.post("/", authenticate, rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "search" }), validate(searchSchema), controller.search);
router.post("/bulk", authenticate, rateLimit({ windowMs: 300_000, max: 5, keyPrefix: "bulk" }), validate(bulkSchema), controller.bulkSearch);
router.get("/history", authenticate, controller.history);
router.get("/history/:id", authenticate, controller.historyDetail);
router.post("/domain", authenticate, rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "domain" }), validate(domainSchema), controller.checkDomain);
router.post("/trademark", authenticate, rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "trademark" }), controller.checkTrademark);
router.post("/social", authenticate, rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "social" }), controller.checkSocial);
router.get("/saved", authenticate, controller.savedNames);

export { router as searchRouter };
