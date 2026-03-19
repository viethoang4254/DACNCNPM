import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { hasUserBookedTour } from "../models/bookingModel.js";
import {
  createReview,
  deleteReviewById,
  getAllReviews,
  getReviewById,
  getReviewsByTourId,
  hasUserReviewedTour,
  updateReviewById,
} from "../models/reviewModel.js";

export const createReviewController = asyncHandler(async (req, res) => {
  const payload = {
    user_id: req.user.id,
    tour_id: Number(req.body.tour_id),
    rating: Number(req.body.rating),
    comment: req.body.comment,
  };

  const hasBooked = await hasUserBookedTour(payload.user_id, payload.tour_id);
  if (!hasBooked) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "User must book this tour before reviewing",
      data: {},
    });
  }

  const reviewed = await hasUserReviewedTour(payload.user_id, payload.tour_id);
  if (reviewed) {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "User already reviewed this tour",
      data: {},
    });
  }

  const id = await createReview(payload);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: await getReviewById(id),
  });
});

export const getReviewsController = asyncHandler(async (_req, res) => {
  const reviews = await getAllReviews();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data: reviews,
  });
});

export const getReviewByIdController = asyncHandler(async (req, res) => {
  const review = await getReviewById(Number(req.params.id));
  if (!review) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review fetched successfully",
    data: review,
  });
});

export const getReviewsByTourController = asyncHandler(async (req, res) => {
  const reviews = await getReviewsByTourId(Number(req.params.tourId));

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reviews fetched successfully",
    data: reviews,
  });
});

export const updateReviewController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getReviewById(id);

  if (!existing) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && existing.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  await updateReviewById(id, {
    rating: req.body.rating,
    comment: req.body.comment,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: await getReviewById(id),
  });
});

export const deleteReviewController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getReviewById(id);

  if (!existing) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && existing.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  await deleteReviewById(id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: {},
  });
});
