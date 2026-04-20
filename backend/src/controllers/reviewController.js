import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createReviewService,
  deleteReviewService,
  getReviewByIdService,
  getReviewEligibilityService,
  getReviewsByTourService,
  getReviewsService,
  hideReviewService,
  showReviewService,
  updateReviewService,
} from "../services/reviewService.js";

export const createReviewController = asyncHandler(async (req, res) => {
  const result = await createReviewService({
    userId: req.user.id,
    tour_id: req.body.tour_id,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  return sendResponse(res, result);
});

export const getReviewsController = asyncHandler(async (_req, res) => {
  const result = await getReviewsService();
  return sendResponse(res, result);
});

export const getReviewByIdController = asyncHandler(async (req, res) => {
  const result = await getReviewByIdService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getReviewsByTourController = asyncHandler(async (req, res) => {
  const result = await getReviewsByTourService({ tourId: Number(req.params.tourId) });
  return sendResponse(res, result);
});

export const getReviewEligibilityController = asyncHandler(async (req, res) => {
  const result = await getReviewEligibilityService({
    userId: Number(req.user?.id || 0),
    tourId: Number(req.params.tourId || 0),
  });
  return sendResponse(res, result);
});

export const updateReviewController = asyncHandler(async (req, res) => {
  const result = await updateReviewService({
    id: Number(req.params.id),
    actorRole: req.user.role,
    actorUserId: req.user.id,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  return sendResponse(res, result);
});

export const deleteReviewController = asyncHandler(async (req, res) => {
  const result = await deleteReviewService({
    id: Number(req.params.id),
    actorRole: req.user.role,
    actorUserId: req.user.id,
  });
  return sendResponse(res, result);
});

export const hideReviewController = asyncHandler(async (req, res) => {
  const result = await hideReviewService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const showReviewController = asyncHandler(async (req, res) => {
  const result = await showReviewService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});
