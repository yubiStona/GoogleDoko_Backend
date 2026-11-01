import { Router } from "express";
import adminController from "../controllers/admin.controller";
import authController from "../controllers/auth.controller";
import reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/role.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { loginValidator } from "../validations/auth.validator";
import { createCouponValidator } from "../validations/coupon.validator";
import { updateVendorStatusValidator } from "../validations/vendor.validator";
import { updateOrderStatusValidator } from "../validations/order.validator";
import {
  updateSettingsValidator,
  updateSupportStatusValidator,
} from "../validations/admin.validator";

const router = Router();

// Public Admin Login endpoint (returns admin JWT token)
router.post("/login", loginValidator, validateRequest, authController.login);

router.use(authenticate, adminOnly);

// Overview & Analytics
router.get("/overview", adminController.getOverview);

// Users & Vendors
router.get("/users", adminController.getUsers);
router.get("/vendors", adminController.getVendors);
router.patch(
  "/vendors/:userId/status",
  updateVendorStatusValidator,
  validateRequest,
  adminController.updateVendorStatus
);

// Coupons
router.get("/coupons", adminController.getCoupons);
router.post(
  "/coupons",
  createCouponValidator,
  validateRequest,
  adminController.createCoupon
);
router.patch("/coupons/:id/toggle", adminController.toggleCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

// Platform Settings
router.get("/settings", adminController.getSettings);
router.put(
  "/settings",
  updateSettingsValidator,
  validateRequest,
  adminController.updateSettings
);

// Orders
router.get("/orders", adminController.getOrders);
router.patch(
  "/orders/:id/status",
  updateOrderStatusValidator,
  validateRequest,
  adminController.updateOrderStatus
);

// Products
router.get("/products", adminController.getProducts);
router.post("/products", adminController.saveProduct);
router.put("/products/:id", adminController.saveProduct);
router.patch("/products/:id", adminController.saveProduct);
router.delete("/products/:id", adminController.deleteProduct);

// Reviews
router.get("/reviews", reviewController.getAllReviews);
router.delete("/reviews/:id", reviewController.deleteReview);

// Support & Subscribers
router.get("/support", adminController.getSupportMessages);
router.patch(
  "/support/:id",
  updateSupportStatusValidator,
  validateRequest,
  adminController.updateSupportStatus
);
router.get("/subscribers", adminController.getSubscribers);

export default router;
