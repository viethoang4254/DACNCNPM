import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { getTourById } from "../models/tourModel.js";
import { getTourHistoryByUserId, upsertTourHistory } from "../models/historyModel.js";

export const saveTourHistoryController = asyncHandler(async (req, res) => {
  const userId = Number(req.user?.id);
  const tourId = Number(req.body.tour_id);

  const tour = await getTourById(tourId);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const history = await upsertTourHistory({
    user_id: userId,
    tour_id: tourId,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour history saved successfully",
    data: history,
  });
});

export const getTourHistoryByUserController = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  if (Number(req.user?.id) !== userId) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  const history = await getTourHistoryByUserId(userId, 10);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour history fetched successfully",
    data: history,
  });
});
