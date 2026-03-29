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
import {
  applySaleToScheduleController,
  removeSaleFromScheduleController,
} from "../controllers/scheduleController.js";
import {
  hideReviewController,
  showReviewController,
} from "../controllers/reviewController.js";
import {
  createPopupBannerController,
  deletePopupBannerController,
  getAdminPopupBannersController,
  togglePopupBannerController,
  updatePopupBannerController,
} from "../controllers/popupBannerController.js";
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

const popupBannerValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ max: 255 })
    .withMessage("title must be at most 255 characters"),
  body("image_url")
    .trim()
    .notEmpty()
    .withMessage("image_url is required")
    .isLength({ max: 2000 })
    .withMessage("image_url is too long"),
  body("link")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("link must be at most 500 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
  body("start_date")
    .notEmpty()
    .withMessage("start_date is required")
    .isISO8601()
    .withMessage("start_date must be a valid datetime"),
  body("end_date")
    .notEmpty()
    .withMessage("end_date is required")
    .isISO8601()
    .withMessage("end_date must be a valid datetime")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(value);

      if (startDate >= endDate) {
        throw new Error("start_date must be earlier than end_date");
      }

      return true;
    }),
  body("priority")
    .optional()
    .isInt()
    .withMessage("priority must be an integer"),
  body("target_type")
    .notEmpty()
    .withMessage("target_type is required")
    .isIn(["all", "guest", "logged_in"])
    .withMessage("target_type must be one of: all, guest, logged_in"),
];

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

router.post(
  "/schedules/:id/apply-sale",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  applySaleToScheduleController,
);

router.post(
  "/schedules/:id/remove-sale",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  removeSaleFromScheduleController,
);

router.patch(
  "/reviews/:id/hide",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  hideReviewController,
);

router.patch(
  "/reviews/:id/show",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  showReviewController,
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

router.get("/popup-banners", getAdminPopupBannersController);

router.post(
  "/popup-banners",
  popupBannerValidation,
  validationMiddleware,
  createPopupBannerController,
);

router.put(
  "/popup-banners/:id",
  [
    param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"),
    ...popupBannerValidation,
  ],
  validationMiddleware,
  updatePopupBannerController,
);

router.delete(
  "/popup-banners/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deletePopupBannerController,
);

router.patch(
  "/popup-banners/:id/toggle",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  togglePopupBannerController,
);

export default router;
