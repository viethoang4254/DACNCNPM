import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import { sendResponse } from "../utils/response.js";
import { getAdminBookings, getAdminStats, getRevenueReport } from "../models/adminModel.js";
import { checkCapacityAndApplyPolicy } from "../services/scheduleStatusService.js";

export const getStatsController = asyncHandler(async (req, res) => {
  const stats = await getAdminStats();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin stats fetched successfully",
    data: stats,
  });
});

export const getRevenueController = asyncHandler(async (req, res) => {
  const revenue = await getRevenueReport();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Revenue report fetched successfully",
    data: revenue,
  });
});

export const getAdminBookingsController = asyncHandler(async (req, res) => {
  const bookings = await getAdminBookings();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin bookings fetched successfully",
    data: bookings,
  });
});

export const checkTourCapacityController = asyncHandler(async (req, res) => {
  const scheduleId = req.body?.schedule_id !== undefined ? Number(req.body.schedule_id) : undefined;
  const tourId = req.body?.tour_id !== undefined ? Number(req.body.tour_id) : undefined;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const affectedSchedules = await checkCapacityAndApplyPolicy(
      {
        scheduleId: Number.isInteger(scheduleId) && scheduleId > 0 ? scheduleId : undefined,
        tourId: Number.isInteger(tourId) && tourId > 0 ? tourId : undefined,
      },
      connection,
    );

    await connection.commit();

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Capacity check completed",
      data: {
        total: affectedSchedules.length,
        schedules: affectedSchedules,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
