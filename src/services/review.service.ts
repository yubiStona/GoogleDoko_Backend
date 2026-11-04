import {
  reviewRepository,
  reviewHelpfulVoteRepository,
  productRepository,
  userRepository,
  orderRepository,
  rewardLogRepository,
} from "../repository";

import { Review, ReviewHelpfulVote } from "../entities/review.entity";
import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";

export interface ReviewRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
  };
}

export interface UserReviewEligibility {
  isEligible: boolean;
  alreadyReviewed: boolean;
  eligibleOrderId?: string;
  eligibleOrderItemId?: string;
  existingReview?: any;
  reason?: string;
}

export interface AddReviewInput {
  productId: string;
  userId: number;
  rating: number;
  title?: string;
  body: string;
  orderId?: string;
  orderItemId?: string;
  images?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  images?: string[];
}

export class ReviewService {
  /**
   * Check if a customer is eligible to review a product based on delivered orders.
   */
  async checkUserReviewEligibility(productId: string, userId: number): Promise<UserReviewEligibility> {
    if (!userId) {
      return { isEligible: false, alreadyReviewed: false, reason: "NOT_AUTHENTICATED" };
    }

    // Check existing review
    const existing = await reviewRepository.findOne({
      where: { productId, userId },
      order: { createdAt: "DESC" },
    });

    if (existing) {
      return {
        isEligible: false,
        alreadyReviewed: true,
        existingReview: {
          id: existing.id,
          rating: existing.rating,
          title: existing.title,
          body: existing.body,
          orderId: existing.orderId,
          createdAt: existing.createdAt,
          images: existing.imagesJson ? JSON.parse(existing.imagesJson) : [],
        },
        reason: "ALREADY_REVIEWED",
      };
    }

    // Find delivered orders for this user containing this product
    const orders = await orderRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    let eligibleOrderId: string | undefined;
    let eligibleOrderItemId: string | undefined;

    for (const order of orders) {
      const orderStatus = (order.status || "").toLowerCase();
      if (orderStatus === "cancelled" || orderStatus === "failed") {
        continue;
      }

      let items: any[] = [];
      try {
        items = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson || [];
      } catch {
        items = [];
      }

      for (const item of items) {
        const itemPid = String(item.productId || item.id || "");
        if (itemPid === productId) {
          const itemStatus = (item.status || order.status || "").toLowerCase();
          // Must be delivered at item or order level
          if (itemStatus === "delivered" || orderStatus === "delivered") {
            eligibleOrderId = order.id;
            eligibleOrderItemId = String(item.orderItemId || `${order.id}-${productId}`);
            break;
          }
        }
      }

      if (eligibleOrderId) break;
    }

    if (!eligibleOrderId) {
      return {
        isEligible: false,
        alreadyReviewed: false,
        reason: "NOT_PURCHASED_OR_DELIVERED",
      };
    }

    return {
      isEligible: true,
      alreadyReviewed: false,
      eligibleOrderId,
      eligibleOrderItemId,
    };
  }

  /**
   * Get review eligibility for all items in an order.
   */
  async getOrderReviewEligibility(orderId: string, userId: number): Promise<any[]> {
    const order = await orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new Error("ORDER_NOT_FOUND");
    }

    let items: any[] = [];
    try {
      items = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson || [];
    } catch {
      items = [];
    }

    const orderStatus = (order.status || "").toLowerCase();
    const result: any[] = [];

    // Fetch existing reviews by user for this order
    const existingReviews = await reviewRepository.find({
      where: { userId, orderId },
    });
    const reviewByPid = new Map(existingReviews.map((r) => [r.productId, r]));

    for (const item of items) {
      const pid = String(item.productId || item.id || "");
      const existing = reviewByPid.get(pid);
      const itemStatus = item.status || order.status;
      const isDelivered =
        (itemStatus.toLowerCase() === "delivered" || orderStatus === "delivered") &&
        orderStatus !== "cancelled" &&
        orderStatus !== "failed";

      result.push({
        productId: pid,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        status: itemStatus,
        isDelivered,
        isEligible: isDelivered && !existing,
        hasReviewed: Boolean(existing),
        review: existing
          ? {
              id: existing.id,
              rating: existing.rating,
              title: existing.title,
              body: existing.body,
              createdAt: existing.createdAt,
            }
          : null,
      });
    }

