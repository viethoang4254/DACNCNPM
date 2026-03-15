import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import { sendResponse } from "../utils/response.js";
import {
  expirePendingBookingById,
  expirePendingBookings,
  getBookingById,
} from "../models/bookingModel.js";
import { createPayment, getAllPayments, getPaymentByBookingId } from "../models/paymentModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();

export const createPaymentController = asyncHandler(async (req, res) => {
  const { booking_id, method, amount, status } = req.body;

  await expirePendingBookings(PENDING_EXPIRE_MINUTES);

  const booking = await getBookingById(booking_id);
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

  if (booking.trang_thai === "cancelled") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Booking đã hết hạn hoặc bị hủy",
      data: {},
    });
  }

  if (booking.trang_thai === "confirmed") {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Booking đã được xác nhận",
      data: {},
    });
  }

  const existing = await getPaymentByBookingId(booking_id);
  if (existing) {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Payment already exists for this booking",
      data: existing,
    });
  }

  const connection = await pool.getConnection();
  let payment = null;

  try {
    await connection.beginTransaction();

    const [[lockedBooking]] = await connection.execute(
      "SELECT id, schedule_id, so_nguoi, trang_thai FROM bookings WHERE id = ? LIMIT 1 FOR UPDATE",
      [booking_id]
    );

    if (!lockedBooking) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Booking not found",
        data: {},
      });
    }

    const expiredById = await expirePendingBookingById(
      booking_id,
      PENDING_EXPIRE_MINUTES,
      connection
    );

    if (expiredById > 0) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Booking đã hết hạn thanh toán",
        data: {},
      });
    }

    if (lockedBooking.trang_thai === "cancelled") {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Booking đã bị hủy, không thể thanh toán",
        data: {},
      });
    }

    if (lockedBooking.trang_thai === "confirmed") {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Booking đã được xác nhận",
        data: {},
      });
    }

    const [[lockedSchedule]] = await connection.execute(
      "SELECT id, available_slots FROM tour_schedules WHERE id = ? LIMIT 1 FOR UPDATE",
      [lockedBooking.schedule_id]
    );

    if (!lockedSchedule) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Schedule not found",
        data: {},
      });
    }

    if (Number(lockedSchedule.available_slots) < Number(lockedBooking.so_nguoi)) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Không đủ chỗ cho lịch khởi hành này",
        data: {},
      });
    }

    const [paymentInsertResult] = await connection.execute(
      "INSERT INTO payments (booking_id, amount, method, status) VALUES (?, ?, ?, ?)",
      [booking_id, Number(amount ?? booking.tong_tien), method, status || "pending"]
    );

    await connection.execute(
      "UPDATE tour_schedules SET available_slots = available_slots - ? WHERE id = ?",
      [lockedBooking.so_nguoi, lockedBooking.schedule_id]
    );

    await connection.execute("UPDATE bookings SET trang_thai = 'confirmed' WHERE id = ?", [booking_id]);

    await connection.commit();

    const [paymentRows] = await pool.execute(
      `SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at,
              b.user_id, b.tour_id, b.trang_thai AS booking_status
       FROM payments p
       INNER JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = ?
       LIMIT 1`,
      [paymentInsertResult.insertId]
    );
    payment = paymentRows[0] || null;
  } catch (error) {
    await connection.rollback();

    if (error?.code === "ER_DUP_ENTRY") {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Payment already exists for this booking",
        data: {},
      });
    }

    throw error;
  } finally {
    connection.release();
  }

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment created successfully",
    data: payment,
  });
});

export const getPaymentByBookingIdController = asyncHandler(async (req, res) => {
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);
  const bookingId = Number(req.params.bookingId);
  const payment = await getPaymentByBookingId(bookingId);

  if (!payment) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Payment not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && payment.user_id !== req.user.id) {
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
    message: "Payment fetched successfully",
    data: payment,
  });
});

export const getPaymentsController = asyncHandler(async (req, res) => {
  await expirePendingBookings(PENDING_EXPIRE_MINUTES);
  const payments = await getAllPayments();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  });
});
