import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getDashboardAlerts,
  getDashboardBookingStatus,
  getDashboardRevenueChart,
  getDashboardSummary,
} from "../models/dashboardModel.js";

export const getDashboardSummaryController = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard summary fetched successfully",
    data: summary,
  });
});

export const getDashboardBookingStatusController = asyncHandler(
  async (req, res) => {
    const bookingStatus = await getDashboardBookingStatus();

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Dashboard booking status fetched successfully",
      data: bookingStatus,
    });
  },
);

export const getDashboardRevenueChartController = asyncHandler(
  async (req, res) => {
    const chart = await getDashboardRevenueChart();

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Dashboard revenue chart fetched successfully",
      data: chart,
    });
  },
);

export const getDashboardAlertsController = asyncHandler(async (req, res) => {
  const alerts = await getDashboardAlerts();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard alerts fetched successfully",
    data: alerts,
  });
});
