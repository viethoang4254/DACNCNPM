import fs from "node:fs";
import path from "node:path";
import asyncHandler from "../utils/asyncHandler.js";
import { optimizeUploadedImages, removeUploadedFiles } from "../middlewares/uploadMiddleware.js";
import { sendResponse } from "../utils/response.js";
import {
  addTourImages,
  createTour,
  createTourSchedule,
  deleteTourById,
  deleteTourImageById,
  deleteTourScheduleById,
  getFeaturedTours,
  getLatestTours,
  getScheduleById,
  getTourById,
  getTourImageById,
  getTourImages,
  getTourSchedules,
  getSimilarToursByTourId,
  setTourCoverImageById,
  updateTour,
  updateTourImageById,
  updateTourSchedule,
} from "../models/tourModel.js";
import { getToursService } from "../services/tourService.js";
import { getReviewsByTourId } from "../models/reviewModel.js";
import { getItinerariesByTourId } from "../models/itineraryModel.js";

const parsePaging = (req) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? limit : 10,
  };
};

const normalizeTourQuery = (req) => {
  const { page, limit } = parsePaging(req);
  return {
    page,
    limit,
    keyword: req.query.search?.trim() || req.query.keyword?.trim(),
    tinh_thanh: req.query.tinh_thanh?.trim(),
    diem_khoi_hanh: req.query.diem_khoi_hanh?.trim(),
    price: req.query.price?.trim(),
    duration: req.query.duration?.trim(),
    minPrice: req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined,
    minDays: req.query.minDays !== undefined ? Number(req.query.minDays) : undefined,
    maxDays: req.query.maxDays !== undefined ? Number(req.query.maxDays) : undefined,
    sort: req.query.sort?.trim() || "newest",
  };
};

const mapUploadedPaths = (files) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return files.map((file) => `${baseUrl}/uploads/${file.filename}`);
};

const normalizeImageUrls = (body) => {
  const imageUrls = [];
  const pushUrl = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed) {
      imageUrls.push(trimmed);
    }
  };

  if (!body) return imageUrls;

  if (Array.isArray(body.image_urls)) {
    body.image_urls.forEach(pushUrl);
  } else if (typeof body.image_urls === "string") {
    const raw = body.image_urls.trim();
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(pushUrl);
        } else {
          pushUrl(raw);
        }
      } catch {
        pushUrl(raw);
      }
    } else {
      pushUrl(raw);
    }
  }

  pushUrl(body.image_url);
  return imageUrls;
};

export const getToursController = asyncHandler(async (req, res) => {
  const query = normalizeTourQuery(req);
  const { tours, total } = await getToursService(query);

  return res.status(200).json({
    success: true,
    message: "Tours fetched successfully",
    tours,
    total,
    page: query.page,
    limit: query.limit,
    data: tours,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  });
});

export const getTourByIdController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const tour = await getTourById(id);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const [images, schedules, itineraries] = await Promise.all([
    getTourImages(id),
    getTourSchedules(id),
    getItinerariesByTourId(id),
  ]);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour fetched successfully",
    data: {
      ...tour,
      images,
      schedules,
      itineraries,
    },
  });
});

export const getTourItinerariesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

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
    statusCode: 200,
    success: true,
    message: "Tour itineraries fetched successfully",
    data: itineraries,
  });
});

export const createTourController = asyncHandler(async (req, res) => {
  const tour = await createTour(req.body);
  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tour created successfully",
    data: tour,
  });
});

export const updateTourController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const tour = await getTourById(id);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const updated = await updateTour(id, req.body);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour updated successfully",
    data: updated,
  });
});

export const deleteTourController = asyncHandler(async (req, res) => {
  const deleted = await deleteTourById(Number(req.params.id));
  if (!deleted) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour deleted successfully",
    data: {},
  });
});

export const searchToursController = asyncHandler(async (req, res) => {
  req.query.keyword = req.query.keyword || req.query.q;
  return getToursController(req, res);
});

export const filterToursController = asyncHandler(async (req, res) => {
  return getToursController(req, res);
});

export const getFeaturedToursController = asyncHandler(async (req, res) => {
  const tours = await getFeaturedTours(Number(req.query.limit || 6));
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Featured tours fetched successfully",
    data: tours,
  });
});

