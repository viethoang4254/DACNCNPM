import express from "express";
import { body } from "express-validator";
import { login, logout, profile, register } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("ho_ten").trim().notEmpty().withMessage("ho_ten is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("mat_khau").isLength({ min: 6 }).withMessage("mat_khau must be at least 6 characters"),
    body("so_dien_thoai").trim().notEmpty().withMessage("so_dien_thoai is required"),
  ],
  validationMiddleware,
  register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("mat_khau").notEmpty().withMessage("mat_khau is required"),
  ],
  validationMiddleware,
  login
);

router.get("/profile", authMiddleware, profile);
router.post("/logout", authMiddleware, logout);

export default router;
