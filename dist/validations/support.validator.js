"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriberValidator = exports.supportInquiryValidator = void 0;
const express_validator_1 = require("express-validator");
exports.supportInquiryValidator = [
    (0, express_validator_1.body)().custom((b) => {
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
exports.subscriberValidator = [
    (0, express_validator_1.body)("email")
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email address."),
];
