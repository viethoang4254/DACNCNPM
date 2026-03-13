import express from "express";
import { body, param } from "express-validator";
import {
  getAdminBookingsController,
  getRevenueController,
  getStatsController,
} from "../controllers/adminController.js";
import {
  createItineraryController,
  deleteItineraryController,
  getTourItinerariesController,
  uploadItineraryImageController,
  updateItineraryController,
} from "../controllers/itineraryController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

const itineraryBodyValidation = [
  body("tour_id").isInt({ gt: 0 }).withMessage("tour_id must be a positive integer"),
  body("ngay_thu").isInt({ gt: 0 }).withMessage("ngay_thu must be a positive integer"),
  body("tieu_de")
    .trim()
    .notEmpty()
    .withMessage("tieu_de is required")
    .isLength({ max: 255 })
    .withMessage("tieu_de must be at most 255 characters"),
  body("description").optional({ nullable: true }).isString().withMessage("description must be a string"),
  body("image_url").optional({ nullable: true }).isString().withMessage("image_url must be a string"),
];

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStatsController);
router.get("/revenue", getRevenueController);
router.get("/bookings", getAdminBookingsController);

router.get(
  "/tours/:tourId/itineraries",
  [param("tourId").isInt({ gt: 0 }).withMessage("tourId must be a positive integer")],
  validationMiddleware,
  getTourItinerariesController
);

router.post(
  "/itineraries",
  itineraryBodyValidation,
  validationMiddleware,
  createItineraryController
);

router.post(
  "/itineraries/upload-image",
  upload.single("image"),
  uploadItineraryImageController
);

router.put(
  "/itineraries/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"), ...itineraryBodyValidation],
  validationMiddleware,
  updateItineraryController
);

router.delete(
  "/itineraries/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteItineraryController
);

export default router;
