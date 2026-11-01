import { describe, it, expect, vi, beforeEach } from "vitest";
import productService from "../services/product.service";
import { productRepository } from "../repository";

describe("Product Authorization & Ownership Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prevents vendor from modifying a product belonging to another vendor", async () => {
    vi.spyOn(productRepository, "findOne").mockResolvedValue({
      id: "PROD-APPLE",
      name: "Mustang Apples",
      vendorUserId: 10, // Owned by vendor #10
    } as any);

    await expect(
      productService.updateProduct(
        "PROD-APPLE",
        { price: 999 },
        20, // Vendor #20 attempting modification
        "vendor"
      )
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows owner vendor to update their own product", async () => {
    const existing = {
      id: "PROD-APPLE",
      name: "Mustang Apples",
      price: 250,
      vendorUserId: 10,
    };

    vi.spyOn(productRepository, "findOne").mockResolvedValue(existing as any);
    const saveSpy = vi.spyOn(productRepository, "save").mockImplementation(async (prod) => prod as any);

    const updated = await productService.updateProduct(
      "PROD-APPLE",
      { price: 300 },
      10, // Owned by vendor #10
      "vendor"
    );

    expect(saveSpy).toHaveBeenCalled();
    expect(updated.price).toBe(300);
  });

  it("prevents vendor from deleting a product owned by another vendor", async () => {
    vi.spyOn(productRepository, "findOne").mockResolvedValue({
      id: "PROD-HONEY",
      vendorUserId: 10,
    } as any);

    await expect(
      productService.deleteProduct(
        "PROD-HONEY",
        99, // Unrelated vendor ID
        "vendor"
      )
    ).rejects.toThrow("FORBIDDEN");
  });
});
