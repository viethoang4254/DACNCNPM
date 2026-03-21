import pool from "../config/db.js";
import {
  withScheduleComputedFields,
  refreshScheduleOccupancyAndStatusById,
} from "../services/scheduleStatusService.js";

const scheduleSelectSql = `SELECT ts.id, ts.tour_id, t.ten_tour, t.so_nguoi_toi_da,
	   ts.start_date,
	   COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
	   ts.booked_slots, ts.available_slots, ts.status, ts.min_required_ratio,
	   ts.is_on_sale, ts.discount_percent, ts.auto_sale_applied
   FROM tour_schedules ts
   JOIN tours t ON t.id = ts.tour_id`;

export const getAllSchedules = async () => {
	const [rows] = await pool.execute(`${scheduleSelectSql} ORDER BY ts.start_date DESC`);
	return rows.map(withScheduleComputedFields);
};

export const getWarningSchedules = async () => {
	const [rows] = await pool.execute(`${scheduleSelectSql} ORDER BY ts.start_date ASC`);

	return rows
		.map(withScheduleComputedFields)
		.filter(
			(item) =>
				Number(item.percent || 0) / 100 < Number(item.min_required_ratio || 0.5) &&
				Number(item.days_left) >= 0 &&
				Number(item.days_left) <= 7,
		)
		.map((item) => ({
			id: item.id,
			tour_id: item.tour_id,
			ten_tour: item.ten_tour,
			start_date: item.start_date,
			booked_slots: item.booked_slots,
			max_slots: item.max_slots,
			percent: Number((Number(item.percent || 0) / 100).toFixed(2)),
			days_left: item.days_left,
		}))
		.sort((a, b) => Number(a.days_left) - Number(b.days_left));
};

export const getScheduleById = async (id) => {
	const [rows] = await pool.execute(
		`${scheduleSelectSql}
     WHERE ts.id = ?
     LIMIT 1`,
		[id],
	);
	const row = rows[0] || null;
	return row ? withScheduleComputedFields(row) : null;
};

export const createSchedule = async ({ tour_id, start_date }) => {
	const [tourRows] = await pool.execute(
		"SELECT so_nguoi_toi_da FROM tours WHERE id = ? LIMIT 1",
		[tour_id],
	);
	if (!tourRows[0]) {
		const err = new Error("Tour not found");
		err.statusCode = 404;
		throw err;
	}
	const max_slots = Number(tourRows[0].so_nguoi_toi_da || 0);

	const [result] = await pool.execute(
		"INSERT INTO tour_schedules (tour_id, start_date, max_slots, booked_slots, available_slots, status, min_required_ratio) VALUES (?, ?, ?, 0, ?, 'open', 0.50)",
		[tour_id, start_date, max_slots, max_slots],
	);

	await refreshScheduleOccupancyAndStatusById(result.insertId);
	return getScheduleById(result.insertId);
};

export const updateSchedule = async (id, { start_date, max_slots, min_required_ratio }) => {
	const [scheduleRows] = await pool.execute(
		`SELECT ts.id, t.so_nguoi_toi_da, ts.max_slots
		 FROM tour_schedules ts
		 JOIN tours t ON t.id = ts.tour_id
		 WHERE ts.id = ?
		 LIMIT 1`,
		[id],
	);

	const schedule = scheduleRows[0] || null;
	if (!schedule) {
		const err = new Error("Schedule not found");
		err.statusCode = 404;
		throw err;
	}

	const nextMaxSlots =
		max_slots === undefined ? Number(schedule.max_slots) : Number(max_slots);

	if (nextMaxSlots > Number(schedule.so_nguoi_toi_da)) {
		const err = new Error(
			`Tối đa chỉ được ${schedule.so_nguoi_toi_da} chỗ theo cấu hình tour.`
		);
		err.statusCode = 400;
		throw err;
	}

	await pool.execute(
		"UPDATE tour_schedules SET start_date = ?, max_slots = ?, min_required_ratio = ? WHERE id = ?",
		[
			start_date,
			nextMaxSlots,
			min_required_ratio === undefined ? 0.5 : Number(min_required_ratio),
			id,
		],
	);

	await refreshScheduleOccupancyAndStatusById(id);
	return getScheduleById(id);
};

export const deleteScheduleById = async (id) => {
	const [result] = await pool.execute(
		"DELETE FROM tour_schedules WHERE id = ?",
		[id],
	);
	return result.affectedRows > 0;
};

export const applySaleToScheduleById = async (id, discountPercent = 20) => {
	const [result] = await pool.execute(
		"UPDATE tour_schedules SET is_on_sale = TRUE, discount_percent = ?, auto_sale_applied = FALSE WHERE id = ?",
		[Number(discountPercent), id],
	);

	return result.affectedRows > 0;
};

export const removeSaleFromScheduleById = async (id) => {
	const [result] = await pool.execute(
		"UPDATE tour_schedules SET is_on_sale = FALSE, discount_percent = 0, auto_sale_applied = FALSE WHERE id = ?",
		[id],
	);

	return result.affectedRows > 0;
};