    return result;
  }

  /**
   * Get product reviews with rating breakdown stats and optional user eligibility.
   */
  async getProductReviews(
    productId: string,
    currentUserId?: number,
    options: { sort?: string; page?: number; limit?: number } = {}
  ): Promise<{
    reviews: any[];
    stats: ReviewRatingStats;
    userEligibility?: UserReviewEligibility;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    // Fetch all approved reviews to compute accurate stats
    const allApproved = await reviewRepository.find({
      where: { productId, status: "approved" },
      order: { createdAt: "DESC" },
    });

    const totalReviews = allApproved.length;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;

    for (const r of allApproved) {
      const rNum = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rNum] = (counts[rNum] || 0) + 1;
      sumRating += r.rating;
    }

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    const distribution = {
      5: { count: counts[5], percentage: totalReviews > 0 ? Math.round((counts[5] / totalReviews) * 100) : 0 },
      4: { count: counts[4], percentage: totalReviews > 0 ? Math.round((counts[4] / totalReviews) * 100) : 0 },
      3: { count: counts[3], percentage: totalReviews > 0 ? Math.round((counts[3] / totalReviews) * 100) : 0 },
      2: { count: counts[2], percentage: totalReviews > 0 ? Math.round((counts[2] / totalReviews) * 100) : 0 },
      1: { count: counts[1], percentage: totalReviews > 0 ? Math.round((counts[1] / totalReviews) * 100) : 0 },
    };

    // Sort options
    let sortedReviews = [...allApproved];
    const sort = options.sort || "newest";
    if (sort === "highest") {
      sortedReviews.sort((a, b) => b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === "lowest") {
      sortedReviews.sort((a, b) => a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === "helpful") {
      sortedReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0) || b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      // newest
      sortedReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const pagedReviews = sortedReviews.slice(skip, skip + limit);

    // Fetch user details for reviewers
    const userIds = Array.from(new Set(pagedReviews.map((r) => r.userId)));
    let userMap = new Map<number, { name: string; photo?: string }>();
    if (userIds.length > 0) {
      const users = await userRepository.findByIds(userIds);
      userMap = new Map(
        users.map((u) => [
          u.id,
          {
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Verified Buyer",
            photo: (u as any).photo || "",
          },
        ])
      );
    }

    // Check helpful votes for current user
    let userVotedSet = new Set<number>();
    if (currentUserId && pagedReviews.length > 0) {
      const votes = await reviewHelpfulVoteRepository
        .createQueryBuilder("v")
        .where("v.userId = :userId AND v.reviewId IN (:...rids)", {
          userId: currentUserId,
          rids: pagedReviews.map((r) => r.id),
        })
        .getMany();
      userVotedSet = new Set(votes.map((v) => v.reviewId));
    }

    const mapped = pagedReviews.map((r) => {
      const u = userMap.get(r.userId) || { name: "Verified Buyer", photo: "" };
      let images: string[] = [];
      try {
        images = r.imagesJson ? JSON.parse(r.imagesJson) : [];
      } catch {
        images = [];
      }

      return {
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        author: u.name,
        photo: u.photo,
        first_name: u.name.split(" ")[0] || "Buyer",
        last_name: u.name.split(" ").slice(1).join(" ") || "",
        rating: r.rating,
        title: r.title,
        body: r.body,
        verifiedPurchase: Boolean(r.verifiedPurchase),
        helpfulCount: r.helpfulCount || 0,
        userHasVotedHelpful: userVotedSet.has(r.id),
        images,
        reply: r.reply,
        replyAt: r.replyAt,
        created_at: r.createdAt.toISOString(),
        createdAt: r.createdAt,
      };
    });

    let userEligibility: UserReviewEligibility | undefined;
    if (currentUserId) {
      userEligibility = await this.checkUserReviewEligibility(productId, currentUserId);
    }

    return {
      reviews: mapped,
      stats: { averageRating, totalReviews, distribution },
      userEligibility,
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      },
    };
  }

  /**
   * Submit a verified customer review for a delivered product.
   */
  async addReview(input: AddReviewInput): Promise<Review> {
    const { productId, userId, rating, title, body, images } = input;

    const product = await productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // Verify eligibility
    const eligibility = await this.checkUserReviewEligibility(productId, userId);
    if (!eligibility.isEligible) {
      if (eligibility.alreadyReviewed) {
        throw new Error("DUPLICATE_REVIEW");
      }
      throw new Error("NOT_ELIGIBLE_UNVERIFIED_PURCHASE");
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanBody = (body || "").trim();
    if (cleanBody.length < 5) {
      throw new Error("REVIEW_TOO_SHORT");
    }
    if (cleanBody.length > 3000) {
      throw new Error("REVIEW_TOO_LONG");
    }

    const orderId = input.orderId || eligibility.eligibleOrderId || null;
    const orderItemId = input.orderItemId || eligibility.eligibleOrderItemId || null;

    const review = reviewRepository.create({
      productId,
      userId,
      orderId,
      orderItemId,
      verifiedPurchase: 1,
      rating: cleanRating,
      title: (title || "").trim().slice(0, 200),
      body: cleanBody,
      imagesJson: Array.isArray(images) && images.length > 0 ? JSON.stringify(images.slice(0, 5)) : null,
      status: "approved",
      helpfulCount: 0,
    });

    const saved = await reviewRepository.save(review);

    // Recompute product rating
    await this.recalculateProductRating(productId);

    // Award reward points for authentic verified review
    try {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.rewardPoints = (user.rewardPoints || 0) + 70;
        await userRepository.save(user);

        const log = rewardLogRepository.create({
          userId,
          label: `Verified Review for "${product.name}"`,
          points: 70,
        });
        await rewardLogRepository.save(log);
      }
    } catch {
      // Non-critical reward logging
    }

    return saved;
  }

  /**
   * Update an existing review (owner only).
   */
  async updateReview(reviewId: number, userId: number, input: UpdateReviewInput): Promise<Review> {
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (review.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    if (input.rating !== undefined) {
      review.rating = Math.max(1, Math.min(5, Math.round(Number(input.rating))));
    }
    if (input.title !== undefined) {
      review.title = input.title.trim().slice(0, 200);
    }
    if (input.body !== undefined) {
      const cleanBody = input.body.trim();
      if (cleanBody.length < 5) throw new Error("REVIEW_TOO_SHORT");
      if (cleanBody.length > 3000) throw new Error("REVIEW_TOO_LONG");
      review.body = cleanBody;
    }
    if (input.images !== undefined) {
      review.imagesJson = Array.isArray(input.images) ? JSON.stringify(input.images.slice(0, 5)) : null;
    }

    const saved = await reviewRepository.save(review);
    await this.recalculateProductRating(review.productId);
    return saved;
  }

  /**
   * Delete a review (owner or admin).
   */
  async deleteReview(reviewId: number, userId?: number, role?: string): Promise<void> {
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (role !== "admin" && userId && review.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    const productId = review.productId;
    await reviewRepository.remove(review);

    // Delete associated helpful votes
    await reviewHelpfulVoteRepository.delete({ reviewId });

    await this.recalculateProductRating(productId);
  }

  /**
   * Vote a review as helpful (1 vote per user, authors cannot vote on own review).
   */
  async voteHelpful(reviewId: number, userId: number): Promise<{ helpful: boolean; helpfulCount: number }> {
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (review.userId === userId) {
      throw new Error("CANNOT_VOTE_OWN_REVIEW");
    }

    const existingVote = await reviewHelpfulVoteRepository.findOne({
      where: { reviewId, userId },
    });

    if (existingVote) {
      // Toggle vote off
      await reviewHelpfulVoteRepository.remove(existingVote);
      review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
      await reviewRepository.save(review);
      return { helpful: false, helpfulCount: review.helpfulCount };
    } else {
      // Toggle vote on
      const newVote = reviewHelpfulVoteRepository.create({ reviewId, userId });
      await reviewHelpfulVoteRepository.save(newVote);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      await reviewRepository.save(review);
      return { helpful: true, helpfulCount: review.helpfulCount };
    }
  }

  /**
   * Get all reviews submitted by the logged-in customer.
   */
  async getUserReviews(userId: number): Promise<any[]> {
    const reviews = await reviewRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    if (reviews.length === 0) return [];

    const productIds = Array.from(new Set(reviews.map((r) => r.productId)));
    const products = await productRepository.findByIds(productIds);
    const prodMap = new Map(products.map((p) => [p.id, p]));

    return reviews.map((r) => {
      const prod = prodMap.get(r.productId);
      let images: string[] = [];
      try {
        images = r.imagesJson ? JSON.parse(r.imagesJson) : [];
      } catch {
        images = [];
      }

      return {
        id: r.id,
        productId: r.productId,
        productName: prod?.name || "Product",
        productImage: prod?.image || "/src/frontend/assets/images/organic-vegetables.jpg",
        orderId: r.orderId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        helpfulCount: r.helpfulCount || 0,
        images,
        reply: r.reply,
        replyAt: r.replyAt,
        createdAt: r.createdAt,
      };
    });
  }

  /**
   * Admin: Get all reviews with filters.
   */
  async adminGetReviews(filters: { productId?: string; rating?: number; status?: string; search?: string } = {}): Promise<any[]> {
    const qb = reviewRepository.createQueryBuilder("r").orderBy("r.createdAt", "DESC");

    if (filters.productId) {
      qb.andWhere("r.productId = :pid", { pid: filters.productId });
    }
    if (filters.rating) {
      qb.andWhere("r.rating = :rating", { rating: Number(filters.rating) });
    }
    if (filters.status) {
      qb.andWhere("r.status = :status", { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere("(LOWER(r.title) LIKE :search OR LOWER(r.body) LIKE :search)", {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }

    const reviews = await qb.getMany();
    if (reviews.length === 0) return [];

    const userIds = Array.from(new Set(reviews.map((r) => r.userId)));
    const productIds = Array.from(new Set(reviews.map((r) => r.productId)));

    const users = userIds.length ? await userRepository.findByIds(userIds) : [];
    const products = productIds.length ? await productRepository.findByIds(productIds) : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const prodMap = new Map(products.map((p) => [p.id, p]));

    return reviews.map((r) => {
      const u = userMap.get(r.userId);
      const p = prodMap.get(r.productId);
      return {
        id: r.id,
        product_id: r.productId,
        product_name: p?.name || "Product",
        product_image: p?.image || "",
        user_id: r.userId,
        first_name: u?.firstName || "Customer",
        last_name: u?.lastName || "",
        email: u?.email || "",
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        verified_purchase: Boolean(r.verifiedPurchase),
        helpful_count: r.helpfulCount || 0,
        reply: r.reply,
        created_at: r.createdAt.toISOString(),
      };
    });
  }

  /**
   * Admin: Update moderation status of review.
   */
  async adminUpdateReviewStatus(reviewId: number, status: string): Promise<Review> {
    const valid = ["approved", "pending", "rejected", "hidden"];
    if (!valid.includes(status)) {
      throw new Error("INVALID_STATUS");
    }

    const review = await reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    review.status = status;
    const saved = await reviewRepository.save(review);
    await this.recalculateProductRating(review.productId);
    return saved;
  }

  /**
   * Internal helper: Recalculate product rating from approved reviews.
   */
  private async recalculateProductRating(productId: string): Promise<void> {
    try {
      const approvedReviews = await reviewRepository.find({
        where: { productId, status: "approved" },
      });
      const product = await productRepository.findOne({ where: { id: productId } });
      if (product) {
        if (approvedReviews.length > 0) {
          const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
          product.rating = Math.round((sum / approvedReviews.length) * 10) / 10;
        } else {
          product.rating = 4.8; // Baseline default
        }
        await productRepository.save(product);
      }
    } catch (err) {
      console.warn("Could not recalculate product rating:", err);
    }
  }
}

export default new ReviewService();
