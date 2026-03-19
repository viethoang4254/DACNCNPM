import apiClient from "../utils/apiClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getUsers = async () => {
  const response = await apiClient.get("/api/users");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const createUser = async (payload) => {
  const response = await apiClient.post("/api/users", payload);
  return response.data?.data || null;
};

export const updateUser = async (userId, payload) => {
  const response = await apiClient.put(`/api/users/${userId}`, payload);
  return response.data?.data || null;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/api/users/${userId}`);
  return response.data || null;
};

export const getApiMessage = (error, fallback) =>
  error?.response?.data?.data?.errors?.[0]?.msg || error?.response?.data?.message || fallback;

export const getCurrentUserProfile = async () => {
  const response = await apiClient.get("/api/users/me");
  return response.data?.data || null;
};

export const updateCurrentUserProfile = async (payload) => {
  const response = await apiClient.put("/api/users/profile", payload);
  return response.data?.data || null;
};

export const changeUserPassword = async (payload) => {
  const response = await apiClient.put("/api/users/change-password", payload);
  return response.data?.data || null;
};

export const getMyBookings = async () => {
  const response = await apiClient.get("/api/bookings/my");
  const list = Array.isArray(response.data?.data) ? response.data.data : [];

  return list.map((item) => ({
    ...item,
    image: resolveImageUrl(item.image || ""),
  }));
};

/**
 * Get cancel preview - shows refund amount before confirming
 * @param {number} bookingId
 * @returns {Promise} { bookingId, tourName, startDate, originalAmount, daysLeft, refundPercentage, refundAmount, message }
 */
export const getCancelPreview = async (bookingId) => {
  const response = await apiClient.get(`/api/bookings/${bookingId}/cancel-preview`);
  return response.data?.data || null;
};

/**
 * Cancel booking with auto-refund
 * @param {number} bookingId
 * @returns {Promise} { bookingId, tourName, refundAmount, refundPercentage, refundStatus, cancelledAt, booking }
 */
export const cancelBooking = async (bookingId) => {
  const response = await apiClient.post(`/api/bookings/${bookingId}/cancel`);
  return response.data?.data || null;
};