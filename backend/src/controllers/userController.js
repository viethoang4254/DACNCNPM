import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createUserService,
  deleteUserService,
  getCurrentUserService,
  getUserByIdService,
  getUsersService,
  updatePasswordService,
  updateProfileService,
  updateUserService,
} from "../services/userService.js";

export const createUserController = asyncHandler(async (req, res) => {
  const result = await createUserService(req.body);
  return sendResponse(res, result);
});

export const getUsersController = asyncHandler(async (req, res) => {
  const result = await getUsersService();
  return sendResponse(res, result);
});

export const getUserByIdController = asyncHandler(async (req, res) => {
  const result = await getUserByIdService({ userId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const getCurrentUserController = asyncHandler(async (req, res) => {
  const result = await getCurrentUserService({ userId: req.user.id });
  return sendResponse(res, result);
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const result = await updateProfileService({
    userId: req.user.id,
    ho_ten: req.body.ho_ten,
    so_dien_thoai: req.body.so_dien_thoai,
  });
  return sendResponse(res, result);
});

export const updatePasswordController = asyncHandler(async (req, res) => {
  const result = await updatePasswordService({
    userId: req.user.id,
    currentPassword: req.body.currentPassword || req.body.oldPassword,
    newPassword: req.body.newPassword,
  });
  return sendResponse(res, result);
});

export const updateUserController = asyncHandler(async (req, res) => {
  const result = await updateUserService({
    actorUserId: req.user.id,
    userId: Number(req.params.id),
    ho_ten: req.body.ho_ten,
    email: req.body.email,
    so_dien_thoai: req.body.so_dien_thoai,
    mat_khau: req.body.mat_khau,
    role: req.body.role,
  });
  return sendResponse(res, result);
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const result = await deleteUserService({
    actorUserId: req.user.id,
    userId: Number(req.params.id),
  });
  return sendResponse(res, result);
});
