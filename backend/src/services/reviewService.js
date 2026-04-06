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

export const createReviewService = async ({ userId, tour_id, rating, comment }) => {
  const payload = {
    user_id: userId,
    tour_id: Number(tour_id),
    rating: Number(rating),
    comment,
  };

  const canReview = await canUserReviewTour(payload.user_id, payload.tour_id);
  if (!canReview) {
    return {
      statusCode: 400,
      success: false,
      message: "Bạn chỉ có thể đánh giá sau khi hoàn thành tour",
      data: {},
    };
  }

  const reviewed = await hasUserReviewedTour(payload.user_id, payload.tour_id);
  if (reviewed) {
    return {
      statusCode: 409,
      success: false,
      message: "Bạn đã đánh giá tour này",
      data: {},
    };
  }

  const id = await createReview(payload);

  return {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: await getReviewById(id),
  };
};

export const getReviewsService = async () => {
  const reviews = await getAllReviews();

  return {
    statusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data: reviews,
  };
};

export const getReviewByIdService = async ({ id }) => {
  const review = await getReviewById(id);
  if (!review) {
    return {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Review fetched successfully",
    data: review,
  };
};

export const getReviewsByTourService = async ({ tourId }) => {
  const reviews = await getReviewsByTourId(tourId, { includeHidden: false });
  const stats = await getTourReviewStats(tourId);

  return {
    statusCode: 200,
    success: true,
    message: "Tour reviews fetched successfully",
    data: {
      reviews,
      stats,
    },
  };
};

export const getReviewEligibilityService = async ({ userId, tourId }) => {
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

  return {
    statusCode: 200,
    success: true,
    message: "Review eligibility fetched successfully",
    data: {
      canReview: canReview && !hasReviewed,
      hasReviewed,
      message,
    },
  };
};

export const updateReviewService = async ({ id, actorRole, actorUserId, rating, comment }) => {
  const existing = await getReviewById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && existing.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  await updateReviewById(id, { rating, comment });

  return {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: await getReviewById(id),
  };
};

export const deleteReviewService = async ({ id, actorRole, actorUserId }) => {
  const existing = await getReviewById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && existing.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  await deleteReviewById(id);

  return {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: {},
  };
};

export const hideReviewService = async ({ id }) => {
  const existing = await getReviewById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    };
  }

  await setReviewHiddenStateById(id, true);

  return {
    statusCode: 200,
    success: true,
    message: "Review hidden successfully",
    data: await getReviewById(id),
  };
};

export const showReviewService = async ({ id }) => {
  const existing = await getReviewById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Review not found",
      data: {},
    };
  }

  await setReviewHiddenStateById(id, false);

  return {
    statusCode: 200,
    success: true,
    message: "Review shown successfully",
    data: await getReviewById(id),
  };
};
