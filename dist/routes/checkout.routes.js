"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkout_controller_1 = __importDefault(require("../controllers/checkout.controller"));
const validation_middleware_1 = require("../middleware/validation.middleware");
const checkout_validator_1 = require("../validations/checkout.validator");
const router = (0, express_1.Router)();
router.get("/settings", checkout_controller_1.default.getSettings);
router.post("/calculate", checkout_validator_1.calculateCheckoutValidator, validation_middleware_1.validateRequest, checkout_controller_1.default.calculateCheckout);
router.post("/coupons/validate", checkout_validator_1.validateCouponValidator, validation_middleware_1.validateRequest, checkout_controller_1.default.validateCoupon);
router.post("/verify-esewa", checkout_controller_1.default.verifyEsewa);
router.post("/verify-khalti", checkout_controller_1.default.verifyKhalti);
exports.default = router;
