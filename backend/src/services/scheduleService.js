import {
  applySaleToScheduleById,
  createSchedule,
  deleteScheduleById,
  getAllSchedules,
  getScheduleById,
  getWarningSchedules,
  removeSaleFromScheduleById,
  updateSchedule,
} from "../models/scheduleModel.js";
import { refreshAllSchedulesOccupancyAndStatus } from "./scheduleStatusService.js";

export const getAllSchedulesService = async () => {
  await refreshAllSchedulesOccupancyAndStatus();
  const schedules = await getAllSchedules();
  return { data: schedules };
};

export const getWarningSchedulesService = async () => {
  await refreshAllSchedulesOccupancyAndStatus();
  const schedules = await getWarningSchedules();
  return { data: schedules };
};

export const createScheduleService = async ({ tour_id, start_date }) => {
  try {
    const schedule = await createSchedule({
      tour_id: Number(tour_id),
      start_date,
    });

    return {
      statusCode: 201,
      message: "Schedule created successfully",
      data: schedule,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return {
        statusCode: 400,
        success: false,
        message: "Tour này đã có lịch khởi hành vào ngày đã chọn.",
        data: {},
      };
    }

    if (error.statusCode) {
      throw error;
    }

    return {
      statusCode: 500,
      success: false,
      message: "Không thể tạo lịch khởi hành. Vui lòng thử lại.",
      data: {},
    };
  }
};

export const updateScheduleService = async ({ id, start_date }) => {
  const existing = await getScheduleById(id);
  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    };
  }

  const updated = await updateSchedule(id, { start_date });
  return { data: updated };
};

export const deleteScheduleService = async ({ id }) => {
  const deleted = await deleteScheduleById(id);
  if (!deleted) {
    return {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    };
  }
  return { message: "Schedule deleted successfully", data: {} };
};

export const applySaleToScheduleService = async ({ id }) => {
  const existing = await getScheduleById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    };
  }

  await applySaleToScheduleById(id, 20);
  const updated = await getScheduleById(id);

  return {
    message: "Sale applied successfully",
    data: updated,
  };
};

export const removeSaleFromScheduleService = async ({ id }) => {
  const existing = await getScheduleById(id);

  if (!existing) {
    return {
      statusCode: 404,
      success: false,
      message: "Schedule not found",
      data: {},
    };
  }

  await removeSaleFromScheduleById(id);
  const updated = await getScheduleById(id);

  return {
    message: "Sale removed successfully",
    data: updated,
  };
};
