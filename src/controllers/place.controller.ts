import { Request, Response } from "express";
import placeService from "../services/place.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class PlaceController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const places = await placeService.getPlaces();
      sendSuccess(res, 200, "Places retrieved successfully", places);
    } catch (error) {
      console.error("Get places error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const slugOrId = String(req.params.slug || req.params.id);
      const data = await placeService.getPlaceBySlug(slugOrId);
      if (!data) {
        sendError(res, 404, "Place not found");
        return;
      }
      sendSuccess(res, 200, "Place details retrieved successfully", data);
    } catch (error) {
      console.error("Get place error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const slugOrId = String(req.params.slug || req.params.id);
      const categories = await placeService.getPlaceCategories(slugOrId);
      sendSuccess(res, 200, "Place categories retrieved successfully", categories);
    } catch (error) {
      console.error("Get place categories error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const slugOrId = String(req.params.slug || req.params.id);
      const { category, search, minPrice, maxPrice, sort, page, limit } = req.query;

      const filters = {
        category: category ? String(category) : undefined,
        search: search ? String(search) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sort ? (String(sort) as any) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      };

      const result = await placeService.getPlaceProducts(slugOrId, filters);
      sendSuccess(res, 200, "Place products retrieved successfully", result);
    } catch (error) {
      console.error("Get place products error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const slugOrId = String(req.params.slug || req.params.id);
      const limit = req.query.limit ? Number(req.query.limit) : 4;
      const popular = await placeService.getPlacePopularProducts(slugOrId, limit);
      sendSuccess(res, 200, "Popular place products retrieved successfully", popular);
    } catch (error) {
      console.error("Get place popular products error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new PlaceController();
