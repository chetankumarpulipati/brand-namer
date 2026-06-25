import { Router } from "express";
import { authenticate, optionalAuth } from "@/middleware/auth";
import { CommunityController } from "@/controllers/community.controller";
import { CommunityService } from "@/services/community.service";

const router = Router();
const service = new CommunityService();
const controller = new CommunityController(service);

// Marketplace
router.get("/marketplace", controller.listMarketplace);
router.post("/marketplace", authenticate, controller.createMarketplaceListing);
router.get("/marketplace/:id", controller.getMarketplaceListing);

// Auctions
router.get("/auctions", controller.listAuctions);
router.post("/auctions", authenticate, controller.createAuction);
router.get("/auctions/:id", controller.getAuction);
router.post("/auctions/:id/bid", authenticate, controller.placeBid);

// Contests
router.get("/contests", controller.listContests);
router.post("/contests", authenticate, controller.createContest);
router.post("/contests/:id/submit", authenticate, controller.submitToContest);

// Polls
router.get("/polls", controller.listPolls);
router.post("/polls", authenticate, controller.createPoll);
router.get("/polls/:id", controller.getPoll);
router.post("/polls/:id/vote", authenticate, controller.votePoll);

// Forum
router.get("/forum/categories", controller.listForumCategories);
router.get("/forum/categories/:id/threads", controller.listForumThreads);
router.post("/forum/threads", authenticate, controller.createForumThread);
router.get("/forum/threads/:id", controller.getForumThread);
router.post("/forum/threads/:id/posts", authenticate, controller.createForumPost);
router.post("/forum/threads/:id/vote", authenticate, controller.voteForumThread);

// Stories
router.get("/stories", controller.listStories);
router.post("/stories", authenticate, controller.createStory);
router.post("/stories/:id/like", authenticate, controller.likeStory);

// Experts
router.get("/experts", controller.listExperts);
router.post("/consultations", authenticate, controller.bookConsultation);

// Portfolios
router.get("/portfolios/:userId", controller.getPortfolio);

// Case Studies
router.get("/case-studies", controller.listCaseStudies);

// Daily Challenge
router.get("/challenges/today", controller.getTodaysChallenge);
router.post("/challenges/:id/submit", authenticate, controller.submitChallenge);

// Quiz
router.post("/quiz", authenticate, controller.submitQuiz);

// Badges
router.get("/badges", controller.listBadges);
router.get("/badges/mine", authenticate, controller.getUserBadges);

// Leaderboard
router.get("/leaderboard", controller.getLeaderboard);

// SEO Directories
router.get("/seo/:industry", controller.getSeoDirectory);

export { router as communityRouter };
