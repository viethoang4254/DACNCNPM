import express from "express";
import { body, param } from "express-validator";
import {
  checkTourCapacityController,
  getAdminBookingsController,
  getRevenueController,
  getStatsController,
} from "../controllers/adminController.js";
import {
  approveRefundController,
  getRefundDetailController,
  getRefundsController,
  rejectRefundController,
} from "../controllers/refundController.js";
import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markNotificationReadController,
} from "../controllers/notificationController.js";
import {
  createAdminItinerariesController,
  deleteAdminItinerariesController,
  getAdminItinerariesController,
  getAdminItineraryByTourController,
  updateAdminItinerariesController,
} from "../controllers/itineraryController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

const itineraryArrayValidation = [
  body("itineraries").isArray().withMessage("itineraries must be an array"),
  body("itineraries.*.day_number")
    .isInt({ gt: 0 })
    .withMessage("itinerary day_number must be a positive integer"),
  body("itineraries.*.title")
    .trim()
    .notEmpty()
    .withMessage("itinerary title is required")
    .isLength({ max: 255 })
    .withMessage("itinerary title must be at most 255 characters"),
  body("itineraries.*.description")
    .optional({ nullable: true })
    .isString()
    .withMessage("itinerary description must be a string"),
];

const createBulkItineraryValidation = [
  body("tour_id").isInt({ gt: 0 }).withMessage("tour_id must be a positive integer"),
  ...itineraryArrayValidation,
];

const updateBulkItineraryValidation = [...itineraryArrayValidation];

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStatsController);
router.get("/revenue", getRevenueController);
router.get("/bookings", getAdminBookingsController);
router.post(
  "/tour/check-capacity",
  [
    body("tour_id").optional().isInt({ gt: 0 }).withMessage("tour_id must be a positive integer"),
    body("schedule_id").optional().isInt({ gt: 0 }).withMessage("schedule_id must be a positive integer"),
  ],
  validationMiddleware,
  checkTourCapacityController,
);

router.get("/refunds", getRefundsController);
router.get(
  "/refunds/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getRefundDetailController,
);
router.post(
  "/refunds/:id/approve",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  approveRefundController,
);
router.post(
  "/refunds/:id/reject",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  rejectRefundController,
);

router.get("/notifications", getNotificationsController);
router.get("/notifications/unread-count", getUnreadNotificationCountController);
router.put(
  "/notifications/:id/read",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  markNotificationReadController,
);

router.get("/itineraries", getAdminItinerariesController);

router.get(
  "/itineraries/:tourId",
  [param("tourId").isInt({ gt: 0 }).withMessage("tourId must be a positive integer")],
  validationMiddleware,
  getAdminItineraryByTourController
);

router.post(
  "/itineraries",
  createBulkItineraryValidation,
  validationMiddleware,
  createAdminItinerariesController
);

router.put(
  "/itineraries/:tourId",
  [param("tourId").isInt({ gt: 0 }).withMessage("tourId must be a positive integer"), ...updateBulkItineraryValidation],
  validationMiddleware,
  updateAdminItinerariesController
);

router.delete(
  "/itineraries/:tourId",
  [param("tourId").isInt({ gt: 0 }).withMessage("tourId must be a positive integer")],
  validationMiddleware,
  deleteAdminItinerariesController
);

export default router;
