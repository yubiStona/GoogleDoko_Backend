import { Router } from "express";
import productController from "../controllers/product.controller";
import reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { UserRole } from "../entities/user.entity";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createProductValidator,
  updateProductValidator,
} from "../validations/product.validator";

const router = Router();

router.get("/", productController.getAll);
router.get("/popular", productController.getPopular);
router.get("/featured", productController.getFeatured);
router.get("/latest", productController.getLatest);
router.get("/search", productController.search);
router.get("/:id", productController.getOne);
router.get("/:id/reviews", reviewController.getProductReviews);

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VENDOR),
  createProductValidator,
  validateRequest,
  productController.create
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VENDOR),
  updateProductValidator,
  validateRequest,
  productController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VENDOR),
  productController.delete
);

export default router;
