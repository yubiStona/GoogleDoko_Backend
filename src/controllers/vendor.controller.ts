import { Request, Response } from "express";
import vendorService from "../services/vendor.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class VendorController {
  async getVendorProducts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const products = await vendorService.getVendorProducts(userId);
      sendSuccess(res, 200, messages.vendor.retrieved, products);
    } catch (error) {
      console.error("Get vendor products error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async saveVendorProduct(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id ? String(req.params.id) : undefined;
      const result = await vendorService.saveVendorProduct(userId, req.body, id);
      sendSuccess(res, 200, messages.vendor.saved, result);
    } catch (error: any) {
      if (error?.message === "PRODUCT_NOT_FOUND") {
        sendError(res, 404, messages.product.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.vendor.forbidden);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async deleteVendorProduct(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      await vendorService.deleteVendorProduct(userId, String(req.params.id));
      sendSuccess(res, 200, messages.vendor.deleted);
    } catch (error: any) {
      if (error?.message === "PRODUCT_NOT_FOUND") {
        sendError(res, 404, messages.product.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.vendor.forbidden);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orders = await vendorService.getVendorOrders(userId);
      sendSuccess(res, 200, "Vendor orders retrieved successfully", orders);
    } catch (error) {
      console.error("Get vendor orders error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new VendorController();
