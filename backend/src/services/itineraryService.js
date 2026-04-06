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

export const getAdminItinerariesService = async ({ page, limit, search }) => {
  const result = await getAdminItineraryTours({ page, limit, search });

  return {
    message: "Admin itineraries fetched successfully",
    data: result.tours,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit) || 1,
    },
  };
};

export const getAdminItineraryByTourService = async ({ tourId }) => {
  const detail = await getItineraryDetailByTourId(tourId);

  if (!detail) {
    return {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    };
  }

  return {
    message: "Tour itinerary detail fetched successfully",
    data: detail,
  };
};

export const createAdminItinerariesService = async ({ tourId, itineraries }) => {
  const normalizedItineraries = normalizeItineraryPayload(Array.isArray(itineraries) ? itineraries : []);
  const tour = await getTourByIdForItinerary(tourId);
  if (!tour) {
    return {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    };
  }

  try {
    const detail = await replaceTourItineraries(tourId, normalizedItineraries);

    return {
      statusCode: 201,
      message: "Itineraries created successfully",
      data: detail,
    };
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return {
        statusCode: 409,
        success: false,
        message: "Duplicate day_number in itinerary list",
        data: {},
      };
    }
    throw error;
  }
};

export const updateAdminItinerariesService = async ({ tourId, itineraries }) => {
  const normalizedItineraries = normalizeItineraryPayload(Array.isArray(itineraries) ? itineraries : []);

  const tour = await getTourByIdForItinerary(tourId);
  if (!tour) {
    return {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    };
  }

  try {
    const detail = await replaceTourItineraries(tourId, normalizedItineraries);

    return {
      message: "Itineraries updated successfully",
      data: detail,
    };
  } catch (error) {
    if (isDuplicateItineraryError(error)) {
      return {
        statusCode: 409,
        success: false,
        message: "Duplicate day_number in itinerary list",
        data: {},
      };
    }
    throw error;
  }
};

export const deleteAdminItinerariesService = async ({ tourId }) => {
  const tour = await getTourByIdForItinerary(tourId);

  if (!tour) {
    return {
      statusCode: 404,
      success: false,
      message: "Tour not found",
      data: {},
    };
  }

  await deleteTourItinerariesByTourId(tourId);

  return {
    message: "Itineraries deleted successfully",
    data: {},
  };
};
