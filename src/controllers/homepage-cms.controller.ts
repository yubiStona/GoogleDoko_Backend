import { Request, Response } from "express";
import { sendError, sendSuccess } from "../helpers/response.helper";
import homepageCmsService from "../services/homepage-cms.service";

export class HomepageCmsController {
  async getAdmin(_req: Request, res: Response) {
    try { sendSuccess(res, 200, "Homepage content loaded.", await homepageCmsService.getAdminHomepage()); }
    catch (error) { console.error("Admin homepage load error:", error); sendError(res, 500, "Could not load homepage content."); }
  }

  async saveDraft(req: Request, res: Response) {
    try {
      const result = await homepageCmsService.saveDraft(
        String(req.params.key),
        req.body.content,
        req.body.visible,
        req.body.displayOrder,
        Number(req.user?.id)
      );
      sendSuccess(res, 200, "Draft saved.", result);
    } catch (error: any) {
      const status = error?.message === "INVALID_SECTION" ? 404 : 400;
      sendError(res, status, error?.message || "Could not save draft.");
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const result = await homepageCmsService.publish(String(req.params.key), Number(req.user?.id));
      sendSuccess(res, 200, "Homepage section published.", result);
    } catch (error: any) {
      const status = error?.message === "INVALID_SECTION" ? 404 : 400;
      sendError(res, status, error?.message === "NO_DRAFT" ? "Save a draft before publishing." : error?.message || "Could not publish section.");
    }
  }
}

export default new HomepageCmsController();
