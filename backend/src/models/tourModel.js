import pool from "../config/db.js";

const mapSortField = (sort) => {
  if (sort === "price" || sort === "gia_asc") return "gia ASC";
  if (sort === "-price" || sort === "gia_desc") return "gia DESC";
  if (sort === "latest" || sort === "created_at_desc") return "created_at DESC";
  if (sort === "ten_tour_asc") return "ten_tour ASC";
  return "id DESC";
};

export const getTours = async ({ page, limit, keyword, tinh_thanh, diem_khoi_hanh, minPrice, maxPrice, sort, minDays, maxDays }) => {
  const whereParts = [];
  const params = [];

  if (keyword) {
    whereParts.push("(ten_tour LIKE ? OR mo_ta LIKE ? OR tinh_thanh LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (tinh_thanh) {
    whereParts.push("tinh_thanh = ?");
    params.push(tinh_thanh);
  }

  if (diem_khoi_hanh) {
    whereParts.push("diem_khoi_hanh = ?");
    params.push(diem_khoi_hanh);
  }

  if (minPrice !== undefined) {
    whereParts.push("gia >= ?");
    params.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereParts.push("gia <= ?");
    params.push(maxPrice);
  }

  if (minDays !== undefined) {
    whereParts.push("so_ngay >= ?");
    params.push(minDays);
  }

  if (maxDays !== undefined) {
    whereParts.push("so_ngay <= ?");
    params.push(maxDays);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM tours ${whereSql}`, params);
  const total = countRows[0]?.total || 0;

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const offset = (safePage - 1) * safeLimit;
  const orderBy = mapSortField(sort);

  const [rows] = await pool.execute(
    `SELECT id, ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da, created_at,
            (
              SELECT ti.image_url
              FROM tour_images ti
              WHERE ti.tour_id = tours.id
              ORDER BY ti.id ASC
              LIMIT 1
            ) AS hinh_anh
     FROM tours
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  return { tours: rows, total };
};

export const getTourById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da, created_at
     FROM tours
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

export const createTour = async ({ ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da }) => {
  const [result] = await pool.execute(
    `INSERT INTO tours (ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da]
  );

  return getTourById(result.insertId);
};

export const updateTour = async (id, payload) => {
  const { ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da } = payload;

  await pool.execute(
    `UPDATE tours
     SET ten_tour = ?, mo_ta = ?, gia = ?, tinh_thanh = ?, diem_khoi_hanh = ?, phuong_tien = ?, so_ngay = ?, so_nguoi_toi_da = ?
     WHERE id = ?`,
    [ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da, id]
  );

  return getTourById(id);
};

export const deleteTourById = async (id) => {
  const [result] = await pool.execute("DELETE FROM tours WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const getFeaturedTours = async (limit = 6) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 6;
  const [rows] = await pool.execute(
    `SELECT id, ten_tour, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da, created_at,
            (
              SELECT ti.image_url
              FROM tour_images ti
              WHERE ti.tour_id = tours.id
              ORDER BY ti.id ASC
              LIMIT 1
            ) AS hinh_anh
     FROM tours
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`
  );

  return rows;
};

export const getLatestTours = async (limit = 8) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 8;
  const [rows] = await pool.execute(
    `SELECT id, ten_tour, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da, created_at,
            (
              SELECT ti.image_url
              FROM tour_images ti
              WHERE ti.tour_id = tours.id
              ORDER BY ti.id ASC
              LIMIT 1
            ) AS hinh_anh
     FROM tours
     ORDER BY id DESC
     LIMIT ${safeLimit}`
  );
  return rows;
};

export const addTourImages = async (tourId, imageUrls) => {
  if (imageUrls.length === 0) return 0;

  const values = imageUrls.map((url) => [tourId, url]);
  const [result] = await pool.query("INSERT INTO tour_images (tour_id, image_url) VALUES ?", [values]);
  return result.affectedRows;
};

export const getTourImages = async (tourId) => {
  const [rows] = await pool.execute("SELECT id, tour_id, image_url FROM tour_images WHERE tour_id = ? ORDER BY id DESC", [tourId]);
  return rows;
};

export const getTourImageById = async (id) => {
  const [rows] = await pool.execute("SELECT id, tour_id, image_url FROM tour_images WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
};

export const deleteTourImageById = async (id) => {
  const [result] = await pool.execute("DELETE FROM tour_images WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const getTourSchedules = async (tourId) => {
  const [rows] = await pool.execute(
    "SELECT id, tour_id, start_date, available_slots FROM tour_schedules WHERE tour_id = ? ORDER BY start_date ASC",
    [tourId]
  );
  return rows;
};

export const getScheduleById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id, tour_id, start_date, available_slots FROM tour_schedules WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const createTourSchedule = async ({ tour_id, start_date, available_slots }) => {
  const [result] = await pool.execute(
    "INSERT INTO tour_schedules (tour_id, start_date, available_slots) VALUES (?, ?, ?)",
    [tour_id, start_date, available_slots]
  );

  return getScheduleById(result.insertId);
};

export const updateTourSchedule = async (id, { start_date, available_slots }) => {
  await pool.execute("UPDATE tour_schedules SET start_date = ?, available_slots = ? WHERE id = ?", [start_date, available_slots, id]);
  return getScheduleById(id);
};

export const deleteTourScheduleById = async (id) => {
  const [result] = await pool.execute("DELETE FROM tour_schedules WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