export const getLatestToursController = asyncHandler(async (req, res) => {
  const tours = await getLatestTours(Number(req.query.limit || 8));
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Latest tours fetched successfully",
    data: tours,
  });
});

export const getTourReviewsController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const reviews = await getReviewsByTourId(tourId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reviews fetched successfully",
    data: reviews,
  });
});

export const getSimilarToursController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const tours = await getSimilarToursByTourId(tourId, Number(req.query.limit || 3));

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Similar tours fetched successfully",
    data: tours,
  });
});

export const addTourImagesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const optimizedFiles = await optimizeUploadedImages(req.files || []);
  const uploadedImageUrls = mapUploadedPaths(optimizedFiles);
  const manualImageUrls = normalizeImageUrls(req.body);
  const imageUrls = [...uploadedImageUrls, ...manualImageUrls];

  if (imageUrls.length === 0) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "At least one image file or image URL is required",
      data: {},
    });
  }

  try {
    await addTourImages(tourId, imageUrls);
  } catch (error) {
    await removeUploadedFiles(optimizedFiles);
    throw error;
  }

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tour images uploaded successfully",
    data: await getTourImages(tourId),
  });
});

export const updateTourImageController = asyncHandler(async (req, res) => {
  const imageId = Number(req.params.id);
  const image = await getTourImageById(imageId);

  if (!image) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Image not found",
      data: {},
    });
  }

  const optimizedFiles = req.file ? await optimizeUploadedImages([req.file]) : [];
  const manualUrl = req.body?.image_url?.trim();
  const uploadedUrl = optimizedFiles.length > 0 ? mapUploadedPaths(optimizedFiles)[0] : "";
  const nextImageUrl = uploadedUrl || manualUrl;

  if (!nextImageUrl) {
    await removeUploadedFiles(optimizedFiles);
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "image_url or image file is required",
      data: {},
    });
  }

  let updated;

  try {
    updated = await updateTourImageById(imageId, nextImageUrl);
  } catch (error) {
    await removeUploadedFiles(optimizedFiles);
    throw error;
  }

  if (image.image_url && image.image_url.includes("/uploads/") && image.image_url !== nextImageUrl) {
    const oldFileName = image.image_url.split("/uploads/")[1];
    const oldFilePath = path.resolve("uploads", oldFileName);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Image updated successfully",
    data: updated,
  });
});

export const getTourImagesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour images fetched successfully",
    data: await getTourImages(tourId),
  });
});

export const deleteTourImageController = asyncHandler(async (req, res) => {
  const imageId = Number(req.params.id);
  const image = await getTourImageById(imageId);

  if (!image) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Image not found",
      data: {},
    });
  }

  const deleted = await deleteTourImageById(imageId);
  if (deleted && image.image_url.includes("/uploads/")) {
    const fileName = image.image_url.split("/uploads/")[1];
    const filePath = path.resolve("uploads", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Image deleted successfully",
    data: {},
  });
});

export const setTourCoverImageController = asyncHandler(async (req, res) => {
  const imageId = Number(req.params.id);
  const image = await getTourImageById(imageId);

  if (!image) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Image not found",
      data: {},
    });
  }

  await setTourCoverImageById(imageId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cover image updated successfully",
    data: await getTourImages(image.tour_id),
  });
});

export const getTourSchedulesController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);

  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Schedules fetched successfully",
    data: await getTourSchedules(tourId),
  });
});

export const createTourScheduleController = asyncHandler(async (req, res) => {
  const tourId = Number(req.params.id);
  const tour = await getTourById(tourId);
  if (!tour) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    });
  }

  const schedule = await createTourSchedule({
    tour_id: tourId,
    start_date: req.body.start_date,
    available_slots: req.body.available_slots,
  });

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Schedule created successfully",
    data: schedule,
  });
});

export const updateTourScheduleController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getScheduleById(id);
  if (!existing) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    });
  }

  const schedule = await updateTourSchedule(id, req.body);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Schedule updated successfully",
    data: schedule,
  });
});

export const deleteTourScheduleController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await deleteTourScheduleById(id);

  if (!deleted) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Schedule deleted successfully",
    data: {},
  });
});
