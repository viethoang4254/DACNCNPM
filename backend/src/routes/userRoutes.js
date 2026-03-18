import express from "express";
import { body, param } from "express-validator";
import {
  createUserController,
  deleteUserController,
  getCurrentUserController,
  getUserByIdController,
  getUsersController,
  updateUserController,
  updatePasswordController,
  updateProfileController,
} from "../controllers/userController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getCurrentUserController);

router.put(
  "/profile",
  [
    body("ho_ten").trim().notEmpty().withMessage("ho_ten is required"),
    body("so_dien_thoai").trim().notEmpty().withMessage("so_dien_thoai is required"),
  ],
  validationMiddleware,
  updateProfileController
);

router.put(
  "/change-password",
  [
    body("oldPassword").notEmpty().withMessage("oldPassword is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("newPassword must be at least 6 characters"),
  ],
  validationMiddleware,
  updatePasswordController
);

router.put(
  "/password",
  [
    body("currentPassword").notEmpty().withMessage("currentPassword is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("newPassword must be at least 6 characters"),
  ],
  validationMiddleware,
  updatePasswordController
);

router.use(adminMiddleware);

router.get("/", getUsersController);

router.post(
  "/",
  [
    body("ho_ten").trim().notEmpty().withMessage("ho_ten is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("so_dien_thoai").trim().notEmpty().withMessage("so_dien_thoai is required"),
    body("mat_khau").isLength({ min: 6 }).withMessage("mat_khau must be at least 6 characters"),
    body("role").isIn(["admin", "customer"]).withMessage("role must be admin or customer"),
  ],
  validationMiddleware,
  createUserController
);

router.get(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getUserByIdController
);

router.put(
  "/:id",
  [
    param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"),
    body("ho_ten").trim().notEmpty().withMessage("ho_ten is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("so_dien_thoai").trim().notEmpty().withMessage("so_dien_thoai is required"),
    body("mat_khau").optional({ values: "falsy" }).isLength({ min: 6 }).withMessage("mat_khau must be at least 6 characters"),
    body("role").isIn(["admin", "customer"]).withMessage("role must be admin or customer"),
  ],
  validationMiddleware,
  updateUserController
);

router.delete(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteUserController
);

export default router;
