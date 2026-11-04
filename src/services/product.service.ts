import { productRepository } from "../repository";
import { Product } from "../entities/product.entity";
import lifestyleService from "./lifestyle.service";
import {
  resolveSellingUnit,
  isUnitAllowedForCategory,
  isDecimalAllowedForUnit,
} from "../helpers/sellingUnit.helper";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const qb = productRepository.createQueryBuilder("product");

    qb.where("product.active = 1");

    if (filters?.category && filters.category !== "all" && filters.category !== "All") {
      qb.andWhere("LOWER(product.category) = LOWER(:category)", {
        category: filters.category,
      });
    }

    if (filters?.search) {
      qb.andWhere(
        "(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search) OR LOWER(product.origin) LIKE LOWER(:search))",
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.minPrice !== undefined) {
      qb.andWhere("product.price >= :minPrice", { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice !== undefined) {
      qb.andWhere("product.price <= :maxPrice", { maxPrice: filters.maxPrice });
    }

    if (filters?.sort === "price_asc") {
      qb.orderBy("product.price", "ASC");
    } else if (filters?.sort === "price_desc") {
      qb.orderBy("product.price", "DESC");
    } else if (filters?.sort === "popular") {
      qb.orderBy("product.rating", "DESC").addOrderBy("product.id", "ASC");
    } else if (filters?.sort === "latest") {
      qb.orderBy("product.createdAt", "DESC").addOrderBy("product.id", "DESC");
    } else if (filters?.sort === "rating") {
      qb.orderBy("product.rating", "DESC");
    } else {
      qb.orderBy("product.id", "ASC");
    }

    if (filters?.limit) {
      qb.take(filters.limit);
      if (filters.page && filters.page > 1) {
        qb.skip((filters.page - 1) * filters.limit);
      }
    }

    return await qb.getMany();
  }

  async getPopularProducts(limit = 8): Promise<Product[]> {
    return this.getProducts({
      sort: "popular",
      limit,
    });
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return this.getProducts({
      limit,
    });
  }

  async getLatestProducts(limit = 8): Promise<Product[]> {
    return this.getProducts({
      sort: "latest",
      limit,
    });
  }

  async getProductById(id: string): Promise<any> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const lifestyles = await lifestyleService.getProductLifestyles(id);

    let parsedVariants: any[] = [];
    if (product.variantsJson) {
      try {
        parsedVariants = JSON.parse(product.variantsJson);
      } catch (_) {
        parsedVariants = [];
      }
    }

    return {
      ...product,
      variants: parsedVariants,
      lifestyleIds: lifestyles.map((l) => l.lifestyleId),
      lifestyles,
    };
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    return this.getProducts({
      search: query,
      category,
    });
  }

  async createProduct(data: any, userId?: number, role?: string): Promise<Product> {
    const id = data.id || `PROD-${Date.now()}`;
    const product = new Product();

    const category = data.category || "Others";
    const requestedUnit = data.sellingUnit || data.unit;
    const unitResolution = resolveSellingUnit(category, requestedUnit, data.weight);

    let variantsJsonStr: string | null = null;
    if (data.variants && Array.isArray(data.variants)) {
      variantsJsonStr = JSON.stringify(data.variants);
    } else if (typeof data.variantsJson === "string") {
      variantsJsonStr = data.variantsJson;
    }

    Object.assign(product, {
      ...data,
      id,
      category,
      weight: data.weight || "1 unit",
      sellingUnit: unitResolution.sellingUnit,
      allowDecimals: data.allowDecimals !== undefined ? Number(data.allowDecimals) : unitResolution.allowDecimals,
      variantsJson: variantsJsonStr,
      vendorUserId: role === "vendor" ? userId : (data.vendorUserId ?? null),
      stock: data.stock !== undefined ? Number(data.stock) : 100,
      active: data.active ?? 1,
      rating: data.rating ?? 4.8,
      sold: data.sold ?? "0",
      origin: data.origin || "Nepal",
      seller: data.seller || "GoogleDoko Store",
    });

    const saved = await productRepository.save(product);

    if (data.lifestyles !== undefined || data.lifestyleIds !== undefined) {
      const assignments =
        data.lifestyles ||
        (Array.isArray(data.lifestyleIds)
          ? data.lifestyleIds.map((lid: string) => ({
              lifestyleId: lid,
              subcategory: data.lifestyleSubcategory || null,
            }))
          : []);
      await lifestyleService.assignProductLifestyles(id, assignments);
    }

    return saved;
  }

  async updateProduct(id: string, data: any, userId?: number, role?: string): Promise<Product> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (role === "vendor" && product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    const category = data.category !== undefined ? data.category : product.category;
    let sellingUnit = product.sellingUnit;
    let allowDecimals = product.allowDecimals;

    if (data.sellingUnit !== undefined || data.unit !== undefined) {
      const unitRes = resolveSellingUnit(category, data.sellingUnit || data.unit, data.weight || product.weight);
      sellingUnit = unitRes.sellingUnit;
      allowDecimals = data.allowDecimals !== undefined ? Number(data.allowDecimals) : unitRes.allowDecimals;
    } else if (data.category !== undefined && data.category !== product.category) {
      const unitRes = resolveSellingUnit(category, product.sellingUnit, data.weight || product.weight);
      sellingUnit = unitRes.sellingUnit;
      allowDecimals = unitRes.allowDecimals;
    }

    if (data.allowDecimals !== undefined) {
      allowDecimals = Number(data.allowDecimals);
    }

    let variantsJsonStr = product.variantsJson;
    if (data.variants !== undefined) {
      variantsJsonStr = Array.isArray(data.variants) ? JSON.stringify(data.variants) : null;
    } else if (data.variantsJson !== undefined) {
      variantsJsonStr = data.variantsJson;
    }

    Object.assign(product, {
      ...data,
      category,
      sellingUnit,
      allowDecimals,
      variantsJson: variantsJsonStr,
    });

    const saved: Product = await productRepository.save(product);

    if (data.lifestyles !== undefined || data.lifestyleIds !== undefined) {
      const assignments =
        data.lifestyles ||
        (Array.isArray(data.lifestyleIds)
          ? data.lifestyleIds.map((lid: string) => ({
              lifestyleId: lid,
              subcategory: data.lifestyleSubcategory || null,
            }))
          : []);
      await lifestyleService.assignProductLifestyles(id, assignments);
    }

    return saved;
  }

  async deleteProduct(id: string, userId?: number, role?: string): Promise<void> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (role === "vendor" && product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    await productRepository.remove(product);
  }
}

export default new ProductService();
