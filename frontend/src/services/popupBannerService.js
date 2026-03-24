import apiClient from "../utils/apiClient";

const normalizeBannerPayload = (payload) => ({
  title: payload.title?.trim() || "",
  image_url: payload.image_url?.trim() || "",
  link: payload.link?.trim() || "",
  start_date: payload.start_date,
  end_date: payload.end_date,
  priority: Number(payload.priority || 0),
  target_type: payload.target_type || "all",
  is_active: Boolean(payload.is_active),
});

export const getPopupBanners = async () => {
  const response = await apiClient.get("/api/admin/popup-banners");
  return Array.isArray(response?.data?.data) ? response.data.data : [];
};

export const getActivePopupBanner = async () => {
  const response = await apiClient.get("/api/popup-banner");
  const payload = response?.data || {};

  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload && typeof payload === "object" ? payload : null;
};

export const createPopupBanner = async (payload) => {
  const response = await apiClient.post(
    "/api/admin/popup-banners",
    normalizeBannerPayload(payload),
  );

  return response?.data?.data || null;
};

export const updatePopupBanner = async (id, payload) => {
  const response = await apiClient.put(
    `/api/admin/popup-banners/${id}`,
    normalizeBannerPayload(payload),
  );

  return response?.data?.data || null;
};

export const deletePopupBanner = async (id) => {
  const response = await apiClient.delete(`/api/admin/popup-banners/${id}`);
  return response?.data?.data || null;
};

export const togglePopupBanner = async (id) => {
  const response = await apiClient.patch(`/api/admin/popup-banners/${id}/toggle`);
  return response?.data?.data || null;
};

export const uploadPopupBannerImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response?.data?.data?.image_url || "";
};

export const getPopupApiMessage = (error, fallback) =>
  error?.response?.data?.data?.errors?.[0]?.msg ||
  error?.response?.data?.message ||
  fallback;
