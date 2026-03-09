import express from "express";
import {
  getAdminBookingsController,
  getRevenueController,
  getStatsController,
} from "../controllers/adminController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStatsController);
router.get("/revenue", getRevenueController);
router.get("/bookings", getAdminBookingsController);

export default router;
