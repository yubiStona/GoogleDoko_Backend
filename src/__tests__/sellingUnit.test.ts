import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllowedUnitsForCategory,
  isUnitAllowedForCategory,
  isDecimalAllowedForUnit,
  resolveSellingUnit,
} from "../helpers/sellingUnit.helper";
import orderService from "../services/order.service";
import checkoutService from "../services/checkout.service";
import { productRepository, orderRepository, settingRepository } from "../repository";
import { appDataSource } from "../config/database";

describe("Category-Aware Selling Units & Pricing System Tests", () => {
  describe("Helper unit & category validations", () => {
    it("provides furniture-specific units (piece, set, pair) and excludes kg/litre", () => {
      const units = getAllowedUnitsForCategory("Furniture");
      expect(units).toContain("piece");
      expect(units).toContain("set");
      expect(units).toContain("pair");
      expect(units).not.toContain("kg");
      expect(units).not.toContain("litre");
    });

    it("provides clothing and shoes specific units", () => {
      const clothingUnits = getAllowedUnitsForCategory("Clothing");
      expect(clothingUnits).toContain("piece");

      const shoeUnits = getAllowedUnitsForCategory("Shoes");
      expect(shoeUnits).toContain("pair");
    });

    it("provides grocery and agricultural units (kg, gram, litre, dozen, bunch)", () => {
      const fruitUnits = getAllowedUnitsForCategory("Fruits");
      expect(fruitUnits).toContain("kg");
      expect(fruitUnits).toContain("gram");
      expect(fruitUnits).toContain("dozen");

      const vegUnits = getAllowedUnitsForCategory("Vegetables");
      expect(vegUnits).toContain("kg");
      expect(vegUnits).toContain("bunch");
    });

    it("differentiates measurable decimal units from countable whole units", () => {
      expect(isDecimalAllowedForUnit("kg")).toBe(true);
      expect(isDecimalAllowedForUnit("litre")).toBe(true);
      expect(isDecimalAllowedForUnit("gram")).toBe(true);

      expect(isDecimalAllowedForUnit("piece")).toBe(false);
      expect(isDecimalAllowedForUnit("set")).toBe(false);
      expect(isDecimalAllowedForUnit("pair")).toBe(false);
      expect(isDecimalAllowedForUnit("dozen")).toBe(false);
    });

    it("resolves selling unit and allowDecimals correctly for various categories", () => {
      const chair = resolveSellingUnit("Furniture", "piece");
      expect(chair.sellingUnit).toBe("piece");
      expect(chair.allowDecimals).toBe(0);

      const tableSet = resolveSellingUnit("Furniture", "set");
      expect(tableSet.sellingUnit).toBe("set");
      expect(tableSet.allowDecimals).toBe(0);

      const apples = resolveSellingUnit("Fruits", "kg");
      expect(apples.sellingUnit).toBe("kg");
      expect(apples.allowDecimals).toBe(1);

      // Defaults gracefully if unknown or mismatched unit
      const fallback = resolveSellingUnit("Furniture", "kg");
      expect(fallback.sellingUnit).toBe("piece");
      expect(fallback.allowDecimals).toBe(0);
    });
  });

  describe("Checkout and Order Quantity Validations", () => {
    it("disallows fractional quantities for discrete furniture items in checkout calculation", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-FURN-01",
        name: "Handcrafted Sisau Wood Dining Table",
        category: "Furniture",
        price: 32500,
        stock: 5,
        sellingUnit: "piece",
        allowDecimals: 0,
        active: 1,
      } as any);

      vi.spyOn(settingRepository, "find").mockResolvedValue([
        { key: "delivery_fee", value: "50" },
        { key: "free_delivery_threshold", value: "1500" },
      ] as any);

      const result = await checkoutService.calculateCheckout([
        { productId: "PROD-FURN-01", quantity: 1.5 },
      ]);

      expect(result.valid).toBe(false);
      expect(result.items[0].error).toContain("Fractional quantities not permitted");
    });

    it("allows fractional quantities for bulk grocery produce (e.g. 1.5 kg apples)", async () => {
      vi.spyOn(productRepository, "findOne").mockResolvedValue({
        id: "PROD-GROC-01",
        name: "Fresh Red Apples",
        category: "Fruits",
        price: 180,
        stock: 50,
        sellingUnit: "kg",
        allowDecimals: 1,
        active: 1,
      } as any);

      vi.spyOn(settingRepository, "find").mockResolvedValue([
        { key: "delivery_fee", value: "50" },
        { key: "free_delivery_threshold", value: "1500" },
      ] as any);

      const result = await checkoutService.calculateCheckout([
        { productId: "PROD-GROC-01", quantity: 1.5 },
      ]);

      expect(result.valid).toBe(true);
      expect(result.items[0].quantity).toBe(1.5);
      expect(result.items[0].lineTotal).toBe(270); // 180 * 1.5
      expect(result.subtotal).toBe(270);
    });
  });
});
