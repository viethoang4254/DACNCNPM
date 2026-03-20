import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
	getAllSchedules,
	getWarningSchedules,
	getScheduleById,
	createSchedule,
	updateSchedule,
	deleteScheduleById,
	applySaleToScheduleById,
	removeSaleFromScheduleById,
} from "../models/scheduleModel.js";

export const getAllSchedulesController = asyncHandler(async (req, res) => {
	const schedules = await getAllSchedules();
	sendResponse(res, { data: schedules });
});

export const getWarningSchedulesController = asyncHandler(async (req, res) => {
	const schedules = await getWarningSchedules();
	sendResponse(res, { data: schedules });
});

export const createScheduleController = asyncHandler(async (req, res) => {
	const { tour_id, start_date } = req.body;

	try {
		const schedule = await createSchedule({
			tour_id: Number(tour_id),
			start_date,
		});

		return sendResponse(res, {
			statusCode: 201,
			message: "Schedule created successfully",
			data: schedule,
		});
	} catch (error) {
		if (error.code === "ER_DUP_ENTRY") {
			return sendResponse(res, {
				statusCode: 400,
				success: false,
				message: "Tour này đã có lịch khởi hành vào ngày đã chọn.",
				data: {},
			});
		}

		if (error.statusCode) {
			throw error;
		}

		return sendResponse(res, {
			statusCode: 500,
			success: false,
			message: "Không thể tạo lịch khởi hành. Vui lòng thử lại.",
			data: {},
		});
	}
});

export const updateScheduleController = asyncHandler(async (req, res) => {
	const id = Number(req.params.id);
	const { start_date } = req.body;

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

export const applySaleToScheduleController = asyncHandler(async (req, res) => {
	const id = Number(req.params.id);
	const existing = await getScheduleById(id);

	if (!existing) {
		return sendResponse(res, {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		});
	}

	await applySaleToScheduleById(id, 20);
	const updated = await getScheduleById(id);

	return sendResponse(res, {
		message: "Sale applied successfully",
		data: updated,
	});
});

export const removeSaleFromScheduleController = asyncHandler(async (req, res) => {
	const id = Number(req.params.id);
	const existing = await getScheduleById(id);

	if (!existing) {
		return sendResponse(res, {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		});
	}

	await removeSaleFromScheduleById(id);
	const updated = await getScheduleById(id);

	return sendResponse(res, {
		message: "Sale removed successfully",
		data: updated,
	});
});
