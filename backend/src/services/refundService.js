import pool from "../config/db.js";
import { getRefundByBookingId, getRefunds } from "../models/refundModel.js";
import { calculateRefundPercentage } from "./cancelBookingService.js";
import { getScheduleDaysLeft } from "./scheduleStatusService.js";

const calculateExpectedRefundAmount = (refund) => {
  const scheduleStatus = String(refund?.schedule_status || "").toLowerCase();
  const isSystemCancelledSchedule =
    scheduleStatus === "cancelled" || scheduleStatus === "canceled";
  const daysLeft = getScheduleDaysLeft(refund?.start_date);
  const refundPercentage = isSystemCancelledSchedule
    ? 100
    : calculateRefundPercentage(daysLeft);

  return {
    refundPercentage,
    expectedRefundAmount:
      (Number(refund?.tong_tien || 0) * Number(refundPercentage || 0)) / 100,
  };
};

export const withRefundComputedFields = (refund) => {
  const { expectedRefundAmount, refundPercentage } =
    calculateExpectedRefundAmount(refund);

  return {
    ...refund,
    expected_refund_amount: expectedRefundAmount,
    expected_refund_percentage: refundPercentage,
  };
};

export const getRefundList = async ({ status, keyword }) => {
  const refunds = await getRefunds({ status, keyword });
  return refunds.map(withRefundComputedFields);
};

export const getRefundDetail = async (bookingId, connection = pool) => {
  const refund = await getRefundByBookingId(bookingId, connection);
  if (!refund) {
    return null;
  }

  return withRefundComputedFields(refund);
};

export const approveRefund = async (bookingId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const refund = await getRefundByBookingId(bookingId, connection);
    if (!refund) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy yêu cầu hoàn tiền",
        data: {},
      };
    }

    if (refund.trang_thai !== "cancelled") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Chỉ booking đã hủy mới có thể hoàn tiền",
        data: {},
      };
    }

    if (refund.refund_status === "processed") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "Yêu cầu hoàn tiền đã được xử lý trước đó",
        data: {},
      };
    }

    if (refund.trang_thai !== "cancelled") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Chỉ booking đã hủy mới có thể từ chối hoàn tiền",
        data: {},
      };
    }

    if (refund.refund_status !== "pending") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Yêu cầu hoàn tiền không ở trạng thái chờ xử lý",
        data: {},
      };
    }

    if (refund.payment_status !== "paid") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Chỉ có thể duyệt hoàn tiền cho booking đã thanh toán",
        data: {},
      };
    }

    const { expectedRefundAmount: officialRefundAmount } =
      calculateExpectedRefundAmount(refund);

    await connection.execute(
      `UPDATE bookings
       SET refund_status = 'processed',
           refund_amount = ?,
           cancelled_by = 'admin'
       WHERE id = ?`,
      [officialRefundAmount, bookingId],
    );

    await connection.execute(
      `UPDATE payments
       SET status = 'refunded'
       WHERE booking_id = ?`,
      [bookingId],
    );

    await connection.commit();

    const updated = await getRefundDetail(bookingId);
    return {
      success: true,
      statusCode: 200,
      message: "Duyệt hoàn tiền thành công",
      data: updated,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const rejectRefund = async (bookingId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const refund = await getRefundByBookingId(bookingId, connection);
    if (!refund) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy yêu cầu hoàn tiền",
        data: {},
      };
    }

    if (refund.refund_status === "processed") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "Yêu cầu đã hoàn tiền không thể từ chối",
        data: {},
      };
    }

    if (refund.refund_status !== "pending") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "Yêu cầu hoàn tiền không ở trạng thái chờ xử lý",
        data: {},
      };
    }

    await connection.execute(
      `UPDATE bookings
       SET refund_status = 'failed'
       WHERE id = ?`,
      [bookingId],
    );

    await connection.commit();

    const updated = await getRefundDetail(bookingId);
    return {
      success: true,
      statusCode: 200,
      message: "Từ chối yêu cầu hoàn tiền thành công",
      data: updated,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
