import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
	getAllSchedules,
	getScheduleById,
	createSchedule,
	updateSchedule,
	deleteScheduleById,
} from "../models/scheduleModel.js";

export const getAllSchedulesController = asyncHandler(async (req, res) => {
	const schedules = await getAllSchedules();
	sendResponse(res, { data: schedules });
});

export const createScheduleController = asyncHandler(async (req, res) => {
	const { tour_id, start_date } = req.body;
	const schedule = await createSchedule({
		tour_id: Number(tour_id),
		start_date,
	});
	sendResponse(res, {
		statusCode: 201,
		message: "Schedule created successfully",
		data: schedule,
	});
});

export const updateScheduleController = asyncHandler(async (req, res) => {
	const id = Number(req.params.id);
	const { start_date, available_slots } = req.body;

	const existing = await getScheduleById(id);
	if (!existing) {
		return sendResponse(res, {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		});
	}

	const updated = await updateSchedule(id, {
		start_date,
		available_slots: Number(available_slots),
	});
	sendResponse(res, { data: updated });
});

export const deleteScheduleController = asyncHandler(async (req, res) => {
	const id = Number(req.params.id);
	const deleted = await deleteScheduleById(id);
	if (!deleted) {
		return sendResponse(res, {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		});
	}
	sendResponse(res, { message: "Schedule deleted successfully", data: {} });
});
