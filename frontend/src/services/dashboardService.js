import apiClient from "../utils/apiClient";

export const getDashboardSummary = async () => {
  const response = await apiClient.get("/api/dashboard/summary");
  return response.data?.data || null;
};

export const getDashboardBookingStatus = async () => {
  const response = await apiClient.get("/api/dashboard/booking-status");
  return response.data?.data || null;
};

export const getDashboardRevenueChart = async () => {
  const response = await apiClient.get("/api/dashboard/revenue-chart");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getDashboardAlerts = async () => {
  const response = await apiClient.get("/api/dashboard/alerts");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};
