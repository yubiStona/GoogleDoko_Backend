import { body } from "express-validator";

export const createOrderValidator = [
  body("recipientName")
    .trim()
    .notEmpty()
    .withMessage("Recipient name is required."),

  body("recipientPhone")
    .trim()
    .notEmpty()
    .withMessage("Recipient phone number is required."),

  body("deliveryAddress")
    .trim()
    .notEmpty()
    .withMessage("Delivery address is required."),

  body("items")
    .isArray({ min: 1 })
    .withMessage("Order items list cannot be empty."),
];

export const updateOrderStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required.")
    .customSanitizer((val) => {
      if (!val) return val;
      const lower = String(val).trim().toLowerCase();
      const map: Record<string, string> = {
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
