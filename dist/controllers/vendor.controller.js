"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorController = void 0;
const vendor_service_1 = __importDefault(require("../services/vendor.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class VendorController {
    async getVendorProducts(req, res) {
        try {
            const userId = req.user.id;
            const products = await vendor_service_1.default.getVendorProducts(userId);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.vendor.retrieved, products);
        }
        catch (error) {
            console.error("Get vendor products error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async saveVendorProduct(req, res) {
        try {
            const userId = req.user.id;
            const id = req.params.id ? String(req.params.id) : undefined;
            const result = await vendor_service_1.default.saveVendorProduct(userId, req.body, id);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.vendor.saved, result);
        }
        catch (error) {
            if (error?.message === "PRODUCT_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.product.notFound);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.vendor.forbidden);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async deleteVendorProduct(req, res) {
        try {
            const userId = req.user.id;
            await vendor_service_1.default.deleteVendorProduct(userId, String(req.params.id));
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.vendor.deleted);
        }
        catch (error) {
            if (error?.message === "PRODUCT_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.product.notFound);
                return;
            }
            if (error?.message === "FORBIDDEN") {
                (0, response_helper_1.sendError)(res, 403, message_helper_1.messages.vendor.forbidden);
                return;
            }
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async getVendorOrders(req, res) {
        try {
            const userId = req.user.id;
            const orders = await vendor_service_1.default.getVendorOrders(userId);
            (0, response_helper_1.sendSuccess)(res, 200, "Vendor orders retrieved successfully", orders);
        }
        catch (error) {
            console.error("Get vendor orders error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
}
exports.VendorController = VendorController;
exports.default = new VendorController();
