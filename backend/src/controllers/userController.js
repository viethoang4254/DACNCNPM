import bcrypt from "bcrypt";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  deleteUserById,
  getUserById,
  getUserByIdWithPassword,
  getUsers,
  updateUserPassword,
  updateUserProfile,
} from "../models/userModel.js";

export const getUsersController = asyncHandler(async (req, res) => {
  const users = await getUsers();
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
});

export const getUserByIdController = asyncHandler(async (req, res) => {
  const user = await getUserById(Number(req.params.id));
  if (!user) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const { ho_ten, so_dien_thoai } = req.body;
  const user = await updateUserProfile(req.user.id, { ho_ten, so_dien_thoai });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

export const updatePasswordController = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await getUserByIdWithPassword(req.user.id);

  if (!user) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    });
  }

  const matched = await bcrypt.compare(currentPassword, user.mat_khau);
  if (!matched) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Current password is incorrect",
      data: {},
    });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(req.user.id, hashed);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated successfully",
    data: {},
  });
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (userId === req.user.id) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Admin cannot delete current account",
      data: {},
    });
  }

  const deleted = await deleteUserById(userId);
  if (!deleted) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: {},
  });
});
