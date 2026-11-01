"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutController = void 0;
const checkout_service_1 = __importDefault(require("../services/checkout.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class CheckoutController {
    async getSettings(_req, res) {
        try {
            const settings = await checkout_service_1.default.getSettings();
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.checkout.settingsRetrieved, settings);
        }
        catch (error) {
            console.error("Get settings error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async validateCoupon(req, res) {
        try {
            const { code, subtotal = 0 } = req.body || {};
            const result = await checkout_service_1.default.validateCoupon(code, subtotal);
            if (!result.valid) {
                (0, response_helper_1.sendError)(res, 400, result.error || message_helper_1.messages.checkout.couponInvalid, { valid: false });
                return;
            }
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.checkout.couponValid, result);
        }
        catch (error) {
            console.error("Validate coupon error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async calculateCheckout(req, res) {
        try {
            const { items = [], couponCode } = req.body || {};
            const summary = await checkout_service_1.default.calculateCheckout(items, couponCode);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.checkout.calculated, summary);
        }
        catch (error) {
            console.error("Calculate checkout error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async verifyEsewa(req, res) {
        try {
            const result = await checkout_service_1.default.verifyEsewaPayment(req.body);
            (0, response_helper_1.sendSuccess)(res, 200, "eSewa payment verified successfully.", result);
        }
        catch (error) {
            if (error?.message === "ORDER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.order.notFound);
                return;
            }
            if (error?.message === "PAYMENT_AMOUNT_MISMATCH") {
                (0, response_helper_1.sendError)(res, 400, "Payment amount does not match the order total.");
                return;
            }
            (0, response_helper_1.sendError)(res, 400, error?.message || "eSewa payment verification failed.");
        }
    }
    async verifyKhalti(req, res) {
        try {
            const result = await checkout_service_1.default.verifyKhaltiPayment(req.body);
            (0, response_helper_1.sendSuccess)(res, 200, "Khalti payment verified successfully.", result);
        }
        catch (error) {
            if (error?.message === "ORDER_NOT_FOUND") {
                (0, response_helper_1.sendError)(res, 404, message_helper_1.messages.order.notFound);
                return;
            }
            if (error?.message === "PAYMENT_AMOUNT_MISMATCH") {
                (0, response_helper_1.sendError)(res, 400, "Payment amount does not match the order total.");
                return;
            }
            (0, response_helper_1.sendError)(res, 400, error?.message || "Khalti payment verification failed.");
        }
    }
}
exports.CheckoutController = CheckoutController;
exports.default = new CheckoutController();
