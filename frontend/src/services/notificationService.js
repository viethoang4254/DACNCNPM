import apiClient from "../utils/apiClient";

export const getNotifications = async () => {
  const response = await apiClient.get("/api/admin/notifications");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getUnreadCount = async () => {
  const response = await apiClient.get("/api/admin/notifications/unread-count");
  return Number(response.data?.data?.unreadCount || 0);
};

export const markAsRead = async (id) => {
  const response = await apiClient.put(`/api/admin/notifications/${id}/read`);
  return response.data?.data || null;
};
