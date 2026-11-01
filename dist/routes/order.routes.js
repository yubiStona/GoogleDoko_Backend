"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = __importDefault(require("../controllers/order.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const order_validator_1 = require("../validations/order.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", order_validator_1.createOrderValidator, validation_middleware_1.validateRequest, order_controller_1.default.create);
router.get("/", order_controller_1.default.getUserOrders);
router.get("/:id/track", order_controller_1.default.getTracking);
router.get("/:id", order_controller_1.default.getOne);
exports.default = router;
