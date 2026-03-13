import asyncHandler from "../utils/asyncHandler.js";
import { optimizeUploadedImages, removeUploadedFiles } from "../middlewares/uploadMiddleware.js";
import { sendResponse } from "../utils/response.js";
import {
  createItinerary,
  deleteItineraryById,
  getItinerariesByTourId,
  getItineraryById,
  getTourByIdForItinerary,
  updateItineraryById,
} from "../models/itineraryModel.js";

const isDuplicateItineraryError = (error) => error?.code === "ER_DUP_ENTRY";

const mapUploadedPath = (file) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${file.filename}`;
};

export const getTourItinerariesController = asyncHandler(async (req, res) => {
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

  const itineraries = await getItinerariesByTourId(tourId);

  return sendResponse(res, {
    message: "Tour itineraries fetched successfully",
    data: itineraries,
  });
});

export const createItineraryController = asyncHandler(async (req, res) => {
  const payload = {
    tour_id: Number(req.body.tour_id),
    ngay_thu: Number(req.body.ngay_thu),
    tieu_de: req.body.tieu_de,
    description: req.body.description,
    image_url: req.body.image_url,
  };

  const tour = await getTourByIdForItinerary(payload.tour_id);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  try {
    const itinerary = await createItinerary(payload);

    return sendResponse(res, {
      statusCode: 201,
      message: "Itinerary created successfully",
      data: itinerary,
    });
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Itinerary day already exists for this tour",
        data: {},
      });
    }
    throw error;
  }
});

export const updateItineraryController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getItineraryById(id);

  if (!existing) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Itinerary not found",
      data: {},
    });
  }

  const payload = {
    tour_id: Number(req.body.tour_id),
    ngay_thu: Number(req.body.ngay_thu),
    tieu_de: req.body.tieu_de,
    description: req.body.description,
    image_url: req.body.image_url,
  };

  const tour = await getTourByIdForItinerary(payload.tour_id);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  try {
    const itinerary = await updateItineraryById(id, payload);

    return sendResponse(res, {
      message: "Itinerary updated successfully",
      data: itinerary,
    });
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Itinerary day already exists for this tour",
        data: {},
      });
    }
    throw error;
  }
});

export const deleteItineraryController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await deleteItineraryById(id);

  if (!deleted) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Itinerary not found",
      data: {},
    });
  }

  return sendResponse(res, {
    message: "Itinerary deleted successfully",
    data: {},
  });
});

export const uploadItineraryImageController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Image file is required",
      data: {},
    });
  }

  let optimizedFiles = [];

  try {
    optimizedFiles = await optimizeUploadedImages([req.file]);

    if (optimizedFiles.length === 0) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Image file is required",
        data: {},
      });
    }

    return sendResponse(res, {
      statusCode: 201,
      message: "Itinerary image uploaded successfully",
      data: {
        image_url: mapUploadedPath(optimizedFiles[0]),
      },
    });
  } catch (error) {
    await removeUploadedFiles(optimizedFiles);
    throw error;
  }
});
