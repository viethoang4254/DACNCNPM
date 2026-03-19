import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { createUser, getUserByEmail, getUserById } from "../models/userModel.js";

const buildToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const register = asyncHandler(async (req, res) => {
  const { ho_ten, email, mat_khau, so_dien_thoai } = req.body;

  const existing = await getUserByEmail(email);
  if (existing) {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Email already exists",
      data: {},
    });
  }

  const hashed = await bcrypt.hash(mat_khau, 10);
  const user = await createUser({
    ho_ten,
    email,
    mat_khau: hashed,
    so_dien_thoai,
    role: "customer",
  });

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Register successful",
    data: user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, mat_khau } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid email or password",
      data: {},
    });
  }

  const matched = await bcrypt.compare(mat_khau, user.mat_khau);
  if (!matched) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid email or password",
      data: {},
    });
  }

  const token = buildToken(user);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        role: user.role,
        created_at: user.created_at,
      },
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logout successful",
    data: {},
  });
});

export const profile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
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
    message: "Profile fetched successfully",
    data: user,
  });
});
