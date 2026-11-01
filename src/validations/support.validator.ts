import { body } from "express-validator";

export const supportInquiryValidator = [
  body().custom((b) => {
    const name = b.fullName || b.name;
    if (!name || !String(name).trim()) {
      throw new Error("Full name is required.");
    }

    const mail = b.gmail || b.email;
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(mail).trim())) {
      throw new Error("Please enter a valid email address.");
    }

    if (!b.inquiry && !b.message) {
      throw new Error("Inquiry message cannot be empty.");
    }
    return true;
  }),
];

export const subscriberValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address."),
];
