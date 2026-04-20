import { getTourById } from "../models/tourModel.js";
import { getTourHistoryByUserId, upsertTourHistory } from "../models/historyModel.js";

export const saveTourHistoryService = async ({ userId, tourId }) => {
  const tour = await getTourById(tourId);
  if (!tour) {
    return {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    };
  }

  const history = await upsertTourHistory({
    user_id: userId,
    tour_id: tourId,
  });

  return {
    statusCode: 200,
    success: true,
    message: "Tour history saved successfully",
    data: history,
  };
};

export const getTourHistoryByUserService = async ({ actorUserId, userId }) => {
  if (actorUserId !== userId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  const history = await getTourHistoryByUserId(userId, 10);

  return {
    statusCode: 200,
    success: true,
    message: "Tour history fetched successfully",
    data: history,
  };
};
