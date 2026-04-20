import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  addTourImagesControllerService,
  createTourControllerService,
  createTourScheduleControllerService,
  deleteTourControllerService,
  deleteTourImageControllerService,
  deleteTourScheduleControllerService,
  getFeaturedToursControllerService,
  getLatestToursControllerService,
  getRecommendToursControllerService,
  getSimilarToursControllerService,
  getTourByIdControllerService,
  getTourImagesControllerService,
  getTourItinerariesControllerService,
  getTourReviewsControllerService,
  getTourSchedulesControllerService,
  getToursControllerService,
  searchToursControllerService,
  setTourCoverImageControllerService,
  updateTourControllerService,
  updateTourImageControllerService,
  updateTourScheduleControllerService,
} from "../services/tourControllerService.js";

export const getToursController = asyncHandler(async (req, res) => {
  const result = await getToursControllerService({ query: req.query });
  return res.status(result.statusCode).json(result.payload);
});

export const getTourByIdController = asyncHandler(async (req, res) => {
  const result = await getTourByIdControllerService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getTourItinerariesController = asyncHandler(async (req, res) => {
  const result = await getTourItinerariesControllerService({ tourId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const createTourController = asyncHandler(async (req, res) => {
  const result = await createTourControllerService({ payload: req.body });
  return sendResponse(res, result);
});

export const updateTourController = asyncHandler(async (req, res) => {
  const result = await updateTourControllerService({
    id: Number(req.params.id),
    payload: req.body,
  });
  return sendResponse(res, result);
});

export const deleteTourController = asyncHandler(async (req, res) => {
  const result = await deleteTourControllerService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const searchToursController = asyncHandler(async (req, res) => {
  const result = await searchToursControllerService({ query: req.query });
  return res.status(result.statusCode).json(result.payload);
});

export const filterToursController = asyncHandler(async (req, res) => {
  return getToursController(req, res);
});

export const getFeaturedToursController = asyncHandler(async (req, res) => {
  const result = await getFeaturedToursControllerService({ limit: Number(req.query.limit || 6) });
  return sendResponse(res, result);
});

export const getLatestToursController = asyncHandler(async (req, res) => {
  const result = await getLatestToursControllerService({ limit: Number(req.query.limit || 8) });
  return sendResponse(res, result);
});

export const getTourReviewsController = asyncHandler(async (req, res) => {
  const result = await getTourReviewsControllerService({ tourId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getSimilarToursController = asyncHandler(async (req, res) => {
  const result = await getSimilarToursControllerService({
    tourId: Number(req.params.id),
    limit: Number(req.query.limit || 3),
  });
  return sendResponse(res, result);
});

export const getRecommendToursController = asyncHandler(async (req, res) => {
  const result = await getRecommendToursControllerService({
    userId: Number(req.params.userId),
    limit: Number(req.query.limit || 6),
  });
  return sendResponse(res, result);
});

export const addTourImagesController = asyncHandler(async (req, res) => {
  const result = await addTourImagesControllerService({
    tourId: Number(req.params.id),
    files: req.files,
    body: req.body,
  });
  return sendResponse(res, result);
});

export const updateTourImageController = asyncHandler(async (req, res) => {
  const result = await updateTourImageControllerService({
    imageId: Number(req.params.id),
    file: req.file,
    body: req.body,
  });
  return sendResponse(res, result);
});

export const getTourImagesController = asyncHandler(async (req, res) => {
  const result = await getTourImagesControllerService({ tourId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const deleteTourImageController = asyncHandler(async (req, res) => {
  const result = await deleteTourImageControllerService({ imageId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const setTourCoverImageController = asyncHandler(async (req, res) => {
  const result = await setTourCoverImageControllerService({ imageId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getTourSchedulesController = asyncHandler(async (req, res) => {
  const result = await getTourSchedulesControllerService({ tourId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const createTourScheduleController = asyncHandler(async (req, res) => {
  const result = await createTourScheduleControllerService({
    tourId: Number(req.params.id),
    start_date: req.body.start_date,
    available_slots: req.body.available_slots,
  });
  return sendResponse(res, result);
});

export const updateTourScheduleController = asyncHandler(async (req, res) => {
  const result = await updateTourScheduleControllerService({
    id: Number(req.params.id),
    payload: req.body,
  });
  return sendResponse(res, result);
});

export const deleteTourScheduleController = asyncHandler(async (req, res) => {
  const result = await deleteTourScheduleControllerService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});
