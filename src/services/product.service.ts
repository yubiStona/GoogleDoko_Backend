import { productRepository } from "../repository";
import { Product } from "../entities/product.entity";

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

  async getProductById(id: string): Promise<Product | null> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return product;
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    return this.getProducts({
      search: query,
      category,
    });
  }

  async createProduct(data: Partial<Product>, userId?: number, role?: string): Promise<Product> {
    const id = data.id || `PROD-${Date.now()}`;
    const product = productRepository.create({
      ...data,
      id,
      vendorUserId: role === "vendor" ? userId : (data.vendorUserId ?? null),
      stock: data.stock ?? 100,
      active: data.active ?? 1,
      rating: data.rating ?? 4.8,
      sold: data.sold ?? "0",
      origin: data.origin || "Nepal",
      seller: data.seller || "GoogleDoko Store",
    });

    return await productRepository.save(product);
  }

  async updateProduct(id: string, data: Partial<Product>, userId?: number, role?: string): Promise<Product> {
    const product = await productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (role === "vendor" && product.vendorUserId !== userId) {
      throw new Error("FORBIDDEN");
    }

    Object.assign(product, data);
    return await productRepository.save(product);
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
