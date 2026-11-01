import { Router } from "express";
import vendorController from "../controllers/vendor.controller";
import { authenticate } from "../middleware/auth.middleware";
import { vendorOnly } from "../middleware/role.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { vendorProductValidator } from "../validations/vendor.validator";

const router = Router();

router.use(authenticate, vendorOnly);

router.get("/orders", vendorController.getVendorOrders);
router.get("/products", vendorController.getVendorProducts);

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

export default router;
