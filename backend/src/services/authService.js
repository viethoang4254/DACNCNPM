import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

export const registerService = async ({ ho_ten, email, mat_khau, so_dien_thoai }) => {
  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      statusCode: 409,
      success: false,
      message: "Email already exists",
      data: {},
    };
  }

  const hashed = await bcrypt.hash(mat_khau, 10);
  const user = await createUser({
    ho_ten,
    email,
    mat_khau: hashed,
    so_dien_thoai,
    role: "customer",
  });

  return {
    statusCode: 201,
    success: true,
    message: "Register successful",
    data: user,
  };
};

export const loginService = async ({ email, mat_khau }) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid email or password",
      data: {},
    };
  }

  const matched = await bcrypt.compare(mat_khau, user.mat_khau);
  if (!matched) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid email or password",
      data: {},
    };
  }

  const token = buildToken(user);
  return {
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
  };
};

export const logoutService = async () => ({
  statusCode: 200,
  success: true,
  message: "Logout successful",
  data: {},
});

export const profileService = async ({ userId }) => {
  const user = await getUserById(userId);
  if (!user) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  };
};
