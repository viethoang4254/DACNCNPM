import pool from "../config/db.js";
import {
  deleteBookingById,
  getAllBookings,
  getBookingById,
  getBookingsByUserId,
  getBookingForCancel,
  updateBookingStatus,
} from "../models/bookingModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";
import { refreshScheduleOccupancyAndStatusById } from "./scheduleStatusService.js";
import { expirePendingBookingsAndSyncSchedules } from "./bookingMaintenanceService.js";
import { getCancelPreview, validateCancel } from "./cancelBookingService.js";
import { cancelBooking, createBooking } from "./bookingService.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();

export const createBookingControllerService = async ({ userId, schedule_id, quantity: rawQuantity, so_nguoi }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

  const quantity = Number(rawQuantity ?? so_nguoi ?? 1);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      statusCode: 400,
      success: false,
      message: "Số lượng khách không hợp lệ",
      data: {},
    };
  }

  const result = await createBooking({
    userId: Number(userId),
    scheduleId: Number(schedule_id),
    quantity,
  });

  return {
    statusCode: Number(result.statusCode || (result.success ? 201 : 400)),
    success: Boolean(result.success),
    message: result.message || (result.success ? "Booking created successfully" : "Không thể tạo booking"),
    data: result.data || {},
  };
};

export const getMyBookingsControllerService = async ({ userId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const bookings = await getBookingsByUserId(userId);

  return {
    statusCode: 200,
    success: true,
    message: "My bookings fetched successfully",
    data: bookings,
  };
};

export const getBookingsControllerService = async () => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const bookings = await getAllBookings();

  return {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: bookings,
  };
};

export const getBookingByIdControllerService = async ({ id, actorRole, actorUserId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const booking = await getBookingById(id);
  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && booking.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Booking fetched successfully",
    data: booking,
  };
};

export const updateBookingStatusControllerService = async ({ id, trang_thai }) => {
  const booking = await getBookingById(id);
  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    };
  }

  if (booking.trang_thai === "cancelled" && trang_thai !== "cancelled") {
    return {
      statusCode: 400,
      success: false,
      message: "Cancelled booking cannot be reactivated",
      data: {},
    };
  }

  await updateBookingStatus(id, trang_thai);
  await refreshScheduleOccupancyAndStatusById(booking.schedule_id);

  return {
    statusCode: 200,
    success: true,
    message: "Booking status updated successfully",
    data: await getBookingById(id),
  };
};

export const deleteBookingControllerService = async ({ id, actorRole, actorUserId }) => {
  const booking = await getBookingById(id);

  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && booking.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  await deleteBookingById(id);
  await refreshScheduleOccupancyAndStatusById(booking.schedule_id);

  return {
    statusCode: 200,
    success: true,
    message: "Booking deleted successfully",
    data: {},
  };
};

export const cancelPreviewControllerService = async ({ bookingId, userId }) => {
  const booking = await getBookingForCancel(bookingId, userId);

  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      message: "Booking not found or not yours",
      data: {},
    };
  }

  const validation = await validateCancel(booking);
  if (!validation.valid) {
    return {
      statusCode: 400,
      success: false,
      message: validation.error,
      data: {},
    };
  }

  const preview = await getCancelPreview(booking);

  return {
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
  };
};

export const cancelBookingControllerService = async ({ bookingId, userId, cancelReason }) => {
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return {
      statusCode: 400,
      success: false,
      message: "booking_id is required",
      data: {},
    };
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
      return {
        statusCode: result.statusCode || 400,
        success: false,
        message: result.message || "Không thể hủy booking",
        data: result.data || {},
      };
    }

    await connection.commit();

    return {
      statusCode: result.statusCode || 200,
      success: true,
      message: result.message || "Booking cancelled successfully",
      data: result.data || {},
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
