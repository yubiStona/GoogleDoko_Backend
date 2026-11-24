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
import homepageCmsController from "../controllers/homepage-cms.controller";
import { body, param } from "express-validator";
import websitePageController from "../controllers/website-page.controller";
import websiteCategoryController from "../controllers/website-category.controller";
import contentHistoryController from "../controllers/content-history.controller";
import {
  updateSettingsValidator,
  updateSupportStatusValidator,
} from "../validations/admin.validator";

const router = Router();

// Public Admin Login endpoint (returns admin JWT token)
router.post("/login", loginValidator, validateRequest, authController.login);

router.use(authenticate, adminOnly);

// Website CMS (all routes below this point require an authenticated admin).
router.get("/cms/homepage", homepageCmsController.getAdmin.bind(homepageCmsController));
router.get("/cms/history", contentHistoryController.list.bind(contentHistoryController));
router.put(
  "/cms/homepage/:key/draft",
  param("key").isIn(["hero", "food", "lifestyle"]),
  body("content").isObject(),
  body("visible").isBoolean(),
  body("displayOrder").isInt({ min: 0 }),
  validateRequest,
  homepageCmsController.saveDraft.bind(homepageCmsController)
);
router.post(
  "/cms/homepage/:key/publish",
  param("key").isIn(["hero", "food", "lifestyle"]),
  validateRequest,
  homepageCmsController.publish.bind(homepageCmsController)
);
router.get("/cms/pages", websitePageController.listAdmin.bind(websitePageController));
router.post("/cms/pages/draft", body("slug").isString(), body("content").isObject(), body("navigationVisible").isBoolean(), body("displayOrder").isInt({ min: 0 }), validateRequest, websitePageController.saveDraft.bind(websitePageController));
router.put("/cms/pages/:id/draft", param("id").isInt({ min: 1 }), body("slug").isString(), body("content").isObject(), body("navigationVisible").isBoolean(), body("displayOrder").isInt({ min: 0 }), validateRequest, websitePageController.saveDraft.bind(websitePageController));
router.post("/cms/pages/:id/publish", param("id").isInt({ min: 1 }), validateRequest, websitePageController.publish.bind(websitePageController));
router.patch("/cms/pages/:id/status", param("id").isInt({ min: 1 }), body("status").isIn(["draft", "archived"]), validateRequest, websitePageController.status.bind(websitePageController));
router.get("/cms/categories", websiteCategoryController.listAdmin.bind(websiteCategoryController));
router.post("/cms/categories/draft", body("group").isIn(["product", "place", "lifestyle"]), body("content").isObject(), body("displayOrder").isInt({ min: 0 }), validateRequest, websiteCategoryController.saveDraft.bind(websiteCategoryController));
router.put("/cms/categories/:id/draft", param("id").isInt({ min: 1 }), body("group").isIn(["product", "place", "lifestyle"]), body("content").isObject(), body("displayOrder").isInt({ min: 0 }), validateRequest, websiteCategoryController.saveDraft.bind(websiteCategoryController));
router.post("/cms/categories/:id/publish", param("id").isInt({ min: 1 }), validateRequest, websiteCategoryController.publish.bind(websiteCategoryController));
router.patch("/cms/categories/:id/archive", param("id").isInt({ min: 1 }), validateRequest, websiteCategoryController.archive.bind(websiteCategoryController));
router.delete("/cms/categories/:id", param("id").isInt({ min: 1 }), validateRequest, websiteCategoryController.remove.bind(websiteCategoryController));

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
router.patch("/reviews/:id/status", reviewController.adminUpdateStatus);
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
