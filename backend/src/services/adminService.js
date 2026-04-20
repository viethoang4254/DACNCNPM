import pool from "../config/db.js";
import { getAdminBookings, getAdminStats, getRevenueReport } from "../models/adminModel.js";
import { checkCapacityAndApplyPolicy } from "./scheduleStatusService.js";

export const getStatsService = async () => {
  const stats = await getAdminStats();
  return {
    statusCode: 200,
    success: true,
    message: "Admin stats fetched successfully",
    data: stats,
  };
};

export const getRevenueService = async () => {
  const revenue = await getRevenueReport();
  return {
    statusCode: 200,
    success: true,
    message: "Revenue report fetched successfully",
    data: revenue,
  };
};

export const getAdminBookingsService = async () => {
  const bookings = await getAdminBookings();
  return {
    statusCode: 200,
    success: true,
    message: "Admin bookings fetched successfully",
    data: bookings,
  };
};

export const checkTourCapacityService = async ({ scheduleId, tourId }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const affectedSchedules = await checkCapacityAndApplyPolicy(
      {
        scheduleId: Number.isInteger(scheduleId) && scheduleId > 0 ? scheduleId : undefined,
        tourId: Number.isInteger(tourId) && tourId > 0 ? tourId : undefined,
      },
      connection
    );

    await connection.commit();

    return {
      statusCode: 200,
      success: true,
      message: "Capacity check completed",
      data: {
        total: affectedSchedules.length,
        schedules: affectedSchedules,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
