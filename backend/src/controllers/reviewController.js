import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  canUserReviewTour,
  createReview,
  deleteReviewById,
  getAllReviews,
  getReviewById,
  getReviewsByTourId,
  getTourReviewStats,
  hasUserReviewedTour,
  setReviewHiddenStateById,
  updateReviewById,
} from "../models/reviewModel.js";

export const createReviewController = asyncHandler(async (req, res) => {
  const payload = {
    user_id: req.user.id,
    tour_id: Number(req.body.tour_id),
    rating: Number(req.body.rating),
    comment: req.body.comment,
  };

  const canReview = await canUserReviewTour(payload.user_id, payload.tour_id);
  if (!canReview) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Bạn chỉ có thể đánh giá sau khi hoàn thành tour",
      data: {},
    });
  }

  const reviewed = await hasUserReviewedTour(payload.user_id, payload.tour_id);
  if (reviewed) {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Bạn đã đánh giá tour này",
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
  const tourId = Number(req.params.tourId);
  const reviews = await getReviewsByTourId(tourId, { includeHidden: false });
  const stats = await getTourReviewStats(tourId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reviews fetched successfully",
    data: {
      reviews,
      stats,
    },
  });
});

export const getReviewEligibilityController = asyncHandler(async (req, res) => {
  const userId = Number(req.user?.id || 0);
  const tourId = Number(req.params.tourId || 0);

  const [canReview, hasReviewed] = await Promise.all([
    canUserReviewTour(userId, tourId),
    hasUserReviewedTour(userId, tourId),
  ]);

  let message = "";
  if (hasReviewed) {
    message = "Bạn đã đánh giá tour này";
  } else if (!canReview) {
    message = "Bạn chỉ có thể đánh giá sau khi hoàn thành tour";
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review eligibility fetched successfully",
    data: {
      canReview: canReview && !hasReviewed,
      hasReviewed,
      message,
    },
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

export const hideReviewController = asyncHandler(async (req, res) => {
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

  await setReviewHiddenStateById(id, true);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review hidden successfully",
    data: await getReviewById(id),
  });
});

export const showReviewController = asyncHandler(async (req, res) => {
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

  await setReviewHiddenStateById(id, false);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review shown successfully",
    data: await getReviewById(id),
  });
});
