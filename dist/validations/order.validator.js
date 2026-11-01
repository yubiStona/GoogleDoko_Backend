"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusValidator = exports.createOrderValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createOrderValidator = [
    (0, express_validator_1.body)("recipientName")
        .trim()
        .notEmpty()
        .withMessage("Recipient name is required."),
    (0, express_validator_1.body)("recipientPhone")
        .trim()
        .notEmpty()
        .withMessage("Recipient phone number is required."),
    (0, express_validator_1.body)("deliveryAddress")
        .trim()
        .notEmpty()
        .withMessage("Delivery address is required."),
    (0, express_validator_1.body)("items")
        .isArray({ min: 1 })
        .withMessage("Order items list cannot be empty."),
];
exports.updateOrderStatusValidator = [
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage("Status is required.")
        .customSanitizer((val) => {
        if (!val)
            return val;
        const lower = String(val).trim().toLowerCase();
        const map = {
            pending: "Pending",
            processing: "Processing",
            shipped: "Shipped",
            "out for delivery": "Out for Delivery",
            delivered: "Delivered",
            cancelled: "Cancelled",
            canceled: "Cancelled",
        };
        return map[lower] || val;
    })
        .isIn([
        "Pending",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
    ])
        .withMessage("Invalid order status."),
];
