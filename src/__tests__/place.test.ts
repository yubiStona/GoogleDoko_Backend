import { describe, it, expect, vi, beforeEach } from "vitest";
import placeService, { VERIFIED_PLACE_DESCRIPTIONS } from "../services/place.service";
import { productRepository, orderRepository } from "../repository";

describe("Explore by Places - Backend Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Verified Places & Descriptions", () => {
    it("contains all 15 authentic Nepalese/Himalayan locations with verified descriptions", () => {
      const places = [
        "bhaktapur", "chitwan", "damak", "dang", "ilam", "jhapa", "kathmandu",
        "kavre", "kullu", "mustang", "nepalgunj", "nuwakot", "palpa", "siraha", "sunsari"
      ];
      places.forEach(p => {
        expect(VERIFIED_PLACE_DESCRIPTIONS[p]).toBeDefined();
        expect(VERIFIED_PLACE_DESCRIPTIONS[p].length).toBeGreaterThan(15);
      });
    });

    it("getPlaces computes counts and sold quantities correctly", async () => {
      const mockProducts = [
        { id: "p1", origin: "Bhaktapur, Nepal", sold: "5", category: "Curd & Dairy", active: 1 },
        { id: "p2", origin: "Bhaktapur, Nepal", sold: "2", category: "Vegetables", active: 1 },
        { id: "p3", origin: "Mustang, Nepal", sold: "10", category: "Apples & Fruits", active: 1 },
      ];

      const mockOrders = [
        { id: "o1", status: "CONFIRMED", itemsJson: JSON.stringify([{ productId: "p1", quantity: 3 }]) },
        { id: "o2", status: "CANCELLED", itemsJson: JSON.stringify([{ productId: "p1", quantity: 10 }]) }, // Cancelled, should be ignored
      ];

      vi.spyOn(productRepository, "find").mockResolvedValue(mockProducts as any);
      vi.spyOn(orderRepository, "find").mockResolvedValue(mockOrders as any);

      const places = await placeService.getPlaces();
      expect(places).toHaveLength(15);

      const bhaktapur = places.find(p => p.id === "bhaktapur");
      expect(bhaktapur).toBeDefined();
      expect(bhaktapur?.itemCount).toBe(2);
      // p1 baseline 5 + order 3 = 8; p2 baseline 2 = 10 total
      expect(bhaktapur?.soldCount).toBe(10);
      expect(bhaktapur?.activeCategoriesCount).toBe(2);

      const mustang = places.find(p => p.id === "mustang");
      expect(mustang?.itemCount).toBe(1);
      expect(mustang?.soldCount).toBe(10);
    });
  });

  describe("Dynamic Categories per Place", () => {
    it("getPlaceCategories aggregates categories strictly for the place", async () => {
      const qb: any = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        having: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { category: "Curd & Dairy", count: "3" },
          { category: "Vegetables", count: "2" },
        ]),
      };

      vi.spyOn(productRepository, "createQueryBuilder").mockReturnValue(qb);

      const categories = await placeService.getPlaceCategories("bhaktapur");
      expect(categories).toEqual([
        { id: "curd-dairy", name: "Curd & Dairy", productCount: 3 },
        { id: "vegetables", name: "Vegetables", productCount: 2 },
      ]);
    });
  });

  describe("Place Products Filtering & Pagination", () => {
    it("getPlaceProducts filters by category and search", async () => {
      const mockProducts = [
        { id: "p1", name: "Juju Dhau", origin: "Bhaktapur, Nepal", price: 150, category: "Curd & Dairy" }
      ];

      const qb: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProducts, 1]),
      };

      vi.spyOn(productRepository, "createQueryBuilder").mockReturnValue(qb);

      const result = await placeService.getPlaceProducts("bhaktapur", {
        category: "curd-dairy",
        search: "juju",
        minPrice: 100,
        maxPrice: 200,
        sort: "price-asc",
        page: 1,
        limit: 12
      });

      expect(result.total).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe("Juju Dhau");
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("LOWER(p.origin) LIKE :originMatch"),
        expect.objectContaining({ originMatch: "%bhaktapur%" })
      );
    });
  });

  describe("Most Popular in Place", () => {
    it("calculates genuine popularity using order items + baseline sales", async () => {
      const mockProducts = [
        { id: "p1", name: "Sweet Mustard Oil", origin: "Chitwan, Nepal", sold: "2", rating: 4.5, createdAt: new Date("2026-01-01") },
        { id: "p2", name: "Forest Honey", origin: "Chitwan, Nepal", sold: "1", rating: 4.8, createdAt: new Date("2026-01-02") },
      ];

      const mockOrders = [
        { id: "o1", status: "DELIVERED", itemsJson: JSON.stringify([{ productId: "p2", quantity: 5 }]) }
      ];

      const qb: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockProducts),
      };

      vi.spyOn(productRepository, "createQueryBuilder").mockReturnValue(qb);
      vi.spyOn(orderRepository, "find").mockResolvedValue(mockOrders as any);

      const popular = await placeService.getPlacePopularProducts("chitwan", 4);
      expect(popular).toHaveLength(2);
      // p2 has 1 baseline + 5 orders = 6; p1 has 2 baseline = 2
      // p2 should be first
      expect(popular[0].id).toBe("p2");
      expect(popular[1].id).toBe("p1");
    });
  });
});
