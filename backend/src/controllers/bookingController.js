import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  cancelBookingControllerService,
  cancelPreviewControllerService,
  createBookingControllerService,
  deleteBookingControllerService,
  getBookingByIdControllerService,
  getBookingsControllerService,
  getMyBookingsControllerService,
  updateBookingStatusControllerService,
} from "../services/bookingControllerService.js";

export const createBookingController = asyncHandler(async (req, res) => {
  const result = await createBookingControllerService({
    userId: req.user.id,
    schedule_id: req.body.schedule_id,
    quantity: req.body.quantity,
    so_nguoi: req.body.so_nguoi,
  });
  return sendResponse(res, result);
});

export const getMyBookingsController = asyncHandler(async (req, res) => {
  const result = await getMyBookingsControllerService({ userId: req.user.id });
  return sendResponse(res, result);
});

export const getBookingsController = asyncHandler(async (req, res) => {
  const result = await getBookingsControllerService();
  return sendResponse(res, result);
});

export const getBookingByIdController = asyncHandler(async (req, res) => {
  const result = await getBookingByIdControllerService({
    id: Number(req.params.id),
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

export const updateBookingStatusController = asyncHandler(async (req, res) => {
  const result = await updateBookingStatusControllerService({
    id: Number(req.params.id),
    trang_thai: req.body.trang_thai,
  });
  return sendResponse(res, result);
});

export const deleteBookingController = asyncHandler(async (req, res) => {
  const result = await deleteBookingControllerService({
    id: Number(req.params.id),
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

/**
 * GET /api/bookings/:id/cancel-preview
 * Preview refund amount before cancelling
 */
export const cancelPreviewController = asyncHandler(async (req, res) => {
  const result = await cancelPreviewControllerService({
    bookingId: Number(req.params.id),
    userId: req.user.id,
  });
  return sendResponse(res, result);
});

/**
 * POST /api/bookings/:id/cancel
 * Execute booking cancellation with auto-refund calculation
 */
export const cancelBookingController = asyncHandler(async (req, res) => {
  const result = await cancelBookingControllerService({
    bookingId: Number(req.params.id ?? req.body.booking_id),
    userId: req.user.id,
    cancelReason: String(req.body?.cancel_reason || "").trim(),
  });
  return sendResponse(res, result);
});
