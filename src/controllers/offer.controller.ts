import { Request, Response } from "express";
import offerService from "../services/offer.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class OfferController {
  async getOffers(_req: Request, res: Response): Promise<void> {
    try {
      const data = await offerService.getOffers();
      sendSuccess(res, 200, "Offers retrieved successfully", data);
    } catch (error) {
      console.error("Get offers error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new OfferController();
