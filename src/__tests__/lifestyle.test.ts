import { describe, it, expect, vi, beforeEach } from "vitest";
import lifestyleService from "../services/lifestyle.service";
import {
  lifestyleCollectionRepository,
  productLifestyleRepository,
  productRepository,
} from "../repository";

describe("Shop by Lifestyle Feature Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Collections Listing & Retrieval", () => {
    it("returns active lifestyle collections with parsed subcategories", async () => {
      const mockCollection = {
        id: "lifestyle-furniture",
        name: "Furniture",
        slug: "furniture",
        description: "Handcrafted wooden furniture",
        image: "https://example.com/furniture.jpg",
        icon: "furniture",
        subcategoriesJson: JSON.stringify(["Sofas", "Beds", "Tables", "Chairs"]),
        displayOrder: 1,
        isActive: 1,
      };

      vi.spyOn(lifestyleCollectionRepository, "createQueryBuilder").mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockCollection]),
      } as any);

      vi.spyOn(productLifestyleRepository, "createQueryBuilder").mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { lifestyle_id: "lifestyle-furniture", count: "8" },
        ]),
      } as any);

      const result = await lifestyleService.getCollections(false);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Furniture");
      expect(result[0].slug).toBe("furniture");
      expect(result[0].subcategories).toEqual(["Sofas", "Beds", "Tables", "Chairs"]);
      expect(result[0].productCount).toBe(8);
    });

    it("retrieves a collection by slug", async () => {
      vi.spyOn(lifestyleCollectionRepository, "findOne").mockResolvedValue({
        id: "lifestyle-home-living",
        name: "Home & Living",
        slug: "home-living",
        description: "Handwoven rugs and decor",
        image: "https://example.com/home.jpg",
        icon: "home",
        subcategoriesJson: JSON.stringify(["Rugs", "Lighting", "Cushions"]),
        displayOrder: 2,
        isActive: 1,
      } as any);

      vi.spyOn(productLifestyleRepository, "createQueryBuilder").mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ count: "5" }),
      } as any);

      const col = await lifestyleService.getCollectionBySlug("home-living");
      expect(col).not.toBeNull();
      expect(col?.name).toBe("Home & Living");
      expect(col?.subcategories).toContain("Rugs");
      expect(col?.productCount).toBe(5);
    });
  });

  describe("Collection Products Filtering & Sorting", () => {
    it("filters collection products with pagination and subcategory", async () => {
      vi.spyOn(lifestyleService, "getCollectionBySlug").mockResolvedValue({
        id: "lifestyle-kitchen-dining",
        name: "Kitchen & Dining",
        slug: "kitchen-dining",
        description: "Cookware & Dinnerware",
        image: "",
        icon: "kitchen",
        subcategories: ["Cookware", "Dinnerware", "Utensils"],
        displayOrder: 3,
        isActive: 1,
        productCount: 2,
      });

      const mockProducts = [
        {
          id: "PROD-1",
          name: "Palpa Bronze Bowl",
          price: 2900,
          rating: 4.9,
          active: 1,
        },
      ];

      vi.spyOn(productRepository, "createQueryBuilder").mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getRawAndEntities: vi.fn().mockResolvedValue({
          entities: mockProducts,
          raw: [{ pl_subcategory: "Dinnerware" }],
        }),
        getCount: vi.fn().mockResolvedValue(1),
      } as any);

      const res = await lifestyleService.getCollectionProducts("kitchen-dining", {
        subcategory: "Dinnerware",
        page: 1,
        limit: 10,
      });

      expect(res.collection.name).toBe("Kitchen & Dining");
      expect(res.products).toHaveLength(1);
      expect(res.products[0].subcategory).toBe("Dinnerware");
      expect(res.total).toBe(1);
    });
  });

  describe("Product Lifestyle Assignment & Many-to-Many", () => {
    it("assigns and replaces product lifestyle mappings cleanly", async () => {
      const deleteSpy = vi
        .spyOn(productLifestyleRepository, "delete")
        .mockResolvedValue({ affected: 1 } as any);
      const createSpy = vi
        .spyOn(productLifestyleRepository, "create")
        .mockImplementation((obj) => obj as any);
      const saveSpy = vi
        .spyOn(productLifestyleRepository, "save")
        .mockResolvedValue([] as any);

      await lifestyleService.assignProductLifestyles("PROD-TEST-123", [
        { lifestyleId: "lifestyle-furniture", subcategory: "Chairs" },
        { lifestyleId: "lifestyle-home-living", subcategory: "Decor" },
      ]);

      expect(deleteSpy).toHaveBeenCalledWith({ productId: "PROD-TEST-123" });
      expect(createSpy).toHaveBeenCalledTimes(2);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe("Admin Collection Management", () => {
    it("creates a new lifestyle collection with formatted slug and subcategories", async () => {
      vi.spyOn(lifestyleCollectionRepository, "create").mockImplementation(
        (obj) => obj as any
      );
      vi.spyOn(lifestyleCollectionRepository, "save").mockResolvedValue({} as any);
      vi.spyOn(lifestyleService, "getCollectionBySlug").mockResolvedValue({
        id: "lifestyle-artisan-crafts",
        name: "Artisan Crafts",
        slug: "artisan-crafts",
        description: "Handcrafted traditional crafts",
        image: "https://example.com/art.jpg",
        icon: "crafts",
        subcategories: ["Pottery", "Carvings"],
        displayOrder: 7,
        isActive: 1,
        productCount: 0,
      });

      const col = await lifestyleService.createCollection({
        name: "Artisan Crafts",
        description: "Handcrafted traditional crafts",
        image: "https://example.com/art.jpg",
        subcategories: ["Pottery", "Carvings"],
        displayOrder: 7,
      });

      expect(col.name).toBe("Artisan Crafts");
      expect(col.slug).toBe("artisan-crafts");
      expect(col.subcategories).toEqual(["Pottery", "Carvings"]);
    });

    it("toggles collection visibility status between active and hidden", async () => {
      const colEntity = {
        id: "lifestyle-furniture",
        name: "Furniture",
        slug: "furniture",
        isActive: 1,
      };

      vi.spyOn(lifestyleCollectionRepository, "findOne").mockResolvedValue(
        colEntity as any
      );
      vi.spyOn(lifestyleCollectionRepository, "save").mockImplementation(
        (async (saved: any) => saved) as any
      );
      vi.spyOn(lifestyleService, "getCollectionBySlug").mockResolvedValue({
        ...colEntity,
        isActive: 0,
        subcategories: [],
        description: "",
        image: "",
        icon: "",
        displayOrder: 1,
        productCount: 0,
      });

      const updated = await lifestyleService.toggleCollectionStatus("lifestyle-furniture");
      expect(colEntity.isActive).toBe(0); // Toggled from 1 to 0
      expect(updated.isActive).toBe(0);
    });
  });
});
