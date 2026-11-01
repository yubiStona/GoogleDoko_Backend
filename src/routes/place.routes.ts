import { Router } from "express";
import placeController from "../controllers/place.controller";

const router = Router();

router.get("/", placeController.getAll);
router.get("/:id", placeController.getOne);

export default router;
