"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validator_1 = require("../validations/auth.validator");
const coupon_validator_1 = require("../validations/coupon.validator");
const vendor_validator_1 = require("../validations/vendor.validator");
const order_validator_1 = require("../validations/order.validator");
const admin_validator_1 = require("../validations/admin.validator");
const router = (0, express_1.Router)();
// Public Admin Login endpoint (returns admin JWT token)
router.post("/login", auth_validator_1.loginValidator, validation_middleware_1.validateRequest, auth_controller_1.default.login);
router.use(auth_middleware_1.authenticate, role_middleware_1.adminOnly);
// Overview & Analytics
router.get("/overview", admin_controller_1.default.getOverview);
// Users & Vendors
router.get("/users", admin_controller_1.default.getUsers);
router.get("/vendors", admin_controller_1.default.getVendors);
router.patch("/vendors/:userId/status", vendor_validator_1.updateVendorStatusValidator, validation_middleware_1.validateRequest, admin_controller_1.default.updateVendorStatus);
// Coupons
router.get("/coupons", admin_controller_1.default.getCoupons);
router.post("/coupons", coupon_validator_1.createCouponValidator, validation_middleware_1.validateRequest, admin_controller_1.default.createCoupon);
router.patch("/coupons/:id/toggle", admin_controller_1.default.toggleCoupon);
router.delete("/coupons/:id", admin_controller_1.default.deleteCoupon);
// Platform Settings
router.get("/settings", admin_controller_1.default.getSettings);
router.put("/settings", admin_validator_1.updateSettingsValidator, validation_middleware_1.validateRequest, admin_controller_1.default.updateSettings);
// Orders
router.get("/orders", admin_controller_1.default.getOrders);
router.patch("/orders/:id/status", order_validator_1.updateOrderStatusValidator, validation_middleware_1.validateRequest, admin_controller_1.default.updateOrderStatus);
// Products
router.get("/products", admin_controller_1.default.getProducts);
router.post("/products", admin_controller_1.default.saveProduct);
router.put("/products/:id", admin_controller_1.default.saveProduct);
router.patch("/products/:id", admin_controller_1.default.saveProduct);
router.delete("/products/:id", admin_controller_1.default.deleteProduct);
// Reviews
router.get("/reviews", review_controller_1.default.getAllReviews);
router.delete("/reviews/:id", review_controller_1.default.deleteReview);
// Support & Subscribers
router.get("/support", admin_controller_1.default.getSupportMessages);
router.patch("/support/:id", admin_validator_1.updateSupportStatusValidator, validation_middleware_1.validateRequest, admin_controller_1.default.updateSupportStatus);
router.get("/subscribers", admin_controller_1.default.getSubscribers);
exports.default = router;
