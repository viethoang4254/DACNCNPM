import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
	applySaleToScheduleService,
	createScheduleService,
	deleteScheduleService,
	getAllSchedulesService,
	getWarningSchedulesService,
	removeSaleFromScheduleService,
	updateScheduleService,
} from "../services/scheduleService.js";

export const getAllSchedulesController = asyncHandler(async (req, res) => {
	const result = await getAllSchedulesService();
	sendResponse(res, result);
});

export const getWarningSchedulesController = asyncHandler(async (req, res) => {
	const result = await getWarningSchedulesService();
	sendResponse(res, result);
});

export const createScheduleController = asyncHandler(async (req, res) => {
	const result = await createScheduleService({
		tour_id: req.body.tour_id,
		start_date: req.body.start_date,
	});
	return sendResponse(res, result);
});

export const updateScheduleController = asyncHandler(async (req, res) => {
	const result = await updateScheduleService({
		id: Number(req.params.id),
		start_date: req.body.start_date,
	});
	sendResponse(res, result);
});

export const deleteScheduleController = asyncHandler(async (req, res) => {
	const result = await deleteScheduleService({ id: Number(req.params.id) });
	sendResponse(res, result);
});

export const applySaleToScheduleController = asyncHandler(async (req, res) => {
	const result = await applySaleToScheduleService({ id: Number(req.params.id) });
	return sendResponse(res, result);
});

export const removeSaleFromScheduleController = asyncHandler(async (req, res) => {
	const result = await removeSaleFromScheduleService({ id: Number(req.params.id) });
	return sendResponse(res, result);
});
