import { Request, Response } from "express";
import { sendError, sendSuccess } from "../helpers/response.helper";
import websiteCategoryService from "../services/website-category.service";

export class WebsiteCategoryController {
  async listAdmin(req: Request, res: Response) {
    try { sendSuccess(res, 200, "Website categories loaded.", await websiteCategoryService.listAdmin(Number(req.user?.id))); }
    catch (error) { console.error("Website categories load error:", error); sendError(res, 500, "Could not load categories."); }
  }
  async listPublic(req: Request, res: Response) {
    try { sendSuccess(res, 200, "Published categories loaded.", await websiteCategoryService.listPublic(String(req.query.group || "product"))); }
    catch (error: any) { sendError(res, 400, error?.message || "Could not load categories."); }
  }
  async saveDraft(req: Request, res: Response) {
    try {
      const id = req.params.id ? Number(req.params.id) : null;
      const result = await websiteCategoryService.saveDraft(id, req.body, Number(req.user?.id));
      sendSuccess(res, 200, "Category draft saved.", result);
    } catch (error: any) {
      const code = error?.message || "";
      sendError(res, code === "CATEGORY_NOT_FOUND" ? 404 : code === "SLUG_ALREADY_EXISTS" ? 409 : 400, code || "Could not save category.");
    }
  }
  async publish(req: Request, res: Response) {
    try { sendSuccess(res, 200, "Category published.", await websiteCategoryService.publish(Number(req.params.id), Number(req.user?.id))); }
    catch (error: any) { sendError(res, error?.message === "CATEGORY_NOT_FOUND" ? 404 : 400, error?.message || "Could not publish category."); }
  }
  async archive(req: Request, res: Response) {
    try { sendSuccess(res, 200, "Category archived.", await websiteCategoryService.archive(Number(req.params.id), Number(req.user?.id))); }
    catch (error: any) { sendError(res, error?.message === "CATEGORY_NOT_FOUND" ? 404 : 400, error?.message || "Could not archive category."); }
  }
  async remove(req: Request, res: Response) {
    try { await websiteCategoryService.delete(Number(req.params.id), req.body?.reassignToId ? Number(req.body.reassignToId) : undefined, Number(req.user?.id)); sendSuccess(res, 200, "Category deleted or archived."); }
    catch (error: any) {
      const code = error?.message || "";
      const inUse = code.startsWith("CATEGORY_IN_USE:");
      sendError(res, inUse ? 409 : code === "CATEGORY_NOT_FOUND" ? 404 : 400, inUse ? "CATEGORY_IN_USE" : code || "Could not delete category.", inUse ? { dependencies: code.split(":").slice(1).map(Number) } : undefined);
    }
  }
}

export default new WebsiteCategoryController();
