import fs from "node:fs";
import path from "node:path";
import { optimizeUploadedImages, removeUploadedFiles } from "../middlewares/uploadMiddleware.js";
import {
	addTourImages,
	createTour,
	createTourSchedule,
	deleteTourById,
	deleteTourImageById,
	deleteTourScheduleById,
	getFeaturedTours,
	getLatestTours,
	getScheduleById,
	getTourById,
	getTourImageById,
	getTourImages,
	getTourSchedules,
	searchToursByCriteria,
	getSimilarToursByTourId,
	setTourCoverImageById,
	updateTour,
	updateTourImageById,
	updateTourSchedule,
} from "../models/tourModel.js";
import { getToursService } from "./tourService.js";
import { getReviewsByTourId, getTourReviewStats } from "../models/reviewModel.js";
import { getItinerariesByTourId } from "../models/itineraryModel.js";
import { getRecommendedToursByUserId } from "../models/historyModel.js";

const parsePaging = (query) => {
	const page = Number(query.page || 1);
	const limit = Number(query.limit || 10);
	return {
		page: page > 0 ? page : 1,
		limit: limit > 0 ? limit : 10,
	};
};

const normalizeTourQuery = (query) => {
	const { page, limit } = parsePaging(query);
	return {
		page,
		limit,
		keyword: query.search?.trim() || query.keyword?.trim(),
		tinh_thanh: query.tinh_thanh?.trim(),
		diem_khoi_hanh: query.diem_khoi_hanh?.trim(),
		price: query.price?.trim(),
		duration: query.duration?.trim(),
		minPrice: query.minPrice !== undefined ? Number(query.minPrice) : undefined,
		maxPrice: query.maxPrice !== undefined ? Number(query.maxPrice) : undefined,
		minDays: query.minDays !== undefined ? Number(query.minDays) : undefined,
		maxDays: query.maxDays !== undefined ? Number(query.maxDays) : undefined,
		sort: query.sort?.trim() || "newest",
	};
};

const mapUploadedPaths = (files) => {
	const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
	return files.map((file) => `${baseUrl}/uploads/${file.filename}`);
};

const normalizeImageUrls = (body) => {
	const imageUrls = [];
	const pushUrl = (value) => {
		if (typeof value !== "string") return;
		const trimmed = value.trim();
		if (trimmed) {
			imageUrls.push(trimmed);
		}
	};

	if (!body) return imageUrls;

	if (Array.isArray(body.image_urls)) {
		body.image_urls.forEach(pushUrl);
	} else if (typeof body.image_urls === "string") {
		const raw = body.image_urls.trim();
		if (raw.startsWith("[")) {
			try {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					parsed.forEach(pushUrl);
				} else {
					pushUrl(raw);
				}
			} catch {
				pushUrl(raw);
			}
		} else {
			pushUrl(raw);
		}
	}

	pushUrl(body.image_url);
	return imageUrls;
};

export const getToursControllerService = async ({ query }) => {
	const normalizedQuery = normalizeTourQuery(query);
	const { tours, total } = await getToursService(normalizedQuery);

	return {
		type: "raw",
		statusCode: 200,
		payload: {
			success: true,
			message: "Tours fetched successfully",
			tours,
			total,
			page: normalizedQuery.page,
			limit: normalizedQuery.limit,
			data: tours,
			pagination: {
				page: normalizedQuery.page,
				limit: normalizedQuery.limit,
				total,
				totalPages: Math.ceil(total / normalizedQuery.limit) || 1,
			},
		},
	};
};

export const getTourByIdControllerService = async ({ id }) => {
	const tour = await getTourById(id);
	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const [images, schedules, itineraries] = await Promise.all([
		getTourImages(id),
		getTourSchedules(id),
		getItinerariesByTourId(id),
	]);

	return {
		statusCode: 200,
		success: true,
		message: "Tour fetched successfully",
		data: {
			...tour,
			images,
			schedules,
			itineraries,
		},
	};
};

