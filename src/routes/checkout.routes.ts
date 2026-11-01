import { Router } from "express";
import checkoutController from "../controllers/checkout.controller";
import { validateRequest } from "../middleware/validation.middleware";
import {
  calculateCheckoutValidator,
  validateCouponValidator,
} from "../validations/checkout.validator";

const router = Router();

router.get("/settings", checkoutController.getSettings);

router.post(
  "/calculate",
  calculateCheckoutValidator,
  validateRequest,
  checkoutController.calculateCheckout
);

router.post(
  "/coupons/validate",
  validateCouponValidator,
  validateRequest,
  checkoutController.validateCoupon
);

router.post("/verify-esewa", checkoutController.verifyEsewa);

router.post("/verify-khalti", checkoutController.verifyKhalti);

export default router;
