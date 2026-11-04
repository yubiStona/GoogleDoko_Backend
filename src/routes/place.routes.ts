import { Router } from "express";
import placeController from "../controllers/place.controller";

const router = Router();

router.get("/", placeController.getAll);
router.get("/:slug/categories", placeController.getCategories);
router.get("/:slug/products", placeController.getProducts);
router.get("/:slug/popular-products", placeController.getPopular);
router.get("/:slug", placeController.getOne);
router.get("/:id", placeController.getOne);

export default router;
