import pool from "../config/db.js";

const DEFAULT_MIN_REQUIRED_RATIO = 0.5;
const SYSTEM_CANCEL_DAYS_THRESHOLD = 2;
const SUGGESTED_SALE_DAYS_THRESHOLD = 7;
const SUGGESTED_SALE_FILL_RATE_THRESHOLD = 0.5;
const DEFAULT_SUGGESTED_DISCOUNT_PERCENT = 20;
const AUTO_SALE_ENABLED =
  String(process.env.AUTO_SALE_ENABLED || "true").toLowerCase() !== "false";

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

export const getScheduleSaleSuggestion = (schedule) => {
  const daysLeft = getScheduleDaysLeft(schedule?.start_date);
  const fillRate = getSchedulePercentRatio(
    schedule?.booked_slots,
    schedule?.max_slots,
  );

  const suggested_sale =
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= SUGGESTED_SALE_DAYS_THRESHOLD &&
    fillRate < SUGGESTED_SALE_FILL_RATE_THRESHOLD;

  return {
    suggested_sale,
    suggested_discount_percent: suggested_sale
      ? DEFAULT_SUGGESTED_DISCOUNT_PERCENT
      : 0,
  };
};

export const applyAutoSale = (schedule, { enabled = AUTO_SALE_ENABLED } = {}) => {
  const normalized = {
    ...schedule,
    is_on_sale: Boolean(schedule?.is_on_sale),
    discount_percent: Number(schedule?.discount_percent || 0),
    auto_sale_applied: Boolean(schedule?.auto_sale_applied),
  };

  if (!enabled) return normalized;

  const daysLeft = getScheduleDaysLeft(normalized.start_date);
  const fillRate = getSchedulePercentRatio(
    normalized.booked_slots,
    normalized.max_slots,
  );

  const shouldAutoApply =
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= SUGGESTED_SALE_DAYS_THRESHOLD &&
    fillRate < SUGGESTED_SALE_FILL_RATE_THRESHOLD &&
    !normalized.is_on_sale;

  if (!shouldAutoApply) return normalized;

  return {
    ...normalized,
    is_on_sale: true,
    discount_percent: DEFAULT_SUGGESTED_DISCOUNT_PERCENT,
    auto_sale_applied: true,
  };
};

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
  if (
    daysLeft !== null &&
    daysLeft <= SYSTEM_CANCEL_DAYS_THRESHOLD &&
    percentRatio < minRequiredRatio
  ) {
    return "cancelled";
  }
  return "warning";
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
  const discountPercent = Number(schedule?.discount_percent || 0);
  const autoSaleApplied = Boolean(schedule?.auto_sale_applied);
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
    is_on_sale: Boolean(schedule?.is_on_sale),
    discount_percent: discountPercent,
    auto_sale_applied: autoSaleApplied,
    available_slots: Math.max(maxSlots - bookedSlots, 0),
    days_left: daysLeft,
    percent,
    status,
    ...getScheduleSaleSuggestion({
      ...schedule,
      max_slots: maxSlots,
      booked_slots: bookedSlots,
    }),
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
           ts.is_on_sale,
           ts.discount_percent,
           ts.auto_sale_applied,
            COALESCE(SUM(CASE WHEN b.trang_thai = 'confirmed' THEN b.so_nguoi ELSE 0 END), 0) AS booked_slots_actual
     FROM tour_schedules ts
     INNER JOIN tours t ON t.id = ts.tour_id
     LEFT JOIN bookings b ON b.schedule_id = ts.id
     ${hasFilter ? `WHERE ts.id IN (${placeholders})` : ""}
         GROUP BY ts.id, ts.start_date, ts.max_slots, t.so_nguoi_toi_da, ts.booked_slots, ts.available_slots, ts.status, ts.min_required_ratio, ts.is_on_sale, ts.discount_percent, ts.auto_sale_applied`,
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
  const saleState = applyAutoSale({
    ...snapshot,
    max_slots: maxSlots,
    booked_slots: bookedSlots,
  });

  const nextAvailable = Math.max(maxSlots - bookedSlots, 0);

  await connection.execute(
    "UPDATE tour_schedules SET max_slots = ?, booked_slots = ?, available_slots = ?, status = ?, is_on_sale = ?, discount_percent = ?, auto_sale_applied = ? WHERE id = ?",
    [
      maxSlots,
      bookedSlots,
      nextAvailable,
      nextStatus,
      Boolean(saleState.is_on_sale),
      Number(saleState.discount_percent || 0),
      Boolean(saleState.auto_sale_applied),
      snapshot.id,
    ],
  );

  if (nextStatus === "cancelled") {
    await cancelAllBookingsForCancelledSchedule(connection, snapshot.id);
  }
};

const cancelAllBookingsForCancelledSchedule = async (connection, scheduleId) => {
  const now = new Date();

  await connection.execute(
    `UPDATE bookings
     SET trang_thai = 'cancelled',
         cancelled_at = ?,
         refund_amount = tong_tien,
         refund_status = 'processed',
         cancelled_by = 'system'
     WHERE schedule_id = ?
       AND trang_thai IN ('pending', 'confirmed')`,
    [now, scheduleId],
  );

  await connection.execute(
    `UPDATE payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     SET p.status = 'refunded'
     WHERE b.schedule_id = ?
       AND b.trang_thai = 'cancelled'
       AND p.status = 'paid'`,
    [scheduleId],
  );
};

const loadScheduleSnapshotsByFilter = async (connection, { tourId, scheduleId } = {}) => {
  const hasTourId = Number.isInteger(Number(tourId)) && Number(tourId) > 0;
  const hasScheduleId = Number.isInteger(Number(scheduleId)) && Number(scheduleId) > 0;

  const where = [];
  const params = [];

  if (hasTourId) {
    where.push("ts.tour_id = ?");
    params.push(Number(tourId));
  }

  if (hasScheduleId) {
    where.push("ts.id = ?");
    params.push(Number(scheduleId));
  }

  const [rows] = await connection.execute(
    `SELECT ts.id,
            ts.tour_id,
            ts.start_date,
            COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
            ts.booked_slots,
            ts.min_required_ratio,
            ts.is_on_sale,
            ts.discount_percent,
            ts.auto_sale_applied,
            COALESCE(SUM(CASE WHEN b.trang_thai = 'confirmed' THEN b.so_nguoi ELSE 0 END), 0) AS booked_slots_actual
     FROM tour_schedules ts
     INNER JOIN tours t ON t.id = ts.tour_id
     LEFT JOIN bookings b ON b.schedule_id = ts.id
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
     GROUP BY ts.id, ts.tour_id, ts.start_date, ts.max_slots, t.so_nguoi_toi_da, ts.booked_slots, ts.min_required_ratio, ts.is_on_sale, ts.discount_percent, ts.auto_sale_applied
     ORDER BY ts.start_date ASC`,
    params,
  );

  return rows;
};

export const checkCapacityAndApplyPolicy = async (
  { tourId, scheduleId } = {},
  connection = pool,
) => {
  const snapshots = await loadScheduleSnapshotsByFilter(connection, {
    tourId,
    scheduleId,
  });

  const affected = [];

  for (const snapshot of snapshots) {
    const maxSlots = Number(snapshot.max_slots || 0);
    const bookedSlots = Math.min(
      maxSlots,
      Math.max(0, Number(snapshot.booked_slots_actual || 0)),
    );
    const status = updateScheduleStatus({
      ...snapshot,
      max_slots: maxSlots,
      booked_slots: bookedSlots,
    });
    const saleState = applyAutoSale({
      ...snapshot,
      max_slots: maxSlots,
      booked_slots: bookedSlots,
    });

    await connection.execute(
      `UPDATE tour_schedules
       SET max_slots = ?,
           booked_slots = ?,
           available_slots = ?,
           status = ?,
           is_on_sale = ?,
           discount_percent = ?,
           auto_sale_applied = ?
       WHERE id = ?`,
      [
        maxSlots,
        bookedSlots,
        Math.max(maxSlots - bookedSlots, 0),
        status,
        Boolean(saleState.is_on_sale),
        Number(saleState.discount_percent || 0),
        Boolean(saleState.auto_sale_applied),
        snapshot.id,
      ],
    );

    if (status === "cancelled") {
      await cancelAllBookingsForCancelledSchedule(connection, snapshot.id);
    }

    affected.push({
      schedule_id: snapshot.id,
      tour_id: snapshot.tour_id,
      status,
      is_on_sale: Boolean(saleState.is_on_sale),
      discount_percent: Number(saleState.discount_percent || 0),
      auto_sale_applied: Boolean(saleState.auto_sale_applied),
      booked_slots: bookedSlots,
      max_slots: maxSlots,
      ratio: maxSlots > 0 ? Number((bookedSlots / maxSlots).toFixed(4)) : 0,
      days_left: getScheduleDaysLeft(snapshot.start_date),
    });
  }

  return affected;
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
    "SELECT id, start_date, max_slots, booked_slots, available_slots, status, min_required_ratio, is_on_sale, discount_percent, auto_sale_applied FROM tour_schedules WHERE id = ? LIMIT 1",
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
