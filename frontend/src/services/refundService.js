import apiClient from "../utils/apiClient";

export const getRefunds = async (params = {}) => {
  const response = await apiClient.get("/api/admin/refunds", { params });
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getRefundDetail = async (id) => {
  const response = await apiClient.get(`/api/admin/refunds/${id}`);
  return response.data?.data || null;
};

export const approveRefund = async (id) => {
  const response = await apiClient.post(`/api/admin/refunds/${id}/approve`);
  return response.data?.data || null;
};

export const rejectRefund = async (id) => {
  const response = await apiClient.post(`/api/admin/refunds/${id}/reject`);
  return response.data?.data || null;
};
