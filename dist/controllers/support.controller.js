"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const support_service_1 = __importDefault(require("../services/support.service"));
const response_helper_1 = require("../helpers/response.helper");
const message_helper_1 = require("../helpers/message.helper");
class SupportController {
    async submitContact(req, res) {
        try {
            const { fullName, name, gmail, email, contactNumber, phone, address, subject, inquiry, message, } = req.body || {};
            const msg = await support_service_1.default.submitInquiry({
                fullName: fullName || name || "Customer",
                email: gmail || email,
                phone: contactNumber || phone || "",
                address,
                subject: subject || "Customer Inquiry",
                inquiry: inquiry || message || "",
            });
            (0, response_helper_1.sendSuccess)(res, 201, message_helper_1.messages.support.inquirySubmitted, { id: msg.id });
        }
        catch (error) {
            console.error("Submit inquiry error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
    async subscribeNewsletter(req, res) {
        try {
            const result = await support_service_1.default.subscribe(req.body?.email);
            (0, response_helper_1.sendSuccess)(res, 200, message_helper_1.messages.support.subscribed, { ok: true, email: result.email });
        }
        catch (error) {
            console.error("Subscribe newsletter error:", error);
            (0, response_helper_1.sendError)(res, 500, message_helper_1.messages.common.internalServerError);
        }
    }
}
exports.SupportController = SupportController;
exports.default = new SupportController();
