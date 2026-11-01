"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = __importDefault(require("../services/order.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class OrderController {
    async create(req, res) {
        try {
            const userId = req.user.id;
            const role = String(req.user.role);
            const result = await order_service_1.default.createCheckoutOrder(userId, role, req.body);
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.order.created, result);
        }
        catch (error) {
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, "A customer account is required to place orders.");
                return;
            }
            if (error?.message === "INSUFFICIENT_STOCK") {
                (0, response_helper_1.sendError)(res, 400, message_helper_1.messages.order.insufficientStock);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, error?.message || message_helper_1.messages.common.internalServerError);
        }
    }
    async getUserOrders(req, res) {
        try {
            const userId = req.user.id;
            const orders = await order_service_1.default.getUserOrders(userId);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.order.retrieved, orders);
        }
        catch (error) {
            console.error("Get user orders error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getOne(req, res) {
        try {
            const userId = req.user?.id;
            const role = req.user?.role;
            const order = await order_service_1.default.getOrderById(String(req.params.id), userId, role);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.order.retrievedOne, order);
        }
        catch (error) {
            if (error?.message === "ORDER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.order.notFound);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.common.forbidden);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getTracking(req, res) {
        try {
            const userId = req.user?.id;
            const tracking = await order_service_1.default.getOrderTracking(String(req.params.id), userId);
            (0, response_helper_1.sendSuccess)(res, 200, "Order tracking retrieved successfully", tracking);
        }
        catch (error) {
            if (error?.message === "ORDER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.order.notFound);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
}
exports.OrderController = OrderController;
exports.default = new OrderController();
