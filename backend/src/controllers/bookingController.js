import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createBookingRecord,
  deleteBookingById,
  getAllBookings,
  getBookingById,
  getBookingsByUserId,
  updateBookingStatus,
} from "../models/bookingModel.js";

export const createBookingController = asyncHandler(async (req, res) => {
  const { tour_id, schedule_id, so_nguoi } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[tour]] = await connection.execute("SELECT id, gia FROM tours WHERE id = ? LIMIT 1", [tour_id]);
    if (!tour) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Tour not found",
        data: {},
      });
    }

    const [[schedule]] = await connection.execute(
      "SELECT id, tour_id, available_slots FROM tour_schedules WHERE id = ? AND tour_id = ? LIMIT 1 FOR UPDATE",
      [schedule_id, tour_id]
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

    if (schedule.available_slots < so_nguoi) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Not enough available slots",
        data: {},
      });
    }

    const tong_tien = Number(tour.gia) * Number(so_nguoi);

    const bookingId = await createBookingRecord(
      {
        user_id: req.user.id,
        tour_id,
        schedule_id,
        so_nguoi,
        tong_tien,
        trang_thai: "pending",
      },
      connection
    );

    await connection.execute("UPDATE tour_schedules SET available_slots = available_slots - ? WHERE id = ?", [
      so_nguoi,
      schedule_id,
    ]);

    await connection.commit();

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Booking created successfully",
      data: await getBookingById(bookingId),
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const getMyBookingsController = asyncHandler(async (req, res) => {
  const bookings = await getBookingsByUserId(req.user.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingsController = asyncHandler(async (req, res) => {
  const bookings = await getAllBookings();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: bookings,
  });
});

export const getBookingByIdController = asyncHandler(async (req, res) => {
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

  if (booking.trang_thai !== "cancelled" && trang_thai === "cancelled") {
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

  if (booking.trang_thai !== "cancelled") {
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
