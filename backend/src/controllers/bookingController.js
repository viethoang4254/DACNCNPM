import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  deleteBookingById,
  getAllBookings,
  getBookingById,
  getBookingsByUserId,
  getBookingForCancel,
  updateBookingStatus,
} from "../models/bookingModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";
import { refreshScheduleOccupancyAndStatusById } from "../services/scheduleStatusService.js";
import { expirePendingBookingsAndSyncSchedules } from "../services/bookingMaintenanceService.js";
import { getCancelPreview, validateCancel } from "../services/cancelBookingService.js";
import { cancelBooking, createBooking } from "../services/bookingService.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();

export const createBookingController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

  const { schedule_id } = req.body;
  const quantity = Number(req.body.quantity ?? req.body.so_nguoi ?? 1);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Số lượng khách không hợp lệ",
      data: {},
    });
  }

  const result = await createBooking({
    userId: Number(req.user.id),
    scheduleId: Number(schedule_id),
    quantity,
  });

  return sendResponse(res, {
    statusCode: Number(result.statusCode || (result.success ? 201 : 400)),
    success: Boolean(result.success),
    message: result.message || (result.success ? "Booking created successfully" : "Không thể tạo booking"),
    data: result.data || {},
  });
});

export const getMyBookingsController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const bookings = await getBookingsByUserId(req.user.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingsController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const bookings = await getAllBookings();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingByIdController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const booking = await getBookingById(Number(req.params.id));
  if (!booking) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking fetched successfully",
    data: booking,
  });
});

export const updateBookingStatusController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { trang_thai } = req.body;

  const booking = await getBookingById(id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    });
  }

  if (booking.trang_thai === "cancelled" && trang_thai !== "cancelled") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Cancelled booking cannot be reactivated",
      data: {},
    });
  }

  await updateBookingStatus(id, trang_thai);
  await refreshScheduleOccupancyAndStatusById(booking.schedule_id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking status updated successfully",
    data: await getBookingById(id),
  });
});

export const deleteBookingController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const booking = await getBookingById(id);

  if (!booking) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  await deleteBookingById(id);
  await refreshScheduleOccupancyAndStatusById(booking.schedule_id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking deleted successfully",
    data: {},
  });
});

/**
 * GET /api/bookings/:id/cancel-preview
 * Preview refund amount before cancelling
 */
export const cancelPreviewController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  const userId = req.user.id;

  const booking = await getBookingForCancel(bookingId, userId);

  if (!booking) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Booking not found or not yours",
      data: {},
    });
  }

  // Validate if can cancel
  const validation = await validateCancel(booking);
  if (!validation.valid) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: validation.error,
      data: {},
    });
  }

  // Get cancel preview
  const preview = await getCancelPreview(booking);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cancel preview retrieved successfully",
    data: {
      bookingId: booking.id,
      tourName: booking.ten_tour,
      startDate: booking.start_date,
      originalAmount: booking.tong_tien,
      ...preview,
    },
  });
});

/**
 * POST /api/bookings/:id/cancel
 * Execute booking cancellation with auto-refund calculation
 */
export const cancelBookingController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id ?? req.body.booking_id);
  const userId = req.user.id;
  const cancelReason = String(req.body?.cancel_reason || "").trim();

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "booking_id is required",
      data: {},
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const result = await cancelBooking({
      bookingId,
      userId,
      cancelReason,
      connection,
    });

    if (!result.success) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: result.statusCode || 400,
        success: false,
        message: result.message || "Không thể hủy booking",
        data: result.data || {},
      });
    }

    await connection.commit();

    return sendResponse(res, {
      statusCode: result.statusCode || 200,
      success: true,
      message: result.message || "Booking cancelled successfully",
      data: result.data || {},
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
