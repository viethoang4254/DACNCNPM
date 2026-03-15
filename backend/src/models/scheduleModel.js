import pool from "../config/db.js";

export const getAllSchedules = async () => {
	const [rows] = await pool.execute(
		`SELECT ts.id, ts.tour_id, t.ten_tour, t.so_nguoi_toi_da, ts.start_date, ts.available_slots,
						CASE
							WHEN DATE(ts.start_date) > CURDATE() THEN 'Sắp khởi hành'
							WHEN DATE(ts.start_date) = CURDATE() THEN 'Đang khởi hành'
							ELSE 'Đã khởi hành'
						END AS status
     FROM tour_schedules ts
     JOIN tours t ON t.id = ts.tour_id
     ORDER BY ts.start_date DESC`,
	);
	return rows;
};

export const getScheduleById = async (id) => {
	const [rows] = await pool.execute(
		`SELECT ts.id, ts.tour_id, t.ten_tour, t.so_nguoi_toi_da, ts.start_date, ts.available_slots,
						CASE
							WHEN DATE(ts.start_date) > CURDATE() THEN 'Sắp khởi hành'
							WHEN DATE(ts.start_date) = CURDATE() THEN 'Đang khởi hành'
							ELSE 'Đã khởi hành'
						END AS status
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
	const [scheduleRows] = await pool.execute(
		`SELECT ts.id, t.so_nguoi_toi_da
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

	if (Number(available_slots) > Number(schedule.so_nguoi_toi_da)) {
		const err = new Error(
			`Số chỗ còn lại không được vượt quá ${schedule.so_nguoi_toi_da} chỗ của tour.`
		);
		err.statusCode = 400;
		throw err;
	}

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
