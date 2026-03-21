import { createNotification } from "../models/notificationModel.js";
import { getBookingById } from "../models/bookingModel.js";
import { calculateRefundPercentage, validateCancel } from "./cancelBookingService.js";
import {
  getScheduleDaysLeft,
  refreshScheduleOccupancyAndStatusById,
} from "./scheduleStatusService.js";

export const cancelBooking = async ({ bookingId, userId, cancelReason, connection }) => {
  const [[booking]] = await connection.execute(
    `SELECT b.id, b.user_id, b.schedule_id, b.tour_id, b.so_nguoi, b.tong_tien,
         b.trang_thai, b.cancelled_at, s.start_date, s.status AS schedule_status,
         t.ten_tour,
            p.status AS payment_status
     FROM bookings b
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
       INNER JOIN tours t ON t.id = b.tour_id
     LEFT JOIN payments p ON p.booking_id = b.id
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
  const daysLeft = getScheduleDaysLeft(booking.start_date);
  const refundPercentage = isSystemCancelledSchedule
    ? 100
    : calculateRefundPercentage(daysLeft);
  const isPaid = String(booking.payment_status || "").toLowerCase() === "paid";

  const refundStatus = isPaid && refundPercentage > 0 ? "pending" : "none";
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
    message: "Booking cancelled successfully",
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
