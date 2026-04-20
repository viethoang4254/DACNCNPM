import apiClient from "../utils/apiClient";
import { getAuthUser } from "../utils/authStorage";
import { getGuestTourHistory, saveGuestTourHistory } from "../utils/tourHistoryStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const normalizeTourCardData = (item) => ({
  id: Number(item.id || item.tour_id),
  tour_id: Number(item.tour_id || item.id),
  ten_tour: item.ten_tour || "",
  gia: Number(item.gia || 0),
  tinh_thanh: item.tinh_thanh || "",
  phuong_tien: item.phuong_tien || "",
  so_ngay: Number(item.so_ngay || 0),
  hinh_anh: resolveImageUrl(item.hinh_anh || item.image_url || ""),
  viewed_at: item.viewed_at || null,
  viewedAt: item.viewedAt || null,
});

const fetchTourCoverImage = async (tourId) => {
  try {
    const response = await apiClient.get(`/api/tours/${tourId}/images`);
    const list = Array.isArray(response?.data?.data) ? response.data.data : [];
    const firstImage = list.find((item) => item?.image_url)?.image_url || "";
    return resolveImageUrl(firstImage);
  } catch {
    return "";
  }
};

const enrichWithFallbackImage = async (items) => {
  const normalized = items.map(normalizeTourCardData);

  const imageFallbackTasks = normalized.map(async (item) => {
    if (item.hinh_anh) return item;
    const fallbackImage = await fetchTourCoverImage(item.tour_id || item.id);
    return {
      ...item,
      hinh_anh: fallbackImage,
    };
  });

  return Promise.all(imageFallbackTasks);
};

export const saveTourView = async (tourId) => {
  const user = getAuthUser();

  if (user?.id) {
    await apiClient.post("/api/history", {
      tour_id: Number(tourId),
    });
    return;
  }

  saveGuestTourHistory(Number(tourId));
};

export const getTourHistory = async () => {
  const user = getAuthUser();

  if (user?.id) {
    const response = await apiClient.get(`/api/history/${user.id}`);
    const list = Array.isArray(response?.data?.data) ? response.data.data : [];

    const withImages = await enrichWithFallbackImage(list);
    return {
      fromGuestStorage: false,
      data: withImages,
    };
  }

  const guestHistory = getGuestTourHistory();
  if (guestHistory.length === 0) {
    return {
      fromGuestStorage: true,
      data: [],
    };
  }

  const requests = guestHistory.map((item) =>
    apiClient
      .get(`/api/tours/${item.tour_id}`)
      .then((res) => ({
        ...res?.data?.data,
        tour_id: item.tour_id,
        viewedAt: item.viewedAt,
      }))
      .catch(() => null)
  );

  const resolved = await Promise.all(requests);

  const merged = await enrichWithFallbackImage(resolved.filter(Boolean));

  merged.sort((a, b) => Number(b.viewedAt || 0) - Number(a.viewedAt || 0));

  return {
    fromGuestStorage: true,
    data: merged,
  };
};

export const getRecommendedTours = async () => {
  const user = getAuthUser();
  if (!user?.id) return [];

  const response = await apiClient.get(`/api/tours/recommend/${user.id}`, {
    params: { limit: 6 },
  });

  const list = Array.isArray(response?.data?.data) ? response.data.data : [];
  return list.map(normalizeTourCardData);
};

export const formatViewedAgo = (value) => {
  const source = value ? new Date(value).getTime() : null;
  if (!source || Number.isNaN(source)) {
    return "Đã xem gần đây";
  }

  const diffMs = Date.now() - source;
  if (diffMs < 60 * 1000) return "Đã xem vài giây trước";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `Đã xem ${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Đã xem ${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  return `Đã xem ${days} ngày trước`;
};
