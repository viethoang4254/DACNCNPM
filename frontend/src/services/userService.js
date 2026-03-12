import apiClient from "../utils/apiClient";

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