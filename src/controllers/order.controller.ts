import { Request, Response } from "express";
import orderService from "../services/order.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class OrderController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const role = String(req.user!.role);
      const result = await orderService.createCheckoutOrder(userId, role, req.body);
      sendSuccess(res, 201, messages.order.created, result);
    } catch (error: any) {
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, "A customer account is required to place orders.");
        return;
      }
      if (error?.message === "INSUFFICIENT_STOCK") {
        sendError(res, 400, messages.order.insufficientStock);
        return;
      }
      sendError(res, 500, error?.message || messages.common.internalServerError);
    }
  }

  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orders = await orderService.getUserOrders(userId);
      sendSuccess(res, 200, messages.order.retrieved, orders);
    } catch (error) {
      console.error("Get user orders error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const order = await orderService.getOrderById(String(req.params.id), userId, role);
      sendSuccess(res, 200, messages.order.retrievedOne, order);
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") {
        sendError(res, 404, messages.order.notFound);
        return;
      }
      if (error?.message === "FORBIDDEN") {
        sendError(res, 403, messages.common.forbidden);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async getTracking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const tracking = await orderService.getOrderTracking(String(req.params.id), userId);
      sendSuccess(res, 200, "Order tracking retrieved successfully", tracking);
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") {
        sendError(res, 404, messages.order.notFound);
        return;
      }
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new OrderController();
