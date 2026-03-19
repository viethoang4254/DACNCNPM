import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  deleteTourItinerariesByTourId,
  getAdminItineraryTours,
  getItineraryDetailByTourId,
  getTourByIdForItinerary,
  replaceTourItineraries,
} from "../models/itineraryModel.js";

const isDuplicateItineraryError = (error) => error?.code === "ER_DUP_ENTRY";

const normalizeItineraryPayload = (itineraries) =>
  itineraries
    .map((item) => ({
      day_number: Number(item.day_number),
      title: String(item.title || "").trim(),
      description: typeof item.description === "string" ? item.description : "",
    }))
    .sort((a, b) => a.day_number - b.day_number);

export const getAdminItinerariesController = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = String(req.query.search || "").trim();

  const result = await getAdminItineraryTours({ page, limit, search });

  return sendResponse(res, {
    message: "Admin itineraries fetched successfully",
    data: result.tours,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit) || 1,
    },
  });
});

export const getAdminItineraryByTourController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.tourId);
  const detail = await getItineraryDetailByTourId(tourId);

  if (!detail) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  return sendResponse(res, {
    message: "Tour itinerary detail fetched successfully",
    data: detail,
  });
});

export const createAdminItinerariesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.body.tour_id);
  const itineraries = normalizeItineraryPayload(Array.isArray(req.body.itineraries) ? req.body.itineraries : []);

  const tour = await getTourByIdForItinerary(tourId);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  try {
    const detail = await replaceTourItineraries(tourId, itineraries);

    return sendResponse(res, {
      statusCode: 201,
      message: "Itineraries created successfully",
      data: detail,
    });
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Duplicate day_number in itinerary list",
        data: {},
      });
    }
    throw error;
  }
});

export const updateAdminItinerariesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.tourId);
  const itineraries = normalizeItineraryPayload(Array.isArray(req.body.itineraries) ? req.body.itineraries : []);

  const tour = await getTourByIdForItinerary(tourId);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  try {
    const detail = await replaceTourItineraries(tourId, itineraries);

    return sendResponse(res, {
      message: "Itineraries updated successfully",
      data: detail,
    });
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Duplicate day_number in itinerary list",
        data: {},
      });
    }
    throw error;
  }
});

export const deleteAdminItinerariesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.tourId);
  const tour = await getTourByIdForItinerary(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  await deleteTourItinerariesByTourId(tourId);

  return sendResponse(res, {
    message: "Itineraries deleted successfully",
    data: {},
  });
});
