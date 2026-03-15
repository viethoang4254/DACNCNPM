import apiClient from "../utils/apiClient";

export const getTours = async (params) => {
  const response = await apiClient.get("/api/tours", { params });
  const payload = response.data || {};

  const tours = Array.isArray(payload.tours)
    ? payload.tours
    : Array.isArray(payload.data)
      ? payload.data
      : [];

  const total = Number(payload.total ?? payload.pagination?.total ?? 0);
  const limit = Number(payload.limit ?? payload.pagination?.limit ?? params?.limit ?? 8);
  const page = Number(payload.page ?? payload.pagination?.page ?? params?.page ?? 1);

  return {
    tours,
    total,
    limit,
    page,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
  };
};

export const searchTours = async (params) => {
  const response = await apiClient.get("/api/tours/search", { params });
  const payload = response.data || {};

  const tours = Array.isArray(payload.tours)
    ? payload.tours
    : Array.isArray(payload.data)
      ? payload.data
      : [];

  return {
    tours,
    total: Number(payload.total ?? tours.length),
    limit: Number(payload.limit ?? payload.pagination?.limit ?? params?.limit ?? 8),
    page: Number(payload.page ?? payload.pagination?.page ?? params?.page ?? 1),
    totalPages: Number(
      payload.pagination?.totalPages ??
        Math.max(1, Math.ceil(Number(payload.total ?? tours.length) / Math.max(1, Number(payload.limit ?? payload.pagination?.limit ?? params?.limit ?? 8))))
    ),
    message: payload.message || "",
    usedNearestDate: Boolean(payload.usedNearestDate),
  };
};
