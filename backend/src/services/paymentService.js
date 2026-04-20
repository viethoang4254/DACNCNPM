import pool from "../config/db.js";
import { OrdersController } from "@paypal/paypal-server-sdk";
import paypalClient from "../utils/paypalClient.js";
import { getBookingById } from "../models/bookingModel.js";
import {
  createPayment,
  getAllPayments,
  getPaymentByBookingId,
  getPaymentById,
} from "../models/paymentModel.js";
import { getPendingExpireMinutes } from "../utils/bookingExpiration.js";
import { expirePendingBookingsAndSyncSchedules } from "./bookingMaintenanceService.js";
import { refreshScheduleOccupancyAndStatusById } from "./scheduleStatusService.js";

const PENDING_EXPIRE_MINUTES = getPendingExpireMinutes();
const PAYPAL_CAPTURE_TIMEOUT_MS = Number(process.env.PAYPAL_CAPTURE_TIMEOUT_MS || 15000);

const ordersController = new OrdersController(paypalClient);

function getPaypalErrorMessage(error, fallbackMessage) {
  const issue = error?.result?.details?.[0]?.issue;
  const description = error?.result?.details?.[0]?.description;
  const message = error?.result?.message || error?.message;
  const debugId = error?.result?.debug_id;

  const composed = [
    issue,
    description,
    message,
    debugId ? `debug_id: ${debugId}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return composed || fallbackMessage;
}

function extractPaypalError(error) {
  const result = error?.result || {};
  const details = Array.isArray(result?.details) ? result.details : [];
  return {
    name: result?.name || error?.name || null,
    message: result?.message || error?.message || null,
    debugId: result?.debug_id || null,
    details,
  };
}

function isCaptureCompleted(result) {
  const status = String(result?.status || "").toUpperCase();
  return status === "COMPLETED";
}

function withTimeout(promise, timeoutMs) {
  const resolvedTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("PayPal capture timeout"));
    }, resolvedTimeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchPaypalOrder(token) {
  const response = await withTimeout(
    ordersController.getOrder({
      id: token,
    }),
    PAYPAL_CAPTURE_TIMEOUT_MS,
  );
  return response?.result || response;
}

export const capturePaypalPaymentService = async ({
  bookingId,
  token,
  payerId,
  actorRole,
  actorUserId,
}) => {
  // Don't block the PayPal callback on maintenance work.
  expirePendingBookingsAndSyncSchedules(PENDING_EXPIRE_MINUTES).catch((error) => {
    console.error("[booking-cleanup] Failed:", error?.message || error);
  });

  const booking = await getBookingById(bookingId);
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
      message: "Booking đã bị hủy, không thể capture PayPal",
      data: {},
    };
  }

  // If already confirmed, treat as idempotent success.
  if (booking.trang_thai === "confirmed") {
    const payment = await getPaymentByBookingId(bookingId);
    return {
      statusCode: 200,
      success: true,
      message: "Booking đã được xác nhận trước đó",
      data: { booking, payment },
    };
  }

  // Step 1: Capture PayPal order (token is the orderId in PayPal Orders API).
  let captured = null;
  try {
    const response = await withTimeout(
      ordersController.captureOrder({
        id: token,
      }),
      PAYPAL_CAPTURE_TIMEOUT_MS,
    );
    captured = response?.result || response;
  } catch (error) {
    if (String(error?.message || "") === "PayPal capture timeout") {
      return {
        statusCode: 504,
        success: false,
        message: "PayPal phản hồi quá chậm. Vui lòng thử lại.",
        data: {},
      };
    }

    const statusCode = Number(error?.statusCode || error?.statusCodeNumber || 502);

    // PayPal may return 422 for orders that were already captured (idempotency),
    // or other business validation failures. If already COMPLETED, treat as success.
    if (statusCode === 422) {
      try {
        const order = await fetchPaypalOrder(token);
        if (isCaptureCompleted(order)) {
          captured = order;
        } else {
          return {
            statusCode,
            success: false,
            message: getPaypalErrorMessage(error, "PayPal capture error"),
            data: {
              paypalStatus: order?.status || null,
              paypalError: extractPaypalError(error),
            },
          };
        }
      } catch (getOrderError) {
        const resolvedGetOrderCode = Number(
          getOrderError?.statusCode || getOrderError?.statusCodeNumber || statusCode,
        );
        return {
          statusCode: Number.isInteger(resolvedGetOrderCode) ? resolvedGetOrderCode : statusCode,
          success: false,
          message: getPaypalErrorMessage(error, "PayPal capture error"),
          data: {
            paypalError: extractPaypalError(error),
          },
        };
      }
    } else {
      return {
        statusCode: Number.isInteger(statusCode) ? statusCode : 502,
        success: false,
        message: getPaypalErrorMessage(error, "PayPal capture error"),
        data: {
          paypalError: extractPaypalError(error),
        },
      };
    }
  }

  if (!isCaptureCompleted(captured)) {
    return {
      statusCode: 400,
      success: false,
      message: "PayPal capture chưa hoàn tất",
      data: {
        paypalStatus: captured?.status || null,
      },
    };
  }

  // Step 2: Persist payment result & confirm booking.
  // Note: payerId is included for API compatibility with the frontend callback,
  // PayPal Orders capture does not need it here.
  void payerId;

  const connection = await pool.getConnection();
  let scheduleId = Number(booking.schedule_id || 0);

  try {
    await connection.beginTransaction();

    const [[lockedBooking]] = await connection.execute(
      `SELECT id, user_id, schedule_id, tong_tien, trang_thai
       FROM bookings
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [bookingId],
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

    scheduleId = Number(lockedBooking.schedule_id || scheduleId || 0);

    if (actorRole !== "admin" && lockedBooking.user_id !== actorUserId) {
      await connection.rollback();
      return {
        statusCode: 403,
        success: false,
        message: "Forbidden",
        data: {},
      };
    }

    if (lockedBooking.trang_thai === "cancelled") {
      await connection.rollback();
      return {
        statusCode: 400,
        success: false,
        message: "Booking đã bị hủy, không thể xác nhận thanh toán",
        data: {},
      };
    }

    const [[lockedPayment]] = await connection.execute(
      `SELECT id, status
       FROM payments
       WHERE booking_id = ?
       LIMIT 1
       FOR UPDATE`,
      [bookingId],
    );

    if (lockedPayment?.id) {
      if (lockedPayment.status !== "paid") {
        await connection.execute(
          "UPDATE payments SET status = 'paid', method = 'paypal' WHERE id = ?",
          [lockedPayment.id],
        );
      }
    } else {
      try {
        await connection.execute(
          "INSERT INTO payments (booking_id, amount, method, status) VALUES (?, ?, 'paypal', 'paid')",
          [bookingId, Number(lockedBooking.tong_tien || 0)],
        );
      } catch (error) {
        // Handle potential race with unique key uq_payments_booking_id.
        if (error?.code !== "ER_DUP_ENTRY") {
          throw error;
        }

        await connection.execute(
          "UPDATE payments SET status = 'paid', method = 'paypal' WHERE booking_id = ?",
          [bookingId],
        );
      }
    }

    await connection.execute(
      "UPDATE bookings SET trang_thai = 'confirmed' WHERE id = ?",
      [bookingId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (scheduleId > 0) {
    refreshScheduleOccupancyAndStatusById(scheduleId).catch((error) => {
      console.error("[schedule-sync] Failed:", error?.message || error);
    });
  }

  const payment = await getPaymentByBookingId(bookingId);
  const updatedBooking = await getBookingById(bookingId);

  return {
    statusCode: 200,
    success: true,
    message: "PayPal capture thành công",
    data: {
      booking: updatedBooking,
      payment,
      paypal: {
        id: captured?.id || null,
        status: captured?.status || null,
      },
    },
  };
};

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
