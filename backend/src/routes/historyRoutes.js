import express from "express";
import { body, param } from "express-validator";
import {
  getTourHistoryByUserController,
  saveTourHistoryController,
} from "../controllers/historyController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  [
    body("tour_id").isInt({ gt: 0 }).withMessage("tour_id must be a positive integer"),
  ],
  validationMiddleware,
  saveTourHistoryController
);

router.get(
  "/:userId",
  [param("userId").isInt({ gt: 0 }).withMessage("userId must be a positive integer")],
  validationMiddleware,
  getTourHistoryByUserController
);

export default router;
