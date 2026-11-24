import { Request, Response } from "express";
import { contentRevisionRepository } from "../repository";
import { sendError, sendSuccess } from "../helpers/response.helper";

export class ContentHistoryController {
  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const type = typeof req.query.type === "string" ? req.query.type : undefined;
      const where = type ? { recordType: type } : {};
      const [rows, total] = await contentRevisionRepository.findAndCount({
        where, order: { createdAt: "DESC", id: "DESC" }, skip: (page - 1) * limit, take: limit,
      });
      sendSuccess(res, 200, "Content history loaded.", { items: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      console.error("Content history load error:", error);
      sendError(res, 500, "Could not load content history.");
    }
  }
}

export default new ContentHistoryController();
