import { Router } from "express";
import offerController from "../controllers/offer.controller";

const router = Router();

router.get("/", offerController.getOffers);

export default router;
