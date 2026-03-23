import pool from "../config/db.js";
import { createNotification } from "../models/notificationModel.js";
import { createBookingRecord, getBookingById } from "../models/bookingModel.js";
import { calculateRefundPercentage, validateCancel } from "./cancelBookingService.js";
import {
  getScheduleDaysLeft,
  refreshScheduleOccupancyAndStatusById,
} from "./scheduleStatusService.js";

export const createBooking = async ({ userId, scheduleId, quantity }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[schedule]] = await connection.execute(
      `SELECT ts.id,
              ts.tour_id,
              ts.start_date,
              ts.status,
              ts.min_required_ratio,
              COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
              ts.booked_slots,
              ts.available_slots
       FROM tour_schedules ts
       JOIN tours t ON t.id = ts.tour_id
       WHERE ts.id = ?
       LIMIT 1
       FOR UPDATE`,
      [scheduleId],
    );

    if (!schedule) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found",
        data: {},
      };
    }

    const scheduleStatus = String(schedule.status || "").toLowerCase();
    if (["cancelled", "canceled", "completed"].includes(scheduleStatus)) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "Lịch khởi hành này hiện không thể đặt. Vui lòng chọn lịch khác.",
        data: {},
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const scheduleDate = String(schedule.start_date).slice(0, 10);

    if (scheduleDate < today) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Lịch khởi hành đã qua",
        data: {},
      };
    }

    const [[existingActiveBooking]] = await connection.execute(
      `SELECT id, trang_thai
       FROM bookings
       WHERE user_id = ?
         AND schedule_id = ?
         AND trang_thai IN ('pending', 'confirmed')
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [userId, scheduleId],
    );

    if (existingActiveBooking) {
      const existingStatus = String(existingActiveBooking.trang_thai || "").toLowerCase();

      if (existingStatus === "pending") {
        await connection.rollback();

        const reusedBooking = await getBookingById(existingActiveBooking.id);
        return {
          success: true,
          statusCode: 200,
          message: "Bạn đã có đơn chờ thanh toán cho lịch này. Tiếp tục thanh toán.",
          data: {
            id: existingActiveBooking.id,
            booking: reusedBooking,
            reused: true,
          },
        };
      }

      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "Bạn đã đặt tour này rồi",
        data: {},
      };
    }

    const [[tour]] = await connection.execute(
      "SELECT id, gia FROM tours WHERE id = ? LIMIT 1",
      [schedule.tour_id],
    );

    if (!tour) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Tour not found",
        data: {},
      };
    }

    const availableSlots = Number(schedule.available_slots || 0);

    if (availableSlots < quantity) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Không đủ chỗ cho lịch khởi hành này",
        data: {},
      };
    }

    const maxSlots = Number(schedule.max_slots || 0);
    const bookedSlots = Number(schedule.booked_slots || 0);
    const minRequiredRatio = Number(schedule.min_required_ratio ?? 0.5);
    const daysLeft = getScheduleDaysLeft(schedule.start_date);
    const projectedBookedSlots = Math.min(maxSlots, bookedSlots + quantity);
    const projectedFillRatio = maxSlots > 0 ? projectedBookedSlots / maxSlots : 0;

    if (
      daysLeft !== null &&
      daysLeft <= 2 &&
      projectedFillRatio < minRequiredRatio
    ) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message:
          "Lịch khởi hành này chưa đủ số lượng khách tối thiểu và sắp bị hủy. Vui lòng chọn lịch khác.",
        data: {},
      };
    }

    const [slotUpdateResult] = await connection.execute(
      `UPDATE tour_schedules
       SET booked_slots = LEAST(max_slots, booked_slots + ?),
           available_slots = GREATEST(available_slots - ?, 0)
       WHERE id = ?
         AND available_slots >= ?`,
      [quantity, quantity, scheduleId, quantity],
    );

    if (Number(slotUpdateResult?.affectedRows || 0) === 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Không đủ chỗ cho lịch khởi hành này",
        data: {},
      };
    }

    const tongTien = Number(tour.gia || 0) * Number(quantity || 0);

    const bookingId = await createBookingRecord(
      {
        user_id: userId,
        tour_id: schedule.tour_id,
        schedule_id: scheduleId,
        so_nguoi: quantity,
        tong_tien: tongTien,
        trang_thai: "pending",
      },
      connection,
    );

    await connection.commit();

    await refreshScheduleOccupancyAndStatusById(scheduleId);
    const createdBooking = await getBookingById(bookingId);

    return {
      success: true,
      statusCode: 201,
      message: "Booking created successfully",
      data: {
        id: bookingId,
        booking: createdBooking,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const cancelBooking = async ({ bookingId, userId, cancelReason, connection }) => {
  const [[booking]] = await connection.execute(
    `SELECT b.id, b.user_id, b.schedule_id, b.tour_id, b.so_nguoi, b.tong_tien,
         b.trang_thai, b.cancelled_at, s.start_date, s.status AS schedule_status,
         s.max_slots, s.booked_slots, s.available_slots,
         t.ten_tour
     FROM bookings b
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
       INNER JOIN tours t ON t.id = b.tour_id
     WHERE b.id = ? AND b.user_id = ?
     FOR UPDATE`,
    [bookingId, userId],
  );

  if (!booking) {
    return {
      success: false,
      statusCode: 404,
      message: "Booking not found or not yours",
      data: {},
    };
  }

  const validation = await validateCancel(booking);
  if (!validation.valid) {
    return {
      success: false,
      statusCode: 400,
      message: validation.error,
      data: {},
    };
  }

  const scheduleStatus = String(booking.schedule_status || "").toLowerCase();
  const isSystemCancelledSchedule =
    scheduleStatus === "cancelled" || scheduleStatus === "canceled";

  // Always determine payment state from payments table before refund handling.
  const [[payment]] = await connection.execute(
    `SELECT id, booking_id, method, status
     FROM payments
     WHERE booking_id = ?
     LIMIT 1
     FOR UPDATE`,
    [bookingId],
  );

  const paymentStatus = String(payment?.status || "").toLowerCase();
  const paymentMethod = String(payment?.method || "").toLowerCase();
  const normalizedPaymentMethod = paymentMethod.replace(/[\s-]+/g, "_");
  const isCodMethod = ["pay_later", "cod", "pay_at_place", "cash", "cash_on_delivery"].includes(
    normalizedPaymentMethod,
  );
  const isPaid = paymentStatus === "paid";
  const isPendingCod = paymentStatus === "pending" && isCodMethod;

  // Do not run refund flow when payment is not paid.
  const canRefund = isPaid && !isCodMethod;
  const daysLeft = canRefund ? getScheduleDaysLeft(booking.start_date) : null;
  const refundPercentage = canRefund
    ? (isSystemCancelledSchedule ? 100 : calculateRefundPercentage(daysLeft))
    : 0;
  const refundStatus = canRefund && refundPercentage > 0 ? "pending" : "none";
  const now = new Date();

  const [bookingResult] = await connection.execute(
    `UPDATE bookings
     SET trang_thai = 'cancelled',
         cancelled_at = ?,
         cancel_reason = ?,
         refund_amount = 0,
         refund_status = ?,
         cancelled_by = 'user'
     WHERE id = ? AND user_id = ?`,
    [now, cancelReason || null, refundStatus, bookingId, userId],
  );

  if (bookingResult.affectedRows === 0) {
    return {
      success: false,
      statusCode: 400,
      message: "Failed to update booking",
      data: {},
    };
  }

  const bookingPeople = Math.max(0, Number(booking.so_nguoi || 0));

  if (bookingPeople > 0) {
    await connection.execute(
      `UPDATE tour_schedules
       SET booked_slots = GREATEST(booked_slots - ?, 0),
           available_slots = LEAST(max_slots, available_slots + ?)
       WHERE id = ?`,
      [bookingPeople, bookingPeople, booking.schedule_id],
    );
  }

  await refreshScheduleOccupancyAndStatusById(booking.schedule_id, connection);

  if (refundStatus === "pending") {
    await createNotification(
      {
        type: "refund",
        message: `Có yêu cầu hoàn tiền mới cho booking #${bookingId}`,
      },
      connection,
    );
  }

  const updatedBooking = await getBookingById(bookingId);

  return {
    success: true,
    statusCode: 200,
    message: (isPendingCod || isCodMethod)
      ? "Bạn chưa thanh toán nên không có tiền hoàn"
      : "Booking cancelled successfully",
    data: {
      bookingId,
      tourName: booking.ten_tour,
      refundPercentage,
      refundStatus,
      cancelledAt: now,
      booking: updatedBooking,
    },
  };
};
