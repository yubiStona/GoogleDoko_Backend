import { describe, it, expect, vi, beforeEach } from "vitest";
import vendorService from "../services/vendor.service";
import {
  productRepository,
  vendorRepository,
  orderRepository,
  reviewRepository,
} from "../repository";

describe("Vendor Service & Business Logic Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Requirement 2: New vendor starts with an empty dashboard & zero leakage", () => {
    it("returns zero orders for a vendor with 0 products even if platform has orders (security fix)", async () => {
      // Mock vendor has 0 products
      vi.spyOn(productRepository, "find").mockResolvedValue([]);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue({
        userId: 44,
        businessName: "New Fresh Farm",
        status: "under_review",
      } as any);

      // System has existing orders from other vendors
      vi.spyOn(orderRepository, "find").mockResolvedValue([
        {
          id: "ORD-999",
          date: "2026-10-30",
          status: "Pending",
          itemsJson: JSON.stringify([
            { productId: "PROD-OTHER", name: "Other Apples", price: 500, quantity: 2, seller: "Old Vendor" },
          ]),
        } as any,
      ]);

      const orders = await vendorService.getVendorOrders(44);
      expect(orders).toEqual([]); // Must be strictly empty!
    });

    it("returns an initial dashboard with zero metrics and empty lists for a new vendor", async () => {
      vi.spyOn(productRepository, "find").mockResolvedValue([]);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue({
        userId: 44,
        businessName: "New Organic Farm",
        status: "under_review",
      } as any);

      const dashboard = await vendorService.getVendorDashboard(44);

      expect(dashboard.stats.totalRevenue).toBe(0);
      expect(dashboard.stats.totalOrders).toBe(0);
      expect(dashboard.stats.pendingOrders).toBe(0);
      expect(dashboard.stats.activeProducts).toBe(0);
      expect(dashboard.stats.lowStockProducts).toBe(0);
      expect(dashboard.stats.averageRating).toBe("No ratings yet");
      expect(dashboard.bestsellers).toEqual([]);
      expect(dashboard.recentOrders).toEqual([]);
      expect(dashboard.vendorStatus).toBe("under_review");
    });

    it("returns empty customers, sales, and reviews for a new vendor", async () => {
      vi.spyOn(productRepository, "find").mockResolvedValue([]);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue({ userId: 44 } as any);
      vi.spyOn(orderRepository, "find").mockResolvedValue([]);

      const customers = await vendorService.getVendorCustomers(44);
      expect(customers).toEqual([]);

      const sales = await vendorService.getVendorSales(44);
      expect(sales.metrics.totalSales).toBe(0);
      expect(sales.metrics.totalOrders).toBe(0);
      expect(sales.transactions).toEqual([]);

      const reviews = await vendorService.getVendorReviews(44);
      expect(reviews.reviews).toEqual([]);
      expect(reviews.averageRating).toBe(0);
      expect(reviews.totalReviews).toBe(0);
    });
  });

  describe("Requirement 4 & 10: Multi-Vendor Isolation & Product Management", () => {
    it("allows vendor to fetch only their own product by id", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-MY-APPLE",
        name: "My Apples",
        vendorUserId: 44,
        price: 350,
      } as any);

      const prod = await vendorService.getVendorProductById(44, "PROD-MY-APPLE");
      expect(prod.id).toBe("PROD-MY-APPLE");
    });

    it("throws FORBIDDEN when vendor attempts to view another vendor's product", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-OTHER-APPLE",
        name: "Other Apples",
        vendorUserId: 3, // Owned by Vendor 3
        price: 500,
      } as any);

      await expect(
        vendorService.getVendorProductById(44, "PROD-OTHER-APPLE")
      ).rejects.toThrow("FORBIDDEN");
    });

    it("throws FORBIDDEN when vendor attempts to update another vendor's product", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-OTHER-HONEY",
        name: "Other Honey",
        vendorUserId: 3, // Owned by Vendor 3
      } as any);

      await expect(
        vendorService.saveVendorProduct(44, { price: 999 }, "PROD-OTHER-HONEY")
      ).rejects.toThrow("FORBIDDEN");
    });

    it("isolates multi-vendor orders: Vendor A sees only Vendor A's items and subtotal", async () => {
      // Vendor A (userId: 10) owns PROD-1
      vi.spyOn(productRepository, "find").mockResolvedValue([
        { id: "PROD-1", name: "Vendor A Tomatoes", vendorUserId: 10, active: 1 } as any,
      ]);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue({
        userId: 10,
        businessName: "Vendor A Farm",
      } as any);

      // Order has items from Vendor A (PROD-1) and Vendor B (PROD-2)
      vi.spyOn(orderRepository, "find").mockResolvedValue([
        {
          id: "ORD-SPLIT-1",
          date: "2026-10-31",
          status: "Pending",
          total: 1500, // Total order includes both
          recipientName: "Hari Bahadur",
          recipientPhone: "9841000000",
          itemsJson: JSON.stringify([
            { productId: "PROD-1", name: "Vendor A Tomatoes", price: 200, quantity: 2, seller: "Vendor A Farm" },
            { productId: "PROD-2", name: "Vendor B Apples", price: 1100, quantity: 1, seller: "Vendor B Farm" },
          ]),
        } as any,
      ]);

      const orders = await vendorService.getVendorOrders(10);
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe("ORD-SPLIT-1");
      // Vendor A must only see their item
      expect(orders[0].items).toHaveLength(1);
      expect(orders[0].items[0].productId).toBe("PROD-1");
      // Vendor A subtotal must be 200 * 2 = 400 (not 1500!)
      expect(orders[0].total).toBe(400);
    });

    it("updating order status only updates this vendor's items in multi-vendor orders", async () => {
      vi.spyOn(productRepository, "find").mockResolvedValue([
        { id: "PROD-1", name: "Vendor A Tomatoes", vendorUserId: 10, active: 1 } as any,
      ]);
      vi.spyOn(vendorRepository, "findOne").mockResolvedValue({
        userId: 10,
        businessName: "Vendor A Farm",
      } as any);

      const items = [
        { productId: "PROD-1", name: "Vendor A Tomatoes", price: 200, quantity: 2, status: "Pending", seller: "Vendor A Farm" },
        { productId: "PROD-2", name: "Vendor B Apples", price: 1100, quantity: 1, status: "Pending", seller: "Vendor B Farm" },
      ];

      const orderObj = {
        id: "ORD-SPLIT-1",
        status: "Pending",
        itemsJson: JSON.stringify(items),
      };

      vi.spyOn(orderRepository, "findOne").mockResolvedValue(orderObj as any);
      const saveSpy = vi.spyOn(orderRepository, "save").mockImplementation(async (ord) => ord as any);

      await vendorService.updateVendorOrderStatus(10, "ORD-SPLIT-1", "Preparing");

      expect(saveSpy).toHaveBeenCalled();
      const updatedItems = JSON.parse(orderObj.itemsJson);
      // Vendor A's item is Preparing
      expect(updatedItems[0].status).toBe("Preparing");
      // Vendor B's item is untouched
      expect(updatedItems[1].status).toBe("Pending");
    });
  });

  describe("Requirement 7: Product Reviews & Replies", () => {
    it("allows vendor to reply to a review of their product", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue({
        id: 5,
        productId: "PROD-APPLE",
        body: "Great apples!",
        reply: null,
      } as any);

      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-APPLE",
        vendorUserId: 44, // Owned by vendor 44
      } as any);

      const saveSpy = vi.spyOn(reviewRepository, "save").mockImplementation(async (r) => r as any);

      const result = await vendorService.replyVendorReview(44, 5, "Thank you for supporting our orchard!");

      expect(saveSpy).toHaveBeenCalled();
      expect(result.reply).toBe("Thank you for supporting our orchard!");
      expect(result.replyAt).toBeInstanceOf(Date);
    });

    it("prevents vendor from replying to a review of another vendor's product", async () => {
      vi.spyOn(reviewRepository, "findOne").mockResolvedValue({
        id: 8,
        productId: "PROD-OTHER",
      } as any);

      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-OTHER",
        vendorUserId: 99, // Owned by another vendor
      } as any);

      await expect(
        vendorService.replyVendorReview(44, 8, "Hacked reply")
      ).rejects.toThrow("FORBIDDEN");
    });
  });
});
