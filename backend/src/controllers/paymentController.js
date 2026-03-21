import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import { sendResponse } from "../utils/response.js";
import {
  getBookingById,
} from "../models/bookingModel.js";
import {
  createPayment,
  getAllPayments,
  getPaymentByBookingId,
  getPaymentById,
} from "../models/paymentModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";
import { expirePendingBookingsAndSyncSchedules } from "../services/bookingMaintenanceService.js";
import { refreshScheduleOccupancyAndStatusById } from "../services/scheduleStatusService.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();

export const createPaymentController = asyncHandler(async (req, res) => {
  const { booking_id, method, amount, status } = req.body;

  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

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
      message: "Booking đã được xác nhận trước đó",
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

  let payment = null;
  try {
    payment = await createPayment({
      booking_id,
      amount: Number(amount ?? booking.tong_tien),
      method,
      status: status || "pending",
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Payment already exists for this booking",
        data: {},
      });
    }
    throw error;
  }

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Đã tạo yêu cầu thanh toán, chờ xác nhận",
    data: payment,
  });
});

export const getPaymentByBookingIdController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
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
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const payments = await getAllPayments();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  });
});

export const userConfirmPaymentController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const paymentId = Number(req.params.id);

  const payment = await getPaymentById(paymentId);
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

  if (payment.status !== "pending") {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Yêu cầu thanh toán đã được xử lý",
      data: payment,
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Đã ghi nhận yêu cầu xác nhận chuyển khoản của bạn",
    data: payment,
  });
});

export const confirmPaymentController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const paymentId = Number(req.params.id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[payment]] = await connection.execute(
      `SELECT p.id, p.booking_id, p.status, p.amount, p.method,
              b.id AS booking_id_ref, b.schedule_id, b.so_nguoi, b.trang_thai
       FROM payments p
       INNER JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = ?
       LIMIT 1
       FOR UPDATE`,
      [paymentId]
    );

    if (!payment) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Payment not found",
        data: {},
      });
    }

    if (payment.status !== "pending") {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Payment đã được xử lý trước đó",
        data: {},
      });
    }

    if (payment.trang_thai === "cancelled") {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Booking đã bị hủy, không thể xác nhận thanh toán",
        data: {},
      });
    }

    await connection.execute("UPDATE payments SET status = 'paid' WHERE id = ?", [paymentId]);
    await connection.execute("UPDATE bookings SET trang_thai = 'confirmed' WHERE id = ?", [payment.booking_id]);

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(payment.schedule_id);

    const updated = await getPaymentById(paymentId);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Xác nhận thanh toán thành công",
      data: updated,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const rejectPaymentController = asyncHandler(async (req, res) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const paymentId = Number(req.params.id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[payment]] = await connection.execute(
      `SELECT p.id, p.booking_id, p.status,
              b.trang_thai, b.id AS booking_id_ref, b.schedule_id
       FROM payments p
       INNER JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = ?
       LIMIT 1
       FOR UPDATE`,
      [paymentId]
    );

    if (!payment) {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Payment not found",
        data: {},
      });
    }

    if (payment.status !== "pending") {
      await connection.rollback();
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Payment đã được xử lý trước đó",
        data: {},
      });
    }

    const now = new Date();

    await connection.execute("UPDATE payments SET status = 'failed' WHERE id = ?", [paymentId]);
    await connection.execute(
      `UPDATE bookings
       SET trang_thai = 'cancelled',
           cancelled_at = ?,
           cancel_reason = 'Thanh toán bị từ chối bởi admin',
           refund_amount = 0,
           refund_status = 'none',
           cancelled_by = 'admin'
       WHERE id = ?`,
      [now, payment.booking_id],
    );

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(payment.schedule_id);

    const updated = await getPaymentById(paymentId);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Đã từ chối thanh toán",
      data: updated,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
