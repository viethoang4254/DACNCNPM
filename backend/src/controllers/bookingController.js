import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createBookingRecord,
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
import { cancelBooking } from "../services/bookingService.js";

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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[schedule]] = await connection.execute(
      `SELECT ts.id,
              ts.tour_id,
              ts.start_date,
              COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots
       FROM tour_schedules ts
       JOIN tours t ON t.id = ts.tour_id
       WHERE ts.id = ?
       LIMIT 1
       FOR UPDATE`,
      [schedule_id]
    );

    if (!schedule) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Schedule not found",
        data: {},
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const scheduleDate = String(schedule.start_date).slice(0, 10);

    if (scheduleDate < today) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Lịch khởi hành đã qua",
        data: {},
      });
    }

    const [[tour]] = await connection.execute("SELECT id, gia FROM tours WHERE id = ? LIMIT 1", [schedule.tour_id]);
    if (!tour) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Tour not found",
        data: {},
      });
    }

    const [[occupied]] = await connection.execute(
      "SELECT COALESCE(SUM(so_nguoi), 0) AS confirmed_booked FROM bookings WHERE schedule_id = ? AND trang_thai = 'confirmed'",
      [schedule_id]
    );

    const availableSlots = Math.max(
      Number(schedule.max_slots || 0) - Number(occupied?.confirmed_booked || 0),
      0,
    );

    if (availableSlots < quantity) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Không đủ chỗ cho lịch khởi hành này",
        data: {},
      });
    }

    const tong_tien = Number(tour.gia) * quantity;

    const bookingId = await createBookingRecord(
      {
        user_id: req.user.id,
        tour_id: schedule.tour_id,
        schedule_id,
        so_nguoi: quantity,
        tong_tien,
        trang_thai: "pending",
      },
      connection
    );

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(schedule_id);

    const createdBooking = await getBookingById(bookingId);

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Booking created successfully",
      data: {
        id: bookingId,
        booking: createdBooking,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
