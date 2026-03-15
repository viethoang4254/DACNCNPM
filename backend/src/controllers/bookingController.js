import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createBookingRecord,
  deleteBookingById,
  expirePendingBookings,
  getAllBookings,
  getBookingById,
  getBookingsByUserId,
  updateBookingStatus,
} from "../models/bookingModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();

export const createBookingController = asyncHandler(async (req, res) => {
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);

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
      "SELECT id, tour_id, start_date, available_slots FROM tour_schedules WHERE id = ? LIMIT 1 FOR UPDATE",
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

    if (schedule.available_slots < quantity) {
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
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);
  const bookings = await getBookingsByUserId(req.user.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingsController = asyncHandler(async (req, res) => {
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);
  const bookings = await getAllBookings();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingByIdController = asyncHandler(async (req, res) => {
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);
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

  if (booking.trang_thai === "pending" && trang_thai === "confirmed") {
    const [updateResult] = await pool.execute(
      "UPDATE tour_schedules SET available_slots = available_slots - ? WHERE id = ? AND available_slots >= ?",
      [booking.so_nguoi, booking.schedule_id, booking.so_nguoi]
    );

    if (updateResult.affectedRows === 0) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Không đủ chỗ cho lịch khởi hành này",
        data: {},
      });
    }
  }

  if (booking.trang_thai === "confirmed" && trang_thai === "cancelled") {
    await pool.execute("UPDATE tour_schedules SET available_slots = available_slots + ? WHERE id = ?", [
      booking.so_nguoi,
      booking.schedule_id,
    ]);
  }

  await updateBookingStatus(id, trang_thai);

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

  if (booking.trang_thai === "confirmed") {
    await pool.execute("UPDATE tour_schedules SET available_slots = available_slots + ? WHERE id = ?", [
      booking.so_nguoi,
      booking.schedule_id,
    ]);
  }

  await deleteBookingById(id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking deleted successfully",
    data: {},
  });
});
