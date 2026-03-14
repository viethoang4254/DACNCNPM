import express from "express";
import { uploadImageController } from "../controllers/uploadController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, upload.single("image"), uploadImageController);

export default router;
