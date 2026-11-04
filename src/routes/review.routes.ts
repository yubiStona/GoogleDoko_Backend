import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/my-reviews", authenticate, reviewController.getMyReviews);
router.get("/eligibility", authenticate, reviewController.checkEligibility);
router.get("/", reviewController.getAllReviews);

router.post("/", authenticate, reviewController.submitReview);
router.put("/:id", authenticate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);
router.post("/:id/helpful", authenticate, reviewController.voteHelpful);
router.patch("/:id/status", authenticate, reviewController.adminUpdateStatus);

export default router;
