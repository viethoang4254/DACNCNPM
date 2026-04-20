import express from "express";
import { body } from "express-validator";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";
import {
	getAllSchedulesController,
	getWarningSchedulesController,
	createScheduleController,
	updateScheduleController,
	deleteScheduleController,
} from "../controllers/scheduleController.js";

const router = express.Router();

const createValidation = [
	body("tour_id")
		.isInt({ gt: 0 })
		.withMessage("tour_id must be a positive integer"),
	body("start_date")
		.matches(/^\d{4}-\d{2}-\d{2}$/)
		.withMessage("start_date must be in YYYY-MM-DD format")
		.bail()
		.isISO8601()
		.withMessage("start_date must be a valid ISO8601 date"),
];

const updateValidation = [
	body("start_date")
		.matches(/^\d{4}-\d{2}-\d{2}$/)
		.withMessage("start_date must be in YYYY-MM-DD format")
		.bail()
		.isISO8601()
		.withMessage("start_date must be a valid ISO8601 date"),
];

router.get("/", getAllSchedulesController);
router.get("/warning", getWarningSchedulesController);

router.post(
	"/",
	authMiddleware,
	adminMiddleware,
	createValidation,
	validationMiddleware,
	createScheduleController,
);

router.put(
	"/:id",
	authMiddleware,
	adminMiddleware,
	updateValidation,
	validationMiddleware,
	updateScheduleController,
);

router.delete(
	"/:id",
	authMiddleware,
	adminMiddleware,
	validationMiddleware,
	deleteScheduleController,
);

export default router;
