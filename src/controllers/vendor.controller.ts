import { Request, Response } from "express";
import vendorService from "../services/vendor.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class VendorController {
  async getVendorDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorDashboard(userId);
      sendSuccess(res, 200, "Vendor dashboard retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor dashboard error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

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

  async getVendorProductById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);
      const product = await vendorService.getVendorProductById(userId, productId);
      sendSuccess(res, 200, messages.product.retrievedOne, product);
    } catch (error: any) {
      if (error?.message === "PRODUCT_NOT_FOUND") {
        sendError(res, 404, messages.product.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.vendor.forbidden);
        return;
      }
      console.error("Get vendor product by id error:", error);
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
      console.error("Save vendor product error:", error);
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
      console.error("Delete vendor product error:", error);
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

  async updateVendorOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = String(req.params.id);
      const status = String(req.body.status || req.body.orderStatus);

      if (!status) {
        sendError(res, 400, "Status is required.");
        return;
      }

      const result = await vendorService.updateVendorOrderStatus(userId, orderId, status);
      sendSuccess(res, 200, "Order status updated successfully", result);
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") {
        sendError(res, 404, messages.order.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.vendor.forbidden);
        return;
      }
      console.error("Update vendor order status error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorSales(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorSales(userId);
      sendSuccess(res, 200, "Vendor sales retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor sales error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const range = String(req.query.range || "30days");
      const data = await vendorService.getVendorReports(userId, range);
      sendSuccess(res, 200, "Vendor reports retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor reports error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorCustomers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorCustomers(userId);
      sendSuccess(res, 200, "Vendor customers retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor customers error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorReviews(userId);
      sendSuccess(res, 200, "Vendor reviews retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor reviews error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async replyVendorReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reviewId = Number(req.params.id);
      const reply = String(req.body.reply || "");

      if (!reply.trim()) {
        sendError(res, 400, "Reply text is required.");
        return;
      }

      const result = await vendorService.replyVendorReview(userId, reviewId, reply);
      sendSuccess(res, 200, "Reply posted successfully", result);
    } catch (error: any) {
      if (error?.message === "REVIEW_NOT_FOUND") {
        sendError(res, 404, messages.review.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.vendor.forbidden);
        return;
      }
      console.error("Reply vendor review error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorNotifications(userId);
      sendSuccess(res, 200, "Vendor notifications retrieved successfully", data);
    } catch (error) {
      console.error("Get vendor notifications error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorProfile(userId);
      sendSuccess(res, 200, "Vendor profile retrieved successfully", data);
    } catch (error: any) {
      if (error?.message === "VENDOR_NOT_FOUND") {
        sendError(res, 404, messages.vendor.notFound);
        return;
      }
      console.error("Get vendor profile error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async updateVendorProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.updateVendorProfile(userId, req.body);
      sendSuccess(res, 200, "Vendor profile updated successfully", data);
    } catch (error: any) {
      if (error?.message === "VENDOR_NOT_FOUND") {
        sendError(res, 404, messages.vendor.notFound);
        return;
      }
      console.error("Update vendor profile error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getVendorSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.getVendorSettings(userId);
      sendSuccess(res, 200, "Vendor settings retrieved successfully", data);
    } catch (error: any) {
      console.error("Get vendor settings error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async updateVendorSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.updateVendorSettings(userId, req.body);
      sendSuccess(res, 200, "Vendor settings updated successfully", data);
    } catch (error: any) {
      if (error?.message === "VENDOR_NOT_FOUND") {
        sendError(res, 404, messages.vendor.notFound);
        return;
      }
      console.error("Update vendor settings error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        sendError(res, 400, "Please provide an image file.");
        return;
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const data = await vendorService.updateVendorAvatar(userId, fileUrl);
      sendSuccess(res, 200, "Profile picture updated successfully", data);
    } catch (error: any) {
      console.error("Upload vendor avatar error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.deleteVendorAvatar(userId);
      sendSuccess(res, 200, "Profile picture removed successfully", data);
    } catch (error: any) {
      console.error("Delete vendor avatar error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async uploadStoreLogo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        sendError(res, 400, "Please provide an image file.");
        return;
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const data = await vendorService.updateStoreLogo(userId, fileUrl);
      sendSuccess(res, 200, "Store logo updated successfully", data);
    } catch (error: any) {
      console.error("Upload store logo error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async deleteStoreLogo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.deleteStoreLogo(userId);
      sendSuccess(res, 200, "Store logo removed successfully", data);
    } catch (error: any) {
      console.error("Delete store logo error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async uploadStoreBanner(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        sendError(res, 400, "Please provide an image file.");
        return;
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const data = await vendorService.updateStoreBanner(userId, fileUrl);
      sendSuccess(res, 200, "Store banner updated successfully", data);
    } catch (error: any) {
      console.error("Upload store banner error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async deleteStoreBanner(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await vendorService.deleteStoreBanner(userId);
      sendSuccess(res, 200, "Store banner removed successfully", data);
    } catch (error: any) {
      console.error("Delete store banner error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        sendError(res, 400, "Current password and new password are required.");
        return;
      }

      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        sendError(res, 400, "New password and confirmation password do not match.");
        return;
      }

      if (newPassword.length < 6) {
        sendError(res, 400, "New password must be at least 6 characters long.");
        return;
      }

      await vendorService.changeVendorPassword(userId, currentPassword, newPassword);
      sendSuccess(res, 200, "Password changed successfully.");
    } catch (error: any) {
      if (error?.message === "CURRENT_PASSWORD_INCORRECT") {
        sendError(res, 400, "The current password you entered is incorrect.");
        return;
      }
      if (error?.message === "USER_NOT_FOUND") {
        sendError(res, 404, messages.common.resourceNotFound);
        return;
      }
      console.error("Vendor change password error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new VendorController();
