"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendor_controller_1 = __importDefault(require("../controllers/vendor.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const vendor_validator_1 = require("../validations/vendor.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, role_middleware_1.vendorOnly);
router.get("/orders", vendor_controller_1.default.getVendorOrders);
router.get("/products", vendor_controller_1.default.getVendorProducts);
router.post("/products", vendor_validator_1.vendorProductValidator, validation_middleware_1.validateRequest, vendor_controller_1.default.saveVendorProduct);
router.put("/products/:id", vendor_validator_1.vendorProductValidator, validation_middleware_1.validateRequest, vendor_controller_1.default.saveVendorProduct);
router.delete("/products/:id", vendor_controller_1.default.deleteVendorProduct);
exports.default = router;
