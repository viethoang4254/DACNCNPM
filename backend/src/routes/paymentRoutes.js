import express from "express";
import { body, param } from "express-validator";
import {
  confirmPaymentController,
  createPaymentController,
  getPaymentByBookingIdController,
  getPaymentsController,
  rejectPaymentController,
  userConfirmPaymentController,
} from "../controllers/paymentController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  [
    body("booking_id").isInt({ gt: 0 }).withMessage("booking_id must be a positive integer"),
    body("method").trim().notEmpty().withMessage("method is required"),
    body("status").optional().isIn(["pending", "paid", "failed"]).withMessage("status is invalid"),
  ],
  validationMiddleware,
  createPaymentController
);

router.get(
  "/booking/:bookingId",
  [param("bookingId").isInt({ gt: 0 }).withMessage("bookingId must be a positive integer")],
  validationMiddleware,
  getPaymentByBookingIdController
);

router.get("/", adminMiddleware, getPaymentsController);

router.put(
  "/:id/user-confirm",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  userConfirmPaymentController
);

router.put(
  "/:id/confirm",
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  confirmPaymentController
);

router.put(
  "/:id/reject",
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  rejectPaymentController
);

export default router;
