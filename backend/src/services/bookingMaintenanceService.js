import {
  expirePendingBookings,
  getExpiredPendingScheduleIds,
} from "../models/bookingModel.js";
import { refreshSchedulesOccupancyAndStatus } from "./scheduleStatusService.js";

export const expirePendingBookingsAndSyncSchedules = async (expireMinutes) => {
  const impactedScheduleIds = await getExpiredPendingScheduleIds(expireMinutes);
  const affectedRows = await expirePendingBookings(expireMinutes);

  if (affectedRows > 0 && impactedScheduleIds.length > 0) {
    await refreshSchedulesOccupancyAndStatus(impactedScheduleIds);
  }

  return affectedRows;
};
