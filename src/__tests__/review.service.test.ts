import { describe, it, expect, vi, beforeEach } from "vitest";
import reviewService from "../services/review.service";
import {
  reviewRepository,
  reviewHelpfulVoteRepository,
  productRepository,
  orderRepository,
  userRepository,
} from "../repository";

describe("Customer Review & Rating System Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Review Eligibility", () => {
    it("denies review if user never purchased the product", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      vi.spyOn(orderRepository, "find").mockResolvedValue([]);

      const result = await reviewService.checkUserReviewEligibility("prod-1", 101);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe("NOT_PURCHASED_OR_DELIVERED");
    });

    it("denies review if order containing the product is still processing or shipped (not delivered)", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      const mockOrder = {
        id: "GD-ORD-1",
        userId: 101,
        status: "Processing",
        itemsJson: JSON.stringify([{ productId: "prod-1", status: "Processing" }]),
      };
      vi.spyOn(orderRepository, "find").mockResolvedValue([mockOrder as any]);

      const result = await reviewService.checkUserReviewEligibility("prod-1", 101);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe("NOT_PURCHASED_OR_DELIVERED");
    });

    it("denies review if order was cancelled", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      const mockOrder = {
        id: "GD-ORD-2",
        userId: 101,
        status: "Cancelled",
        itemsJson: JSON.stringify([{ productId: "prod-1", status: "Delivered" }]),
      };
      vi.spyOn(orderRepository, "find").mockResolvedValue([mockOrder as any]);

      const result = await reviewService.checkUserReviewEligibility("prod-1", 101);
      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe("NOT_PURCHASED_OR_DELIVERED");
    });

    it("allows review if order item is delivered", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      const mockOrder = {
        id: "GD-ORD-3",
        userId: 101,
        status: "Delivered",
        itemsJson: JSON.stringify([{ productId: "prod-1", name: "Apple", status: "Delivered" }]),
      };
      vi.spyOn(orderRepository, "find").mockResolvedValue([mockOrder as any]);

      const result = await reviewService.checkUserReviewEligibility("prod-1", 101);
      expect(result.isEligible).toBe(true);
      expect(result.eligibleOrderId).toBe("GD-ORD-3");
    });

    it("reports already reviewed if customer already reviewed that product", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue({
        id: 55,
        rating: 5,
        title: "Great taste",
        body: "Very crisp apples",
        orderId: "GD-ORD-3",
        createdAt: new Date(),
      } as any);

      const result = await reviewService.checkUserReviewEligibility("prod-1", 101);
      expect(result.isEligible).toBe(false);
      expect(result.alreadyReviewed).toBe(true);
      expect(result.reason).toBe("ALREADY_REVIEWED");
    });
  });

  describe("Submitting Reviews", () => {
    it("throws error if customer attempts to review unverified product", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({ id: "prod-1", name: "Apple" } as any);
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      vi.spyOn(orderRepository, "find").mockResolvedValue([]);

      await expect(
        reviewService.addReview({
          productId: "prod-1",
          userId: 101,
          rating: 5,
          body: "Tried to review without buying",
        })
      ).rejects.toThrow("NOT_ELIGIBLE_UNVERIFIED_PURCHASE");
    });

    it("creates verified review for delivered product and recomputes rating", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "prod-1",
        name: "Apple",
        rating: 4.0,
      } as any);
      vi.spyOn(productRepository, "save").mockResolvedValue({} as any);

      // Eligibility mock
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(null);
      const mockOrder = {
        id: "GD-ORD-DELIVERED",
        userId: 101,
        status: "Delivered",
        itemsJson: JSON.stringify([{ productId: "prod-1", status: "Delivered" }]),
      };
      vi.spyOn(orderRepository, "find").mockResolvedValue([mockOrder as any]);

      const mockCreatedReview = {
        id: 77,
        productId: "prod-1",
        userId: 101,
        rating: 5,
        title: "Fantastic quality",
        body: "Crisp and fresh from the orchards",
        verifiedPurchase: 1,
        status: "approved",
      };

      vi.spyOn(reviewRepository, "create").mockReturnValue(mockCreatedReview as any);
      vi.spyOn(reviewRepository, "save").mockResolvedValue(mockCreatedReview as any);
      vi.spyOn(reviewRepository, "find").mockResolvedValue([
        { id: 77, rating: 5, status: "approved" },
      ] as any);
      vi.spyOn(userRepository, "findOne").mockResolvedValue(null);

      const saved = await reviewService.addReview({
        productId: "prod-1",
        userId: 101,
        rating: 5,
        title: "Fantastic quality",
        body: "Crisp and fresh from the orchards",
      });

      expect(saved.id).toBe(77);
      expect(saved.verifiedPurchase).toBe(1);
    });
  });

  describe("Helpful Voting", () => {
    it("prevents authors from voting on their own review", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue({
        id: 10,
        userId: 101,
      } as any);

      await expect(reviewService.voteHelpful(10, 101)).rejects.toThrow("CANNOT_VOTE_OWN_REVIEW");
    });

    it("allows another authenticated user to vote helpful and increments count", async () => {
      const mockReview = {
        id: 10,
        userId: 999, // Author
        helpfulCount: 2,
      };
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(mockReview as any);
      vi.spyOn(reviewHelpfulVoteRepository, "findOne").mockResolvedValue(null);
      vi.spyOn(reviewHelpfulVoteRepository, "create").mockReturnValue({ id: 1, reviewId: 10, userId: 101 } as any);
      vi.spyOn(reviewHelpfulVoteRepository, "save").mockResolvedValue({} as any);
      vi.spyOn(reviewRepository, "save").mockImplementation(async (r: any) => r);

      const res = await reviewService.voteHelpful(10, 101);
      expect(res.helpful).toBe(true);
      expect(res.helpfulCount).toBe(3);
    });

    it("toggles vote off when user votes again", async () => {
      const mockReview = {
        id: 10,
        userId: 999,
        helpfulCount: 3,
      };
      const existingVote = { id: 1, reviewId: 10, userId: 101 };
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue(mockReview as any);
      vi.spyOn(reviewHelpfulVoteRepository, "findOne").mockResolvedValue(existingVote as any);
      vi.spyOn(reviewHelpfulVoteRepository, "remove").mockResolvedValue({} as any);
      vi.spyOn(reviewRepository, "save").mockImplementation(async (r: any) => r);

      const res = await reviewService.voteHelpful(10, 101);
      expect(res.helpful).toBe(false);
      expect(res.helpfulCount).toBe(2);
    });
  });
});
