import { describe, it, expect, vi, beforeEach } from "vitest";
import checkoutService from "../services/checkout.service";
import { orderRepository, couponRepository } from "../repository";

describe("Checkout & Payment Security", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates coupon constraints accurately", async () => {
    vi.spyOn(couponRepository, "findOne").mockResolvedValue({
      id: 1,
      code: "FESTIVE10",
      active: 1,
      discountType: "percentage",
      discountValue: 10,
      minOrder: 1000,
      maxUses: 100,
      timesUsed: 5,
      expiryDate: new Date(Date.now() + 86400000).toISOString(),
    } as any);

    // Below minimum order
    const belowMin = await checkoutService.validateCoupon("FESTIVE10", 500);
    expect(belowMin.valid).toBe(false);

    // Above minimum order
    const valid = await checkoutService.validateCoupon("FESTIVE10", 1500);
    expect(valid.valid).toBe(true);
    expect(valid.discountAmount).toBe(150);
  });

  it("rejects eSewa payment verification when amount does not match order total", async () => {
    vi.spyOn(orderRepository, "findOne").mockResolvedValue({
      id: "GD-TEST-1",
      total: 1200,
      paymentStatus: "Pending",
    } as any);

    await expect(
      checkoutService.verifyEsewaPayment({
        orderId: "GD-TEST-1",
        amount: 500, // tampered amount
        refId: "ESEWA-REF-123",
      })
    ).rejects.toThrow("PAYMENT_AMOUNT_MISMATCH");
  });

  it("rejects payment verification when order does not exist", async () => {
    vi.spyOn(orderRepository, "findOne").mockResolvedValue(null);

    await expect(
      checkoutService.verifyKhaltiPayment({
        orderId: "NON_EXISTENT",
        pidx: "KHALTI_PIDX_123",
        amount: 1000,
      })
    ).rejects.toThrow("ORDER_NOT_FOUND");
  });
});
