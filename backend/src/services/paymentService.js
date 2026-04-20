import pool from "../config/db.js";
import { OrdersController } from "@paypal/paypal-server-sdk";
import { getBookingById } from "../models/bookingModel.js";
import {
  createPayment,
  getAllPayments,
  getPaymentByBookingId,
  getPaymentById,
} from "../models/paymentModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";
import client from "../utils/paypalClient.js";
import { expirePendingBookingsAndSyncSchedules } from "./bookingMaintenanceService.js";
import { refreshScheduleOccupancyAndStatusById } from "./scheduleStatusService.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();
const ordersController = new OrdersController(client);

function getPaypalErrorMessage(error, fallbackMessage) {
  const detail =
    error?.result?.details?.[0]?.description ||
    error?.result?.message ||
    error?.message;
  return detail || fallbackMessage;
}

function getPaypalErrorIssue(error) {
  return (
    error?.result?.details?.[0]?.issue ||
    error?.result?.name ||
    "PAYPAL_CAPTURE_FAILED"
  );
}

function getPaypalFailureResponse(error) {
  const issue = String(getPaypalErrorIssue(error) || "PAYPAL_CAPTURE_FAILED").toUpperCase();
  const message = getPaypalErrorMessage(error, "PayPal capture error");
  const debugId = error?.result?.debug_id || null;

  if (issue === "INSTRUMENT_DECLINED") {
    return {
      statusCode: 402,
      success: false,
      message,
      data: {
        code: issue,
        debugId,
      },
    };
  }

  if (issue === "PAYER_ACTION_REQUIRED") {
    return {
      statusCode: 409,
      success: false,
      message,
      data: {
        code: issue,
        debugId,
      },
    };
  }

  return {
    statusCode: 400,
    success: false,
    message,
    data: {
      code: issue,
      debugId,
    },
  };
}

export const createPaymentService = async ({ booking_id, method, amount, status, actorRole, actorUserId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

  const booking = await getBookingById(booking_id);
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

  if (booking.trang_thai === "cancelled") {
    return {
      statusCode: 400,
      success: false,
      message: "Booking đã hết hạn hoặc bị hủy",
      data: {},
    };
  }

  if (booking.trang_thai === "confirmed") {
    return {
      statusCode: 409,
      success: false,
      message: "Booking đã được xác nhận trước đó",
      data: {},
    };
  }

  const existing = await getPaymentByBookingId(booking_id);
  if (existing) {
    return {
      statusCode: 409,
      success: false,
      message: "Payment already exists for this booking",
      data: existing,
    };
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
      return {
        statusCode: 409,
        success: false,
        message: "Payment already exists for this booking",
        data: {},
      };
    }
    throw error;
  }

  return {
    statusCode: 201,
    success: true,
    message: "Đã tạo yêu cầu thanh toán, chờ xác nhận",
    data: payment,
  };
};

export const getPaymentByBookingIdService = async ({ bookingId, actorRole, actorUserId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const payment = await getPaymentByBookingId(bookingId);

  if (!payment) {
    return {
      statusCode: 200,
      success: true,
      message: "Payment chưa được tạo cho booking này",
      data: null,
    };
  }

  if (actorRole !== "admin" && payment.user_id !== actorUserId) {
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
    message: "Payment fetched successfully",
    data: payment,
  };
};

export const getPaymentsService = async () => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
  const payments = await getAllPayments();

  return {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  };
};

