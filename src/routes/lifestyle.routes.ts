import { Router } from "express";
import lifestyleController from "../controllers/lifestyle.controller";

const router = Router();

// Public endpoints
router.get("/", lifestyleController.getAll);
router.get("/:slug", lifestyleController.getOne);
router.get("/:slug/products", lifestyleController.getProducts);

export default router;
