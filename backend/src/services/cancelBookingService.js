import { getScheduleDaysLeft } from "./scheduleStatusService.js";

/**
 * Calculate refund percentage based on days remaining until tour start
 * Rules:
 * - >= 7 days: 100%
 * - 3-6 days: 70%
 * - 1-2 days: 30%
 * - < 24h: 0% (no refund)
 */
export const calculateRefundPercentage = (daysLeft) => {
  if (daysLeft >= 7) return 100;
  if (daysLeft >= 3) return 70;
  if (daysLeft >= 1) return 30;
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

  // Cannot cancel if departure date already passed
  if (daysLeft < 0) {
    return {
      valid: false,
      error: `Cannot cancel after departure date (${daysLeft} days left)`,
    };
  }

  return { valid: true };
};

/**
 * Get cancel details for preview (before confirmation)
 */
export const getCancelPreview = async (booking) => {
  const daysLeft = getScheduleDaysLeft(booking.start_date);
  const scheduleStatus = String(booking.schedule_status || "").toLowerCase();
  const isSystemCancelledSchedule =
    scheduleStatus === "cancelled" || scheduleStatus === "canceled";

  const refundPercentage = isSystemCancelledSchedule
    ? 100
    : calculateRefundPercentage(daysLeft);
  const refundAmount = (Number(booking.tong_tien || 0) * refundPercentage) / 100;

  return {
    daysLeft,
    refundPercentage,
    originalAmount: booking.tong_tien,
    refundAmount,
    message: 
      isSystemCancelledSchedule ? "Tour đã bị hệ thống hủy - hoàn 100%" :
      refundPercentage === 100 ? "Refund 100% - Full refund" :
      refundPercentage === 70 ? "Refund 70% - Partial refund" :
      refundPercentage === 30 ? "Refund 30% - Partial refund" :
      "Refund 0% - No refund available"
  };
};

