import { Request, Response } from "express";
import supportService from "../services/support.service";
import { sendSuccess, sendError } from "../helpers/response.helper";
import { messages } from "../helpers/message.helper";

export class SupportController {
  async submitContact(req: Request, res: Response): Promise<void> {
    try {
      const {
        fullName,
        name,
        gmail,
        email,
        contactNumber,
        phone,
        address,
        subject,
        inquiry,
        message,
      } = req.body || {};

      const msg = await supportService.submitInquiry({
        fullName: fullName || name || "Customer",
        email: gmail || email,
        phone: contactNumber || phone || "",
        address,
        subject: subject || "Customer Inquiry",
        inquiry: inquiry || message || "",
      });

      sendSuccess(res, 201, messages.support.inquirySubmitted, { id: msg.id });
    } catch (error) {
      console.error("Submit inquiry error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }

  async subscribeNewsletter(req: Request, res: Response): Promise<void> {
    try {
      const result = await supportService.subscribe(req.body?.email);
      sendSuccess(res, 200, messages.support.subscribed, { ok: true, email: result.email });
    } catch (error) {
      console.error("Subscribe newsletter error:", error);
      sendError(res, 500, messages.common.internalServerError);
    }
  }
}

export default new SupportController();
