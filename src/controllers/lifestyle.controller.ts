import { Request, Response } from "express";
import lifestyleService from "../services/lifestyle.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class LifestyleController {
  // Public: Get all active lifestyle collections
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const collections = await lifestyleService.getCollections(false);
      sendSuccess(res, 200, "Lifestyle collections retrieved successfully", collections);
    } catch (error) {
      console.error("Get lifestyle collections error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  // Public: Get one collection by slug
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug);
      const collection = await lifestyleService.getCollectionBySlug(slug);
      if (!collection) {
        sendError(res, 404, "Lifestyle collection not found");
        return;
      }
      sendSuccess(res, 200, "Lifestyle collection retrieved successfully", collection);
    } catch (error) {
      console.error("Get lifestyle collection error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  // Public: Get paginated products for a collection
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug);
      const {
        search,
        subcategory,
        minPrice,
        maxPrice,
        sort,
        page,
        limit,
      } = req.query;

      const result = await lifestyleService.getCollectionProducts(slug, {
        search: search ? String(search) : undefined,
        subcategory: subcategory ? String(subcategory) : undefined,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        sort: sort ? String(sort) : undefined,
        page: page !== undefined ? Number(page) : 1,
        limit: limit !== undefined ? Number(limit) : 12,
      });

      sendSuccess(res, 200, "Collection products retrieved successfully", result);
    } catch (error: any) {
      if (error?.message === "LIFESTYLE_NOT_FOUND") {
        sendError(res, 404, "Lifestyle collection not found");
        return;
      }
      console.error("Get collection products error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  /* Admin Endpoints */
  async adminGetAll(_req: Request, res: Response): Promise<void> {
    try {
      const collections = await lifestyleService.getCollections(true);
      sendSuccess(res, 200, "All lifestyle collections retrieved successfully", collections);
    } catch (error) {
      console.error("Admin get lifestyle collections error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async adminCreate(req: Request, res: Response): Promise<void> {
    try {
      const collection = await lifestyleService.createCollection(req.body);
      sendSuccess(res, 201, "Lifestyle collection created successfully", collection);
    } catch (error) {
      console.error("Admin create lifestyle collection error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async adminUpdate(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const collection = await lifestyleService.updateCollection(id, req.body);
      sendSuccess(res, 200, "Lifestyle collection updated successfully", collection);
    } catch (error: any) {
      if (error?.message === "LIFESTYLE_NOT_FOUND") {
        sendError(res, 404, "Lifestyle collection not found");
        return;
      }
      console.error("Admin update lifestyle collection error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async adminToggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const collection = await lifestyleService.toggleCollectionStatus(id);
      sendSuccess(res, 200, "Lifestyle collection status updated", collection);
    } catch (error: any) {
      if (error?.message === "LIFESTYLE_NOT_FOUND") {
        sendError(res, 404, "Lifestyle collection not found");
        return;
      }
      console.error("Admin toggle lifestyle status error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async adminDelete(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await lifestyleService.deleteCollection(id);
      sendSuccess(res, 200, "Lifestyle collection deleted successfully");
    } catch (error) {
      console.error("Admin delete lifestyle collection error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new LifestyleController();
