import express from "express";
import { body, param } from "express-validator";
import {
  createReviewController,
  deleteReviewController,
  getReviewByIdController,
  getReviewsController,
  getReviewsByTourController,
  updateReviewController,
} from "../controllers/reviewController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  [
    body("tour_id").isInt({ gt: 0 }).withMessage("tour_id must be a positive integer"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("comment is required"),
  ],
  validationMiddleware,
  createReviewController
);

router.get("/", getReviewsController);

router.get(
  "/tour/:tourId",
  [param("tourId").isInt({ gt: 0 }).withMessage("tourId must be a positive integer")],
  validationMiddleware,
  getReviewsByTourController
);

router.get(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getReviewByIdController
);

router.put(
  "/:id",
  authMiddleware,
  [
    param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("comment is required"),
  ],
  validationMiddleware,
  updateReviewController
);

router.delete(
  "/:id",
  authMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteReviewController
);

export default router;
