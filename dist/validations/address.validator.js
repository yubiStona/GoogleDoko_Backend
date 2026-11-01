"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddressValidator = exports.createAddressValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createAddressValidator = [
    (0, express_validator_1.body)().custom((b) => {
        const name = b.fullName || b.recipientName || b.name;
        if (!name || !String(name).trim()) {
            throw new Error("Full name is required.");
        }
        const phone = b.phone || b.phoneNumber || b.recipientPhone;
        if (!phone || !String(phone).trim()) {
            throw new Error("Phone number is required.");
        }
        const city = b.city || b.district || b.location;
        if (!city || !String(city).trim()) {
            throw new Error("City is required.");
        }
        return true;
    }),
];
exports.updateAddressValidator = [
    (0, express_validator_1.body)().custom((b) => {
        if (b.fullName !== undefined && !String(b.fullName).trim()) {
            throw new Error("Full name cannot be empty.");
        }
        if (b.recipientName !== undefined && !String(b.recipientName).trim()) {
            throw new Error("Recipient name cannot be empty.");
        }
        if (b.phone !== undefined && !String(b.phone).trim()) {
            throw new Error("Phone number cannot be empty.");
        }
        return true;
    }),
];
