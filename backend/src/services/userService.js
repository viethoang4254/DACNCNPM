import bcrypt from "bcrypt";
import {
  createUser,
  deleteUserById,
  getUserByEmail,
  getUserById,
  getUserByIdWithPassword,
  getUsers,
  updateUserById,
  updateUserPassword,
  updateUserProfile,
} from "../models/userModel.js";

export const createUserService = async ({ ho_ten, email, so_dien_thoai, mat_khau, role }) => {
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
    so_dien_thoai,
    mat_khau: hashed,
    role,
  });

  return {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: user,
  };
};

export const getUsersService = async () => {
  const users = await getUsers();
  return {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: users,
  };
};

export const getUserByIdService = async ({ userId }) => {
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
    message: "User fetched successfully",
    data: user,
  };
};

export const getCurrentUserService = async ({ userId }) => {
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
    message: "Current user fetched successfully",
    data: user,
  };
};

export const updateProfileService = async ({ userId, ho_ten, so_dien_thoai }) => {
  const user = await updateUserProfile(userId, { ho_ten, so_dien_thoai });
  return {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user,
  };
};

export const updatePasswordService = async ({ userId, currentPassword, newPassword }) => {
  const user = await getUserByIdWithPassword(userId);
  if (!user) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    };
  }

  const matched = await bcrypt.compare(currentPassword, user.mat_khau);
  if (!matched) {
    return {
      statusCode: 400,
      success: false,
      message: "Current password is incorrect",
      data: {},
    };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, hashed);

  return {
    statusCode: 200,
    success: true,
    message: "Password updated successfully",
    data: {},
  };
};

export const updateUserService = async ({ actorUserId, userId, ho_ten, email, so_dien_thoai, mat_khau, role }) => {
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: {},
    };
  }

  const emailOwner = await getUserByEmail(email);
  if (emailOwner && emailOwner.id !== userId) {
    return {
      statusCode: 409,
      success: false,
      message: "Email already exists",
      data: {},
    };
  }

  if (actorUserId === userId && role !== "admin") {
    return {
      statusCode: 400,
      success: false,
      message: "Admin cannot remove own admin role",
      data: {},
    };
  }

  const updated = await updateUserById(userId, {
    ho_ten,
    email,
    so_dien_thoai,
    role,
    mat_khau: mat_khau ? await bcrypt.hash(mat_khau, 10) : undefined,
  });

  return {
    statusCode: 200,
    success: true,
    message: "User updated successfully",
    data: updated,
  };
};

export const deleteUserService = async ({ actorUserId, userId }) => {
  if (userId === actorUserId) {
    return {
      statusCode: 400,
      success: false,
      message: "Admin cannot delete current account",
      data: {},
    };
  }

  const deleted = await deleteUserById(userId);
  if (!deleted) {
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
    message: "User deleted successfully",
    data: {},
  };
};
