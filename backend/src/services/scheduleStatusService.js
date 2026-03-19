import pool from "../config/db.js";

const DEFAULT_MIN_REQUIRED_RATIO = 0.5;

const startOfDay = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).slice(0, 10);
  const parts = text.split("-").map(Number);
  if (parts.length !== 3 || parts.some((item) => !Number.isInteger(item))) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return null;
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export const getScheduleDaysLeft = (startDate) => {
  const start = startOfDay(startDate);
  if (!start) return null;

  const today = startOfDay(new Date());
  const diffMs = start.getTime() - today.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

export const getSchedulePercentRatio = (bookedSlots, maxSlots) => {
  const max = Number(maxSlots || 0);
  const booked = Number(bookedSlots || 0);
  if (max <= 0) return 0;

  const ratio = booked / max;
  return Math.max(0, Math.min(1, ratio));
};

export const getSchedulePercent = (bookedSlots, maxSlots) =>
  Math.floor(getSchedulePercentRatio(bookedSlots, maxSlots) * 100);

export const updateScheduleStatus = (schedule) => {
  const maxSlots = Number(schedule?.max_slots || 0);
  const bookedSlots = Number(schedule?.booked_slots || 0);
  const minRequiredRatio = Number(
    schedule?.min_required_ratio ?? DEFAULT_MIN_REQUIRED_RATIO,
  );

  const daysLeft = getScheduleDaysLeft(schedule?.start_date);
  const percentRatio = getSchedulePercentRatio(bookedSlots, maxSlots);

  if (daysLeft !== null && daysLeft < 0) return "completed";
  if (bookedSlots >= maxSlots && maxSlots > 0) return "full";
  if (percentRatio >= minRequiredRatio) return "guaranteed";
  if (daysLeft !== null && daysLeft <= 2 && percentRatio < minRequiredRatio) {
    return "cancelled";
  }
  if (daysLeft !== null && daysLeft <= 7 && percentRatio < minRequiredRatio) {
    return "warning";
  }
  return "open";
};

export const getScheduleAlertLevel = (schedule) => {
  const daysLeft = getScheduleDaysLeft(schedule?.start_date);
  const minRequiredRatio = Number(
    schedule?.min_required_ratio ?? DEFAULT_MIN_REQUIRED_RATIO,
  );
  const ratio = getSchedulePercentRatio(schedule?.booked_slots, schedule?.max_slots);

  if (daysLeft !== null && daysLeft < 0) {
    return { alert_level: "stable", alert_label: "Ổn định" };
  }

  if (daysLeft !== null && daysLeft <= 2 && ratio < minRequiredRatio) {
    return { alert_level: "critical", alert_label: "Có lịch sắp hủy" };
  }

  if (daysLeft !== null && daysLeft <= 7 && ratio < minRequiredRatio) {
    return { alert_level: "warning", alert_label: "Có lịch thiếu khách" };
  }

  return { alert_level: "stable", alert_label: "Ổn định" };
};

export const withScheduleComputedFields = (schedule) => {
  const maxSlots = Number(schedule?.max_slots || 0);
  const bookedSlots = Number(schedule?.booked_slots || 0);
  const daysLeft = getScheduleDaysLeft(schedule?.start_date);
  const percent = getSchedulePercent(bookedSlots, maxSlots);
  const status = updateScheduleStatus({
    ...schedule,
    max_slots: maxSlots,
    booked_slots: bookedSlots,
  });

  return {
    ...schedule,
    max_slots: maxSlots,
    booked_slots: bookedSlots,
    available_slots: Math.max(maxSlots - bookedSlots, 0),
    days_left: daysLeft,
    percent,
    status,
    ...getScheduleAlertLevel({
      ...schedule,
      max_slots: maxSlots,
      booked_slots: bookedSlots,
    }),
  };
};

const selectScheduleSnapshots = async (connection, scheduleIds = null) => {
  const hasFilter = Array.isArray(scheduleIds) && scheduleIds.length > 0;
  const placeholders = hasFilter ? scheduleIds.map(() => "?").join(",") : "";

  const [rows] = await connection.execute(
    `SELECT ts.id,
            ts.start_date,
            COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
            ts.booked_slots,
            ts.available_slots,
            ts.status,
            ts.min_required_ratio,
            COALESCE(SUM(CASE WHEN b.trang_thai = 'confirmed' THEN b.so_nguoi ELSE 0 END), 0) AS booked_slots_actual
     FROM tour_schedules ts
     INNER JOIN tours t ON t.id = ts.tour_id
     LEFT JOIN bookings b ON b.schedule_id = ts.id
     ${hasFilter ? `WHERE ts.id IN (${placeholders})` : ""}
     GROUP BY ts.id, ts.start_date, ts.max_slots, t.so_nguoi_toi_da, ts.booked_slots, ts.available_slots, ts.status, ts.min_required_ratio`,
    hasFilter ? scheduleIds : [],
  );

  return rows;
};

const persistScheduleSnapshot = async (connection, snapshot) => {
  const maxSlots = Number(snapshot.max_slots || 0);
  const bookedSlots = Math.min(
    maxSlots,
    Math.max(0, Number(snapshot.booked_slots_actual || 0)),
  );

  const nextStatus = updateScheduleStatus({
    ...snapshot,
    max_slots: maxSlots,
    booked_slots: bookedSlots,
  });

  const nextAvailable = Math.max(maxSlots - bookedSlots, 0);

  await connection.execute(
    "UPDATE tour_schedules SET max_slots = ?, booked_slots = ?, available_slots = ?, status = ? WHERE id = ?",
    [maxSlots, bookedSlots, nextAvailable, nextStatus, snapshot.id],
  );
};

export const refreshSchedulesOccupancyAndStatus = async (
  scheduleIds,
  connection = pool,
) => {
  const normalizedIds = [...new Set((scheduleIds || []).map(Number).filter((id) => id > 0))];
  if (normalizedIds.length === 0) return 0;

  const snapshots = await selectScheduleSnapshots(connection, normalizedIds);
  for (const snapshot of snapshots) {
    await persistScheduleSnapshot(connection, snapshot);
  }
  return snapshots.length;
};

export const refreshScheduleOccupancyAndStatusById = async (
  scheduleId,
  connection = pool,
) => {
  const id = Number(scheduleId);
  if (!id) return null;

  const snapshots = await selectScheduleSnapshots(connection, [id]);
  const target = snapshots[0];
  if (!target) return null;

  await persistScheduleSnapshot(connection, target);
  const [rows] = await connection.execute(
    "SELECT id, start_date, max_slots, booked_slots, available_slots, status, min_required_ratio FROM tour_schedules WHERE id = ? LIMIT 1",
    [id],
  );

  return rows[0] || null;
};

export const refreshAllSchedulesOccupancyAndStatus = async (
  connection = pool,
) => {
  const snapshots = await selectScheduleSnapshots(connection);
  for (const snapshot of snapshots) {
    await persistScheduleSnapshot(connection, snapshot);
  }
  return snapshots.length;
};
