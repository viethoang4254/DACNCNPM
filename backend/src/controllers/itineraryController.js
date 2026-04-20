import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createAdminItinerariesService,
  deleteAdminItinerariesService,
  getAdminItinerariesService,
  getAdminItineraryByTourService,
  updateAdminItinerariesService,
} from "../services/itineraryService.js";

export const getAdminItinerariesController = asyncHandler(async (req, res) => {
  const result = await getAdminItinerariesService({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10),
    search: String(req.query.search || "").trim(),
  });
  return sendResponse(res, result);
});

export const getAdminItineraryByTourController = asyncHandler(async (req, res) => {
  const result = await getAdminItineraryByTourService({ tourId: Number(req.params.tourId) });
  return sendResponse(res, result);
});

export const createAdminItinerariesController = asyncHandler(async (req, res) => {
  const result = await createAdminItinerariesService({
    tourId: Number(req.body.tour_id),
    itineraries: req.body.itineraries,
  });
  return sendResponse(res, result);
});

export const updateAdminItinerariesController = asyncHandler(async (req, res) => {
  const result = await updateAdminItinerariesService({
    tourId: Number(req.params.tourId),
    itineraries: req.body.itineraries,
  });
  return sendResponse(res, result);
});

export const deleteAdminItinerariesController = asyncHandler(async (req, res) => {
  const result = await deleteAdminItinerariesService({ tourId: Number(req.params.tourId) });
  return sendResponse(res, result);
});
