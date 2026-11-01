import { Request, Response } from "express";
import categoryService from "../services/category.service";
import productService from "../services/product.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class CategoryController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getCategories();
      sendSuccess(res, 200, "Categories retrieved successfully", categories);
    } catch (error) {
      console.error("Get categories error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.id);
      const category = await categoryService.getCategoryBySlug(slug);
      if (!category) {
        sendError(res, 404, "Category not found");
        return;
      }
      sendSuccess(res, 200, "Category retrieved successfully", category);
    } catch (error) {
      console.error("Get category error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryName = String(req.params.name);
      const products = await productService.getProducts({ category: categoryName });
      sendSuccess(res, 200, messages.product.retrieved, products);
    } catch (error) {
      console.error("Get products by category error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new CategoryController();