export const getTourItinerariesControllerService = async ({ tourId }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const itineraries = await getItinerariesByTourId(tourId);

	return {
		statusCode: 200,
		success: true,
		message: "Tour itineraries fetched successfully",
		data: itineraries,
	};
};

export const createTourControllerService = async ({ payload }) => {
	const tour = await createTour(payload);
	return {
		statusCode: 201,
		success: true,
		message: "Tour created successfully",
		data: tour,
	};
};

export const updateTourControllerService = async ({ id, payload }) => {
	const tour = await getTourById(id);
	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const updated = await updateTour(id, payload);
	return {
		statusCode: 200,
		success: true,
		message: "Tour updated successfully",
		data: updated,
	};
};

export const deleteTourControllerService = async ({ id }) => {
	const deleted = await deleteTourById(id);
	if (!deleted) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	return {
		statusCode: 200,
		success: true,
		message: "Tour deleted successfully",
		data: {},
	};
};

export const searchToursControllerService = async ({ query }) => {
	const destination = query.destination?.trim() || "";
	const date = query.date?.trim() || "";
	const guests = query.guests !== undefined ? Number(query.guests) : undefined;
	const page = Math.max(1, Number(query.page || 1));
	const limit = Math.max(1, Number(query.limit || 8));

	if (destination || date || guests !== undefined) {
		const result = await searchToursByCriteria({ destination, date, guests });
		const total = result.tours.length;
		const offset = (page - 1) * limit;
		const pagedTours = result.tours.slice(offset, offset + limit);

		return {
			type: "raw",
			statusCode: 200,
			payload: {
				success: true,
				message: result.message,
				tours: pagedTours,
				total,
				page,
				limit,
				data: pagedTours,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit) || 1,
				},
				usedNearestDate: result.usedNearestDate,
			},
		};
	}

	return getToursControllerService({
		query: {
			...query,
			keyword: query.keyword || query.q,
		},
	});
};

export const getFeaturedToursControllerService = async ({ limit }) => {
	const tours = await getFeaturedTours(limit);
	return {
		statusCode: 200,
		success: true,
		message: "Featured tours fetched successfully",
		data: tours,
	};
};

export const getLatestToursControllerService = async ({ limit }) => {
	const tours = await getLatestTours(limit);
	return {
		statusCode: 200,
		success: true,
		message: "Latest tours fetched successfully",
		data: tours,
	};
};

export const getTourReviewsControllerService = async ({ tourId }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const [reviews, stats] = await Promise.all([
		getReviewsByTourId(tourId, { includeHidden: false }),
		getTourReviewStats(tourId),
	]);

	return {
		statusCode: 200,
		success: true,
		message: "Tour reviews fetched successfully",
		data: {
			reviews,
			stats,
		},
	};
};

export const getSimilarToursControllerService = async ({ tourId, limit }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const tours = await getSimilarToursByTourId(tourId, limit);

	return {
		statusCode: 200,
		success: true,
		message: "Similar tours fetched successfully",
		data: tours,
	};
};

export const getRecommendToursControllerService = async ({ userId, limit }) => {
	const tours = await getRecommendedToursByUserId(userId, limit);

	return {
		statusCode: 200,
		success: true,
		message: "Recommended tours fetched successfully",
		data: tours,
	};
};

export const addTourImagesControllerService = async ({ tourId, files, body }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const optimizedFiles = await optimizeUploadedImages(files || []);
	const uploadedImageUrls = mapUploadedPaths(optimizedFiles);
	const manualImageUrls = normalizeImageUrls(body);
	const imageUrls = [...uploadedImageUrls, ...manualImageUrls];

	if (imageUrls.length === 0) {
		return {
			statusCode: 400,
			success: false,
			message: "At least one image file or image URL is required",
			data: {},
		};
	}

	try {
		await addTourImages(tourId, imageUrls);
	} catch (error) {
		await removeUploadedFiles(optimizedFiles);
		throw error;
	}

	return {
		statusCode: 201,
		success: true,
		message: "Tour images uploaded successfully",
		data: await getTourImages(tourId),
	};
};

