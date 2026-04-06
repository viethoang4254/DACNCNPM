import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getDashboardAlertsService,
  getDashboardBookingStatusService,
  getDashboardRevenueChartService,
  getDashboardSummaryService,
} from "../services/dashboardService.js";

export const getDashboardSummaryController = asyncHandler(async (req, res) => {
  const result = await getDashboardSummaryService();
  return sendResponse(res, result);
});

export const getDashboardBookingStatusController = asyncHandler(
  async (req, res) => {
    const result = await getDashboardBookingStatusService();
    return sendResponse(res, result);
  },
);

export const getDashboardRevenueChartController = asyncHandler(
  async (req, res) => {
    const result = await getDashboardRevenueChartService();
    return sendResponse(res, result);
  },
);

export const getDashboardAlertsController = asyncHandler(async (req, res) => {
  const result = await getDashboardAlertsService();
  return sendResponse(res, result);
});
