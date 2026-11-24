import { Request, Response } from "express";
import { sendError, sendSuccess } from "../helpers/response.helper";
import websitePageService from "../services/website-page.service";

export class WebsitePageController {
  async listAdmin(_req: Request, res: Response) {
    try { sendSuccess(res, 200, "Website pages loaded.", await websitePageService.listAdmin()); }
    catch (error) { console.error("Website pages load error:", error); sendError(res, 500, "Could not load pages."); }
  }
  async saveDraft(req: Request, res: Response) {
    try {
      const id = req.params.id ? Number(req.params.id) : null;
      if (id !== null && !Number.isInteger(id)) { sendError(res, 400, "Invalid page ID."); return; }
      sendSuccess(res, 200, "Page draft saved.", await websitePageService.saveDraft(id, req.body, Number(req.user?.id)));
    } catch (error: any) {
      const code = error?.message || "";
      sendError(res, code === "PAGE_NOT_FOUND" ? 404 : code === "SLUG_ALREADY_EXISTS" ? 409 : 400, code || "Could not save page draft.");
    }
  }
  async publish(req: Request, res: Response) {
    try { sendSuccess(res, 200, "Page published.", await websitePageService.publish(Number(req.params.id), Number(req.user?.id))); }
    catch (error: any) { const code = error?.message || ""; sendError(res, code === "PAGE_NOT_FOUND" ? 404 : code === "SLUG_ALREADY_EXISTS" ? 409 : 400, code || "Could not publish page."); }
  }
  async status(req: Request, res: Response) {
    try {
      const status = req.body.status;
      if (status !== "draft" && status !== "archived") { sendError(res, 400, "Invalid page status."); return; }
      sendSuccess(res, 200, status === "draft" ? "Page unpublished." : "Page archived.", await websitePageService.setStatus(Number(req.params.id), status, Number(req.user?.id)));
    } catch (error: any) { sendError(res, error?.message === "PAGE_NOT_FOUND" ? 404 : 400, error?.message || "Could not update page status."); }
  }
  async getPublic(req: Request, res: Response) {
    try {
      const page = await websitePageService.getPublic(String(req.params.slug));
      if (!page) { sendError(res, 404, "Published page not found."); return; }
      sendSuccess(res, 200, "Published page loaded.", page);
    } catch (error) { console.error("Public page load error:", error); sendError(res, 500, "Could not load page."); }
  }
}

export default new WebsitePageController();
