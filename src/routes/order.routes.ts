import { Router } from "express";
import orderController from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { createOrderValidator } from "../validations/order.validator";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  createOrderValidator,
  validateRequest,
  orderController.create
);

router.get("/", orderController.getUserOrders);

router.get("/:id/track", orderController.getTracking);
router.get("/:id", orderController.getOne);

export default router;