export const userConfirmPaymentService = async ({ paymentId, actorRole, actorUserId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    return {
      statusCode: 404,
      success: false,
      message: "Payment not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && payment.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  if (payment.status !== "pending") {
    return {
      statusCode: 409,
      success: false,
      message: "Yêu cầu thanh toán đã được xử lý",
      data: payment,
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Đã ghi nhận yêu cầu xác nhận chuyển khoản của bạn",
    data: payment,
  };
};

export const confirmPaymentService = async ({ paymentId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
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
      return {
        statusCode: 404,
        success: false,
        message: "Payment not found",
        data: {},
      };
    }

    if (payment.status !== "pending") {
      await connection.rollback();
      return {
        statusCode: 409,
        success: false,
        message: "Payment đã được xử lý trước đó",
        data: {},
      };
    }

    if (payment.trang_thai === "cancelled") {
      await connection.rollback();
      return {
        statusCode: 400,
        success: false,
        message: "Booking đã bị hủy, không thể xác nhận thanh toán",
        data: {},
      };
    }

    await connection.execute("UPDATE payments SET status = 'paid' WHERE id = ?", [paymentId]);
    await connection.execute("UPDATE bookings SET trang_thai = 'confirmed' WHERE id = ?", [payment.booking_id]);

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(payment.schedule_id);

    const updated = await getPaymentById(paymentId);
    return {
      statusCode: 200,
      success: true,
      message: "Xác nhận thanh toán thành công",
      data: updated,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const rejectPaymentService = async ({ paymentId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);
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
      return {
        statusCode: 404,
        success: false,
        message: "Payment not found",
        data: {},
      };
    }

    if (payment.status !== "pending") {
      await connection.rollback();
      return {
        statusCode: 409,
        success: false,
        message: "Payment đã được xử lý trước đó",
        data: {},
      };
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
      [now, payment.booking_id]
    );

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(payment.schedule_id);

    const updated = await getPaymentById(paymentId);
    return {
      statusCode: 200,
      success: true,
      message: "Đã từ chối thanh toán",
      data: updated,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const capturePaypalPaymentService = async ({ bookingId, token, payerId }) => {
  await expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES);

  const normalizedBookingId = Number(bookingId);
  if (!Number.isInteger(normalizedBookingId) || normalizedBookingId <= 0) {
    return {
      statusCode: 400,
      success: false,
      message: "bookingId không hợp lệ",
      data: {},
    };
  }

  if (!token || typeof token !== "string") {
    return {
      statusCode: 400,
      success: false,
      message: "token không hợp lệ",
      data: {},
    };
  }

  if (!payerId || typeof payerId !== "string") {
    return {
      statusCode: 400,
      success: false,
      message: "payerId không hợp lệ",
      data: {},
    };
  }

  const booking = await getBookingById(normalizedBookingId);
  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    };
  }

  if (booking.trang_thai === "cancelled") {
    return {
      statusCode: 400,
      success: false,
      message: "Booking đã hết hạn hoặc bị hủy",
      data: {},
    };
  }

  const existingPayment = await getPaymentByBookingId(normalizedBookingId);
  // Idempotent callback handling: if this booking is already paid, return success.
  if (existingPayment?.status === "paid") {
    return {
      statusCode: 200,
      success: true,
      message: "Thanh toán đã được xác nhận trước đó",
      data: {
        payment: existingPayment,
        paypal: {},
      },
    };
  }

  let captureResult;
  try {
    const response = await ordersController.captureOrder({
      id: token,
    });
    captureResult = response?.result || response;
  } catch (error) {
    return getPaypalFailureResponse(error);
  }

  const captureStatus = String(captureResult?.status || "").toUpperCase();
  if (captureStatus !== "COMPLETED") {
    return {
      statusCode: 400,
      success: false,
      message: "Giao dịch PayPal chưa hoàn tất",
      data: {
        paypalStatus: captureResult?.status || null,
      },
    };
  }

  const referenceId = Number(captureResult?.purchaseUnits?.[0]?.referenceId || 0);
  if (referenceId && referenceId !== normalizedBookingId) {
    return {
      statusCode: 400,
      success: false,
      message: "bookingId không khớp với đơn PayPal",
      data: {},
    };
  }

  const paypalPayerId =
    captureResult?.payer?.payerId ||
    captureResult?.payer?.payer_id ||
    "";
  if (paypalPayerId && String(paypalPayerId).toUpperCase() !== String(payerId).toUpperCase()) {
    return {
      statusCode: 400,
      success: false,
      message: "PayerID không khớp với giao dịch PayPal",
      data: {},
    };
  }

  const capturedAmountRaw =
    captureResult?.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value;
  const capturedAmount = Number(capturedAmountRaw);
  // Store internal payment amount in VND to keep consistency with booking totals.
  const paymentAmount = Number(booking.tong_tien || 0);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[lockedBooking]] = await connection.execute(
      `SELECT id, schedule_id, trang_thai
       FROM bookings
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [normalizedBookingId]
    );

    if (!lockedBooking) {
      await connection.rollback();
      return {
        statusCode: 404,
        success: false,
        message: "Booking not found",
        data: {},
      };
    }

    if (lockedBooking.trang_thai === "cancelled") {
      await connection.rollback();
      return {
        statusCode: 400,
        success: false,
        message: "Booking đã hết hạn hoặc bị hủy",
        data: {},
      };
    }

    const [paymentRows] = await connection.execute(
      `SELECT id, status
       FROM payments
       WHERE booking_id = ?
       LIMIT 1
       FOR UPDATE`,
      [normalizedBookingId]
    );

    if (!paymentRows.length) {
      await connection.execute(
        `INSERT INTO payments (booking_id, amount, method, status)
         VALUES (?, ?, 'paypal', 'paid')`,
        [normalizedBookingId, paymentAmount]
      );
    } else {
      await connection.execute(
        `UPDATE payments
         SET status = 'paid',
             method = 'paypal',
             amount = ?
         WHERE booking_id = ?`,
        [paymentAmount, normalizedBookingId]
      );
    }

    await connection.execute(
      `UPDATE bookings
       SET trang_thai = 'confirmed'
       WHERE id = ?`,
      [normalizedBookingId]
    );

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(lockedBooking.schedule_id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const updatedPayment = await getPaymentByBookingId(normalizedBookingId);

  return {
    statusCode: 200,
    success: true,
    message: "Capture thanh toán PayPal thành công",
    data: {
      payment: updatedPayment,
      paypal: {
        orderId: captureResult?.id || token,
        status: captureResult?.status || "COMPLETED",
        capturedAmountUsd: Number.isFinite(capturedAmount) ? capturedAmount : null,
      },
    },
  };
};
