import express from "express";
import { body, param } from "express-validator";
import {
  createBookingController,
  deleteBookingController,
  getBookingByIdController,
  getBookingsController,
  getMyBookingsController,
  updateBookingStatusController,
} from "../controllers/bookingController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  [
    body("schedule_id").isInt({ gt: 0 }).withMessage("schedule_id must be a positive integer"),
    body("quantity")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("quantity must be a positive integer"),
    body("so_nguoi")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("so_nguoi must be a positive integer"),
    body()
      .custom((_, { req }) => {
        if (req.body.quantity !== undefined || req.body.so_nguoi !== undefined) {
          return true;
        }
        throw new Error("quantity is required");
      })
      .withMessage("quantity is required"),
  ],
  validationMiddleware,
  createBookingController
);

router.get("/my", getMyBookingsController);

router.get("/", adminMiddleware, getBookingsController);

router.patch(
  "/:id/status",
  adminMiddleware,
  [
    param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"),
    body("trang_thai")
      .isIn(["pending", "confirmed", "cancelled"])
      .withMessage("trang_thai must be pending, confirmed or cancelled"),
  ],
  validationMiddleware,
  updateBookingStatusController
);

router.get(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getBookingByIdController
);

router.delete(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteBookingController
);

export default router;