export const updateTourImageControllerService = async ({ imageId, file, body }) => {
	const image = await getTourImageById(imageId);

	if (!image) {
		return {
			statusCode: 404,
			success: false,
			message: "Image not found",
			data: {},
		};
	}

	const optimizedFiles = file ? await optimizeUploadedImages([file]) : [];
	const manualUrl = body?.image_url?.trim();
	const uploadedUrl = optimizedFiles.length > 0 ? mapUploadedPaths(optimizedFiles)[0] : "";
	const nextImageUrl = uploadedUrl || manualUrl;

	if (!nextImageUrl) {
		await removeUploadedFiles(optimizedFiles);
		return {
			statusCode: 400,
			success: false,
			message: "image_url or image file is required",
			data: {},
		};
	}

	let updated;

	try {
		updated = await updateTourImageById(imageId, nextImageUrl);
	} catch (error) {
		await removeUploadedFiles(optimizedFiles);
		throw error;
	}

	if (image.image_url && image.image_url.includes("/uploads/") && image.image_url !== nextImageUrl) {
		const oldFileName = image.image_url.split("/uploads/")[1];
		const oldFilePath = path.resolve("uploads", oldFileName);
		if (fs.existsSync(oldFilePath)) {
			fs.unlinkSync(oldFilePath);
		}
	}

	return {
		statusCode: 200,
		success: true,
		message: "Image updated successfully",
		data: updated,
	};
};

export const getTourImagesControllerService = async ({ tourId }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	return {
		statusCode: 200,
		success: true,
		message: "Tour images fetched successfully",
		data: await getTourImages(tourId),
	};
};

export const deleteTourImageControllerService = async ({ imageId }) => {
	const image = await getTourImageById(imageId);

	if (!image) {
		return {
			statusCode: 404,
			success: false,
			message: "Image not found",
			data: {},
		};
	}

	const deleted = await deleteTourImageById(imageId);
	if (deleted && image.image_url.includes("/uploads/")) {
		const fileName = image.image_url.split("/uploads/")[1];
		const filePath = path.resolve("uploads", fileName);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}

	return {
		statusCode: 200,
		success: true,
		message: "Image deleted successfully",
		data: {},
	};
};

export const setTourCoverImageControllerService = async ({ imageId }) => {
	const image = await getTourImageById(imageId);

	if (!image) {
		return {
			statusCode: 404,
			success: false,
			message: "Image not found",
			data: {},
		};
	}

	await setTourCoverImageById(imageId);

	return {
		statusCode: 200,
		success: true,
		message: "Cover image updated successfully",
		data: await getTourImages(image.tour_id),
	};
};

export const getTourSchedulesControllerService = async ({ tourId }) => {
	const tour = await getTourById(tourId);

	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	return {
		statusCode: 200,
		success: true,
		message: "Schedules fetched successfully",
		data: await getTourSchedules(tourId),
	};
};

export const createTourScheduleControllerService = async ({ tourId, start_date, available_slots }) => {
	const tour = await getTourById(tourId);
	if (!tour) {
		return {
			statusCode: 404,
			success: false,
			message: "Tour not found",
			data: {},
		};
	}

	const schedule = await createTourSchedule({
		tour_id: tourId,
		start_date,
		available_slots,
	});

	return {
		statusCode: 201,
		success: true,
		message: "Schedule created successfully",
		data: schedule,
	};
};

export const updateTourScheduleControllerService = async ({ id, payload }) => {
	const existing = await getScheduleById(id);
	if (!existing) {
		return {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		};
	}

	const schedule = await updateTourSchedule(id, payload);
	return {
		statusCode: 200,
		success: true,
		message: "Schedule updated successfully",
		data: schedule,
	};
};

export const deleteTourScheduleControllerService = async ({ id }) => {
	const deleted = await deleteTourScheduleById(id);

	if (!deleted) {
		return {
			statusCode: 404,
			success: false,
			message: "Schedule not found",
			data: {},
		};
	}

	return {
		statusCode: 200,
		success: true,
		message: "Schedule deleted successfully",
		data: {},
	};
};
