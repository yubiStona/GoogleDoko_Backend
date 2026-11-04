import { Router } from "express";
import vendorController from "../controllers/vendor.controller";
import { authenticate } from "../middleware/auth.middleware";
import { vendorOnly } from "../middleware/role.middleware";
import { upload } from "../middleware/upload.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { vendorProductValidator } from "../validations/vendor.validator";

const router = Router();

router.use(authenticate, vendorOnly);

// Dashboard
router.get("/dashboard", vendorController.getVendorDashboard);

// Products
router.get("/products", vendorController.getVendorProducts);
router.get("/products/:id", vendorController.getVendorProductById);
router.post(
  "/products",
  vendorProductValidator,
  validateRequest,
  vendorController.saveVendorProduct
);
router.put(
  "/products/:id",
  vendorProductValidator,
  validateRequest,
  vendorController.saveVendorProduct
);
router.delete("/products/:id", vendorController.deleteVendorProduct);

// Orders
router.get("/orders", vendorController.getVendorOrders);
router.patch("/orders/:id/status", vendorController.updateVendorOrderStatus);

// Sales & Analytics
router.get("/sales", vendorController.getVendorSales);
router.get("/reports", vendorController.getVendorReports);
router.get("/analytics", vendorController.getVendorReports);

// Customers
router.get("/customers", vendorController.getVendorCustomers);

// Reviews & Replies
router.get("/reviews", vendorController.getVendorReviews);
router.post("/reviews/:id/reply", vendorController.replyVendorReview);

// Notifications
router.get("/notifications", vendorController.getVendorNotifications);

// Profile
router.get("/profile", vendorController.getVendorProfile);
router.put("/profile", vendorController.updateVendorProfile);
router.post("/profile/avatar", upload.single("image"), vendorController.uploadAvatar);
router.delete("/profile/avatar", vendorController.deleteAvatar);
router.post("/profile/store-logo", upload.single("image"), vendorController.uploadStoreLogo);
router.delete("/profile/store-logo", vendorController.deleteStoreLogo);
router.post("/profile/store-banner", upload.single("image"), vendorController.uploadStoreBanner);
router.delete("/profile/store-banner", vendorController.deleteStoreBanner);
router.put("/profile/password", vendorController.changePassword);

// Settings
router.get("/settings", vendorController.getVendorSettings);
router.put("/settings", vendorController.updateVendorSettings);

export default router;
