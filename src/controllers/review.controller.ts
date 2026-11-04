import { Request, Response } from "express";
import reviewService from "../services/review.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class ReviewController {
  async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const productId = String(req.params.id || req.params.productId);
      const currentUserId = req.user?.id;
      const { sort, page, limit } = req.query;

      const result = await reviewService.getProductReviews(productId, currentUserId, {
        sort: sort ? String(sort) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      sendSuccess(res, 200, messages.review.retrieved, result);
    } catch (error) {
      console.error("Get product reviews error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const productId = String(req.query.productId || req.params.productId || "");
      if (!productId) {
        sendError(res, 400, "Product ID is required.");
        return;
      }

      const eligibility = await reviewService.checkUserReviewEligibility(productId, userId);
      sendSuccess(res, 200, "Review eligibility checked", eligibility);
    } catch (error) {
      console.error("Check review eligibility error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getOrderReviewEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = String(req.params.orderId);
      const items = await reviewService.getOrderReviewEligibility(orderId, userId);
      sendSuccess(res, 200, "Order review eligibility retrieved", items);
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") {
        sendError(res, 404, "Order not found");
        return;
      }
      console.error("Get order review eligibility error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async submitReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId, rating, title, body, orderId, orderItemId, images } = req.body || {};

      if (!productId || !rating || !body) {
        sendError(res, 400, "Product ID, rating, and review text are required.");
        return;
      }

      const review = await reviewService.addReview({
        productId: String(productId),
        userId,
        rating: Number(rating),
        title,
        body: String(body),
        orderId: orderId ? String(orderId) : undefined,
        orderItemId: orderItemId ? String(orderItemId) : undefined,
        images: Array.isArray(images) ? images : undefined,
      });

      sendSuccess(res, 201, messages.review.created, review);
    } catch (error: any) {
      if (error?.message === "PRODUCT_NOT_FOUND") {
        sendError(res, 404, messages.product.notFound);
        return;
      }
      if (error?.message === "DUPLICATE_REVIEW") {
        sendError(res, 400, "You have already submitted a review for this delivered purchase.");
        return;
      }
      if (error?.message === "NOT_ELIGIBLE_UNVERIFIED_PURCHASE") {
        sendError(res, 403, "Only verified buyers who have received this product can submit a review.");
        return;
      }
      if (error?.message === "REVIEW_TOO_SHORT") {
        sendError(res, 400, "Review must be at least 5 characters long.");
        return;
      }
      if (error?.message === "REVIEW_TOO_LONG") {
        sendError(res, 400, "Review cannot exceed 3,000 characters.");
        return;
      }
      console.error("Submit review error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reviewId = Number(req.params.id);
      const { rating, title, body, images } = req.body || {};

      const updated = await reviewService.updateReview(reviewId, userId, {
        rating: rating !== undefined ? Number(rating) : undefined,
        title,
        body,
        images,
      });

      sendSuccess(res, 200, "Review updated successfully", updated);
    } catch (error: any) {
      if (error?.message === "REVIEW_NOT_FOUND") {
        sendError(res, 404, messages.review.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, "You can only edit your own reviews.");
        return;
      }
      if (error?.message === "REVIEW_TOO_SHORT") {
        sendError(res, 400, "Review must be at least 5 characters long.");
        return;
      }
      console.error("Update review error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = String(req.user?.role || "");
      await reviewService.deleteReview(Number(req.params.id), userId, role);
      sendSuccess(res, 200, messages.review.deleted);
    } catch (error: any) {
      if (error?.message === "REVIEW_NOT_FOUND") {
        sendError(res, 404, messages.review.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.common.forbidden);
        return;
      }
      console.error("Delete review error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async voteHelpful(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reviewId = Number(req.params.id);
      const result = await reviewService.voteHelpful(reviewId, userId);
      sendSuccess(res, 200, result.helpful ? "Marked as helpful" : "Helpful vote removed", result);
    } catch (error: any) {
      if (error?.message === "REVIEW_NOT_FOUND") {
        sendError(res, 404, messages.review.notFound);
        return;
      }
      if (error?.message === "CANNOT_VOTE_OWN_REVIEW") {
        sendError(res, 400, "You cannot vote on your own review.");
        return;
      }
      console.error("Vote helpful error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getMyReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reviews = await reviewService.getUserReviews(userId);
      sendSuccess(res, 200, "My reviews retrieved successfully", reviews);
    } catch (error) {
      console.error("Get my reviews error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const { productId, rating, status, search } = req.query;
      const reviews = await reviewService.adminGetReviews({
        productId: productId ? String(productId) : undefined,
        rating: rating ? Number(rating) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });
      sendSuccess(res, 200, messages.review.retrieved, reviews);
    } catch (error) {
      console.error("Get all reviews error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async adminUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = Number(req.params.id);
      const { status } = req.body;
      const updated = await reviewService.adminUpdateReviewStatus(reviewId, String(status));
      sendSuccess(res, 200, "Review status updated", updated);
    } catch (error: any) {
      if (error?.message === "REVIEW_NOT_FOUND") {
        sendError(res, 404, messages.review.notFound);
        return;
      }
      if (error?.message === "INVALID_STATUS") {
        sendError(res, 400, "Invalid status. Must be approved, pending, rejected, or hidden.");
        return;
      }
      console.error("Admin update review status error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new ReviewController();
