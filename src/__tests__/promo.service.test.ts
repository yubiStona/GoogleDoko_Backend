import { describe, it, expect, vi, beforeEach } from "vitest";
import checkoutService from "../services/checkout.service";
import {
  couponRepository,
  couponRedemptionRepository,
  productRepository,
  orderRepository,
  settingRepository,
} from "../repository";

describe("Unified Promo Code & Checkout Calculation Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Promo Validation Rules", () => {
    it("validates percentage discount with max cap", async () => {
      const mockCoupon = {
        code: "MEGA20",
        discountType: "percentage",
        discountValue: 20,
        minOrder: 1000,
        maxDiscount: 300,
        timesUsed: 5,
        maxUses: 100,
        active: 1,
        expiryDate: "2099-12-31",
      };

      vi.spyOn(couponRepository, "findOne").mockResolvedValue(mockCoupon as any);

      // Subtotal 2000 => 20% is 400, capped at maxDiscount 300
      const res = await checkoutService.validateCoupon("MEGA20", 2000, 101);
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(300);
      expect(res.maxDiscount).toBe(300);
    });

    it("enforces minimum order amount", async () => {
      const mockCoupon = {
        code: "FRESH100",
        discountType: "fixed",
        discountValue: 100,
        minOrder: 1000,
        timesUsed: 0,
        maxUses: 100,
        active: 1,
      };

      vi.spyOn(couponRepository, "findOne").mockResolvedValue(mockCoupon as any);

      const res = await checkoutService.validateCoupon("FRESH100", 600, 101);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Add Rs. 400 more");
    });

    it("enforces per-customer usage limit", async () => {
      const mockCoupon = {
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: 10,
        minOrder: 0,
        perCustomerLimit: 1,
        timesUsed: 10,
        maxUses: 1000,
        active: 1,
      };

      vi.spyOn(couponRepository, "findOne").mockResolvedValue(mockCoupon as any);
      vi.spyOn(couponRedemptionRepository, "count").mockResolvedValue(1); // Already used once

      const res = await checkoutService.validateCoupon("WELCOME10", 1500, 101);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("maximum allowed times");
    });

    it("enforces first-order-only promotion", async () => {
      const mockCoupon = {
        code: "FIRSTORDER",
        discountType: "fixed",
        discountValue: 150,
        minOrder: 500,
        firstOrderOnly: 1,
        timesUsed: 0,
        maxUses: 100,
        active: 1,
      };

      vi.spyOn(couponRepository, "findOne").mockResolvedValue(mockCoupon as any);
      vi.spyOn(couponRedemptionRepository, "count").mockResolvedValue(0);
      vi.spyOn(orderRepository, "count").mockResolvedValue(2); // Returning customer with 2 orders

      const res = await checkoutService.validateCoupon("FIRSTORDER", 800, 101);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("first-time orders only");
    });
  });

  describe("Multi-Vendor Proportional Discount Allocation", () => {
    it("allocates platform-wide discount proportionally across multi-vendor items", async () => {
      const mockProductA = {
        id: "prod-a",
        name: "Mustang Apples (Vendor 1)",
        price: 500,
        active: 1,
        stock: 10,
        weight: "1 kg",
      };
      const mockProductB = {
        id: "prod-b",
        name: "Honey (Vendor 2)",
        price: 300,
        active: 1,
        stock: 10,
        weight: "500g",
      };
      const mockProductC = {
        id: "prod-c",
        name: "Tea (Vendor 3)",
        price: 200,
        active: 1,
        stock: 10,
        weight: "250g",
      };

      vi.spyOn(productRepository, "findOne").mockImplementation(async (opts: any) => {
        if (opts.where.id === "prod-a") return mockProductA as any;
        if (opts.where.id === "prod-b") return mockProductB as any;
        if (opts.where.id === "prod-c") return mockProductC as any;
        return null;
      });

      vi.spyOn(settingRepository, "find").mockResolvedValue([
        { key: "delivery_fee", value: "50" },
        { key: "free_delivery_threshold", value: "1500" },
      ] as any);

      // 10% discount on 1000 subtotal => discount is 100
      const mockCoupon = {
        code: "PLATFORM10",
        discountType: "percentage",
        discountValue: 10,
        minOrder: 0,
        timesUsed: 0,
        maxUses: 100,
        active: 1,
      };
      vi.spyOn(couponRepository, "findOne").mockResolvedValue(mockCoupon as any);

      const items = [
        { productId: "prod-a", quantity: 1 }, // 500
        { productId: "prod-b", quantity: 1 }, // 300
        { productId: "prod-c", quantity: 1 }, // 200
      ];

      const res = await checkoutService.calculateCheckout(items, "PLATFORM10", 101);

      expect(res.subtotal).toBe(1000);
      expect(res.discount).toBe(100);
      expect(res.items).toHaveLength(3);

      // Prod A: 500/1000 * 100 = 50 allocated discount => net 450
      expect(res.items[0].allocatedDiscount).toBe(50);
      expect(res.items[0].netLineTotal).toBe(450);

      // Prod B: 300/1000 * 100 = 30 allocated discount => net 270
      expect(res.items[1].allocatedDiscount).toBe(30);
      expect(res.items[1].netLineTotal).toBe(270);

      // Prod C: 200/1000 * 100 = 20 allocated discount => net 180
      expect(res.items[2].allocatedDiscount).toBe(20);
      expect(res.items[2].netLineTotal).toBe(180);

      // Total of allocated discounts must strictly equal 100
      const sumAllocated = res.items.reduce((s: number, it: any) => s + it.allocatedDiscount, 0);
      expect(sumAllocated).toBe(100);
    });
  });
});
