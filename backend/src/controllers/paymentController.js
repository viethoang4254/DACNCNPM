import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  confirmPaymentService,
  createPaymentService,
  getPaymentByBookingIdService,
  getPaymentsService,
  rejectPaymentService,
  userConfirmPaymentService,
} from "../services/paymentService.js";

export const createPaymentController = asyncHandler(async (req, res) => {
  const result = await createPaymentService({
    booking_id: req.body.booking_id,
    method: req.body.method,
    amount: req.body.amount,
    status: req.body.status,
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

export const getPaymentByBookingIdController = asyncHandler(async (req, res) => {
  const result = await getPaymentByBookingIdService({
    bookingId: Number(req.params.bookingId),
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

export const getPaymentsController = asyncHandler(async (req, res) => {
  const result = await getPaymentsService();
  return sendResponse(res, result);
});

export const userConfirmPaymentController = asyncHandler(async (req, res) => {
  const result = await userConfirmPaymentService({
    paymentId: Number(req.params.id),
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

export const confirmPaymentController = asyncHandler(async (req, res) => {
  const result = await confirmPaymentService({ paymentId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const rejectPaymentController = asyncHandler(async (req, res) => {
  const result = await rejectPaymentService({ paymentId: Number(req.params.id) });
  return sendResponse(res, result);
});
