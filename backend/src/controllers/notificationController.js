import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getNotificationsService,
  getUnreadNotificationCountService,
  markNotificationReadService,
} from "../services/notificationService.js";

export const getNotificationsController = asyncHandler(async (req, res) => {
  const result = await getNotificationsService();
  return sendResponse(res, result);
});

export const markNotificationReadController = asyncHandler(async (req, res) => {
  const result = await markNotificationReadService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getUnreadNotificationCountController = asyncHandler(async (req, res) => {
  const result = await getUnreadNotificationCountService();
  return sendResponse(res, result);
});
