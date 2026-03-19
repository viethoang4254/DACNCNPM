import pool from "../config/db.js";
import { getScheduleDaysLeft } from "./scheduleStatusService.js";

/**
 * Calculate refund percentage based on days remaining until tour start
 * Rules:
 * - >= 7 days: 100%
 * - 3-6 days: 50%
 * - < 3 days: 0% (no refund)
 */
export const calculateRefundPercentage = (daysLeft) => {
  if (daysLeft >= 7) return 100;
  if (daysLeft >= 3) return 50;
  return 0;
};

/**
 * Calculate refund amount based on booking total and days remaining
 */
export const calculateRefundAmount = (totalAmount, daysLeft) => {
  const percentage = calculateRefundPercentage(daysLeft);
  return (totalAmount * percentage) / 100;
};

/**
 * Validate if booking can be cancelled
 * Returns: { valid: boolean, error?: string }
 */
export const validateCancel = async (booking) => {
  // Check if booking exists
  if (!booking) {
    return { valid: false, error: "Booking not found" };
  }

  // Check if already cancelled
  if (booking.trang_thai === "cancelled") {
    return { valid: false, error: "Booking already cancelled" };
  }

  // Only allow cancel if status is 'pending' or 'confirmed'
  if (!["pending", "confirmed"].includes(booking.trang_thai)) {
    return { valid: false, error: `Cannot cancel booking with status: ${booking.trang_thai}` };
  }

  // Check remaining days
  const daysLeft = getScheduleDaysLeft(booking.start_date);
  if (daysLeft === null) {
    return { valid: false, error: "Invalid schedule date" };
  }

  // Cannot cancel if less than 1 day remaining
  if (daysLeft < 1) {
    return { 
      valid: false, 
      error: `Cannot cancel within 24 hours of tour departure (${daysLeft} days left)` 
    };
  }

  return { valid: true };
};

/**
 * Get cancel details for preview (before confirmation)
 */
export const getCancelPreview = async (booking) => {
  const daysLeft = getScheduleDaysLeft(booking.start_date);
  const refundPercentage = calculateRefundPercentage(daysLeft);
  const refundAmount = calculateRefundAmount(booking.tong_tien, daysLeft);

  return {
    daysLeft,
    refundPercentage,
    originalAmount: booking.tong_tien,
    refundAmount,
    message: 
      refundPercentage === 100 ? "Refund 100% - Full refund" :
      refundPercentage === 50 ? "Refund 50% - Partial refund" :
      "Refund 0% - No refund available"
  };
};

/**
 * Cancel booking with transaction
 * Returns: { success: boolean, error?: string, refundAmount?: number }
 */
export const cancelBookingService = async (bookingId, userId, connection) => {
  try {
    // 1. Fetch booking with related data
    const [[booking]] = await connection.execute(
      `SELECT b.id, b.user_id, b.schedule_id, b.tour_id, b.so_nguoi, b.tong_tien, 
              b.trang_thai, b.cancelled_at, s.start_date, s.max_slots, s.booked_slots,
              s.min_required_ratio, p.status AS payment_status
       FROM bookings b
       INNER JOIN tour_schedules s ON s.id = b.schedule_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = ? AND b.user_id = ?
       FOR UPDATE`,
      [bookingId, userId]
    );

    // 2. Validate
    const validation = await validateCancel(booking);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 3. Calculate refund
    const daysLeft = getScheduleDaysLeft(booking.start_date);
    const refundPercentage = calculateRefundPercentage(daysLeft);
    const refundAmount = calculateRefundAmount(booking.tong_tien, daysLeft);

    // Determine refund status based on payment
    const refundStatus = booking.payment_status === 'paid' ? 'pending' : 'none';

    // 4. Update booking to cancelled
    const now = new Date();
    const [bookingResult] = await connection.execute(
      `UPDATE bookings 
       SET trang_thai = 'cancelled', 
           cancelled_at = ?, 
           refund_amount = ?, 
           refund_status = ?,
           cancelled_by = 'user'
       WHERE id = ? AND user_id = ?`,
      [now, refundAmount, refundStatus, bookingId, userId]
    );

    if (bookingResult.affectedRows === 0) {
      throw new Error("Failed to update booking");
    }

    // 5. Update tour_schedules - Release booked slots
    const bookedSlots = Math.max(Number(booking.booked_slots) - Number(booking.so_nguoi), 0);
    const maxSlots = Number(booking.max_slots) || 0;
    const availableSlots = Math.max(maxSlots - bookedSlots, 0);

    const [scheduleResult] = await connection.execute(
      `UPDATE tour_schedules 
       SET booked_slots = ?, available_slots = ?
       WHERE id = ?`,
      [bookedSlots, availableSlots, booking.schedule_id]
    );

    if (scheduleResult.affectedRows === 0) {
      throw new Error("Failed to update schedule");
    }

    // 6. Update schedule status based on new booking situation
    await updateScheduleStatusAfterCancel(connection, booking.schedule_id, booking.tour_id);

    // 7. If payment was made, create refund record (optional - integrate with payment system)
    if (booking.payment_status === 'paid' && refundAmount > 0) {
      await connection.execute(
        `UPDATE payments 
         SET status = 'refunded' 
         WHERE booking_id = ?`,
        [bookingId]
      );
    }

    return { 
      success: true, 
      refundAmount,
      refundPercentage,
      refundStatus,
      cancelledAt: now
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update schedule status after cancellation
 */
const updateScheduleStatusAfterCancel = async (connection, scheduleId, tourId) => {
  const [[schedule]] = await connection.execute(
    `SELECT id, max_slots, booked_slots, min_required_ratio, start_date
     FROM tour_schedules
     WHERE id = ?`,
    [scheduleId]
  );

  if (!schedule) return;

  const maxSlots = Number(schedule.max_slots) || 0;
  const bookedSlots = Number(schedule.booked_slots) || 0;
  const minRequiredRatio = Number(schedule.min_required_ratio) || 0.5;

  // Determine new status
  let newStatus = "open";
  
  if (bookedSlots >= maxSlots && maxSlots > 0) {
    newStatus = "full";
  } else if (bookedSlots / maxSlots >= minRequiredRatio) {
    newStatus = "guaranteed";
  } else {
    newStatus = "open";
  }

  await connection.execute(
    `UPDATE tour_schedules SET status = ? WHERE id = ?`,
    [newStatus, scheduleId]
  );
};
