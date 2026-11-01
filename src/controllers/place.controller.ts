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
      const idOrSlug = String(req.params.id);
      const data = await placeService.getPlaceById(idOrSlug);
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
}

export default new PlaceController();
