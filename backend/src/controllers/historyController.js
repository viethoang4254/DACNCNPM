import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { getTourHistoryByUserService, saveTourHistoryService } from "../services/historyService.js";

export const saveTourHistoryController = asyncHandler(async (req, res) => {
  const result = await saveTourHistoryService({
    userId: Number(req.user?.id),
    tourId: Number(req.body.tour_id),
  });
  return sendResponse(res, result);
});

export const getTourHistoryByUserController = asyncHandler(async (req, res) => {
  const result = await getTourHistoryByUserService({
    actorUserId: Number(req.user?.id),
    userId: Number(req.params.userId),
  });
  return sendResponse(res, result);
});
