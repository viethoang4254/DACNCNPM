import express from "express";
import {
  getDashboardAlertsController,
  getDashboardBookingStatusController,
  getDashboardRevenueChartController,
  getDashboardSummaryController,
} from "../controllers/dashboardController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/summary", getDashboardSummaryController);
router.get("/booking-status", getDashboardBookingStatusController);
router.get("/revenue-chart", getDashboardRevenueChartController);
router.get("/alerts", getDashboardAlertsController);

export default router;
