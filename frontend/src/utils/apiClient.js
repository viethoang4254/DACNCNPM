import axios from "axios";
import { clearAuthSession, getAuthToken } from "./authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
