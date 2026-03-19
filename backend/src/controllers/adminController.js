import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { getAdminBookings, getAdminStats, getRevenueReport } from "../models/adminModel.js";

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
