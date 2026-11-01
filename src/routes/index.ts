import { Router } from "express";
import authRoutes from "./auth.routes";
import addressRoutes from "./address.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import wishlistRoutes from "./wishlist.routes";
import orderRoutes from "./order.routes";
import checkoutRoutes from "./checkout.routes";
import reviewRoutes from "./review.routes";
import rewardsRoutes from "./rewards.routes";
import vendorRoutes from "./vendor.routes";
import adminRoutes from "./admin.routes";
import supportRoutes from "./support.routes";
import uploadRoutes from "./upload.routes";
import testRoutes from "./test.routes";
import categoryRoutes from "./category.routes";
import offerRoutes from "./offer.routes";
import placeRoutes from "./place.routes";

import productController from "../controllers/product.controller";
import supportController from "../controllers/support.controller";
import checkoutController from "../controllers/checkout.controller";
import authController from "../controllers/auth.controller";
import { subscriberValidator } from "../validations/support.validator";
import { validateCouponValidator } from "../validations/checkout.validator";
import { updateShopValidator } from "../validations/auth.validator";
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/addresses", addressRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/reviews", reviewRoutes);
router.use("/rewards", rewardsRoutes);
router.use("/vendor", vendorRoutes);
router.use("/admin", adminRoutes);
router.use("/support", supportRoutes);
router.use("/upload", uploadRoutes);
router.use("/test", testRoutes);
router.use("/categories", categoryRoutes);
router.use("/offers", offerRoutes);
router.use("/places", placeRoutes);

// Direct top-level endpoints used by frontend
router.get("/search", productController.search);
router.post(
  "/newsletter",
  subscriberValidator,
  validateRequest,
  supportController.subscribeNewsletter
);
router.get("/settings", checkoutController.getSettings);
router.post(
  "/coupons/validate",
  validateCouponValidator,
  validateRequest,
  checkoutController.validateCoupon
);
router.put(
  "/me/shop",
  authenticate,
  updateShopValidator,
  validateRequest,
  authController.updateShop
);

export default router;
