import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { loginService, logoutService, profileService, registerService } from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerService(req.body);
  return sendResponse(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginService(req.body);
  return sendResponse(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  const result = await logoutService();
  return sendResponse(res, result);
});

export const profile = asyncHandler(async (req, res) => {
  const result = await profileService({ userId: req.user.id });
  return sendResponse(res, result);
});
