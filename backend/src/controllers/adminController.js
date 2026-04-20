import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  checkTourCapacityService,
  getAdminBookingsService,
  getRevenueService,
  getStatsService,
} from "../services/adminService.js";

export const getStatsController = asyncHandler(async (req, res) => {
  const result = await getStatsService();
  return sendResponse(res, result);
});

export const getRevenueController = asyncHandler(async (req, res) => {
  const result = await getRevenueService();
  return sendResponse(res, result);
});

export const getAdminBookingsController = asyncHandler(async (req, res) => {
  const result = await getAdminBookingsService();
  return sendResponse(res, result);
});

export const checkTourCapacityController = asyncHandler(async (req, res) => {
  const result = await checkTourCapacityService({
    scheduleId: req.body?.schedule_id !== undefined ? Number(req.body.schedule_id) : undefined,
    tourId: req.body?.tour_id !== undefined ? Number(req.body.tour_id) : undefined,
  });
  return sendResponse(res, result);
});
