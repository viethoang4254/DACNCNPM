import pool from "../config/db.js";

export const getAllSchedules = async () => {
	const [rows] = await pool.execute(
		`SELECT ts.id, ts.tour_id, t.ten_tour, ts.start_date, ts.available_slots
     FROM tour_schedules ts
     JOIN tours t ON t.id = ts.tour_id
     ORDER BY ts.start_date DESC`,
	);
	return rows;
};

export const getScheduleById = async (id) => {
	const [rows] = await pool.execute(
		`SELECT ts.id, ts.tour_id, t.ten_tour, ts.start_date, ts.available_slots
     FROM tour_schedules ts
     JOIN tours t ON t.id = ts.tour_id
     WHERE ts.id = ? LIMIT 1`,
		[id],
	);
	return rows[0] || null;
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
	const available_slots = tourRows[0].so_nguoi_toi_da;

	const [result] = await pool.execute(
		"INSERT INTO tour_schedules (tour_id, start_date, available_slots) VALUES (?, ?, ?)",
		[tour_id, start_date, available_slots],
	);
	return getScheduleById(result.insertId);
};

export const updateSchedule = async (id, { start_date, available_slots }) => {
	await pool.execute(
		"UPDATE tour_schedules SET start_date = ?, available_slots = ? WHERE id = ?",
		[start_date, available_slots, id],
	);
	return getScheduleById(id);
};

export const deleteScheduleById = async (id) => {
	const [result] = await pool.execute(
		"DELETE FROM tour_schedules WHERE id = ?",
		[id],
	);
	return result.affectedRows > 0;
};
