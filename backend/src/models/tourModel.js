import pool from "../config/db.js";

const mapSortField = (sort) => {
  if (sort === "newest") return "t.created_at DESC";
  if (sort === "price_asc") return "t.gia ASC";
  if (sort === "price_desc") return "t.gia DESC";
  if (sort === "price" || sort === "gia_asc") return "t.gia ASC";
  if (sort === "-price" || sort === "gia_desc") return "t.gia DESC";
  if (sort === "latest" || sort === "created_at_desc") return "t.created_at DESC";
  if (sort === "ten_tour_asc") return "t.ten_tour ASC";
  return "t.id DESC";
};

const applyPriceRange = (price) => {
  if (price === "under-2") return { min: undefined, max: 2000000, maxExclusive: true };
  if (price === "2-5") return { min: 2000000, max: 5000000 };
  if (price === "5-10") return { min: 5000000, max: 10000000 };
  if (price === "over-10") return { min: 10000000, max: undefined, minExclusive: true };
  return null;
};

const applyDurationRange = (duration) => {
  if (duration === "1-3") return { min: 1, max: 3 };
  if (duration === "4-7") return { min: 4, max: 7 };
  if (duration === "over-7") return { min: 7, max: undefined, minExclusive: true };
  return null;
};

export const getTours = async ({ page, limit, keyword, tinh_thanh, diem_khoi_hanh, price, duration, minPrice, maxPrice, sort, minDays, maxDays }) => {
  const whereParts = [];
  const params = [];

  if (keyword) {
    whereParts.push("(t.ten_tour LIKE ? OR t.mo_ta LIKE ? OR t.tinh_thanh LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (tinh_thanh) {
    whereParts.push("(t.tinh_thanh = ? OR t.ten_tour LIKE ?)");
    params.push(tinh_thanh, `%${tinh_thanh}%`);
  }

  if (diem_khoi_hanh) {
    whereParts.push("t.diem_khoi_hanh = ?");
    params.push(diem_khoi_hanh);
  }

  const priceRange = applyPriceRange(price);
  if (priceRange) {
    if (priceRange.min !== undefined) {
      whereParts.push(priceRange.minExclusive ? "t.gia > ?" : "t.gia >= ?");
      params.push(priceRange.min);
    }
    if (priceRange.max !== undefined) {
      whereParts.push(priceRange.maxExclusive ? "t.gia < ?" : "t.gia <= ?");
      params.push(priceRange.max);
    }
  }

  const durationRange = applyDurationRange(duration);
  if (durationRange) {
    if (durationRange.min !== undefined) {
      whereParts.push(durationRange.minExclusive ? "t.so_ngay > ?" : "t.so_ngay >= ?");
      params.push(durationRange.min);
    }
    if (durationRange.max !== undefined) {
      whereParts.push(durationRange.maxExclusive ? "t.so_ngay < ?" : "t.so_ngay <= ?");
      params.push(durationRange.max);
    }
  }

  if (minPrice !== undefined) {
    whereParts.push("t.gia >= ?");
    params.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereParts.push("t.gia <= ?");
    params.push(maxPrice);
  }

  if (minDays !== undefined) {
    whereParts.push("t.so_ngay >= ?");
    params.push(minDays);
  }

  if (maxDays !== undefined) {
    whereParts.push("t.so_ngay <= ?");
    params.push(maxDays);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM tours t ${whereSql}`, params);
  const total = countRows[0]?.total || 0;

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const offset = (safePage - 1) * safeLimit;
  const orderBy = mapSortField(sort);

  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.ten_tour,
        t.mo_ta,
        t.gia,
        t.tinh_thanh,
        t.diem_khoi_hanh,
        t.phuong_tien,
        t.so_ngay,
        t.so_nguoi_toi_da,
        t.created_at,
        ti.image_url AS hinh_anh
     FROM tours t
     LEFT JOIN (
       SELECT timg.tour_id, timg.image_url
       FROM tour_images timg
       INNER JOIN (
         SELECT tour_id, MIN(id) AS first_image_id
         FROM tour_images
         GROUP BY tour_id
       ) tif ON tif.tour_id = timg.tour_id AND tif.first_image_id = timg.id
     ) ti ON ti.tour_id = t.id
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

export const getSimilarToursByTourId = async (tourId, limit = 3) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 3;

  const [baseTourRows] = await pool.execute(
    "SELECT id, tinh_thanh FROM tours WHERE id = ? LIMIT 1",
    [tourId]
  );

  const baseTour = baseTourRows[0] || null;
  if (!baseTour) {
    return [];
  }

  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.ten_tour,
        t.mo_ta,
        t.gia,
        t.tinh_thanh,
        t.diem_khoi_hanh,
        t.phuong_tien,
        t.so_ngay,
        t.so_nguoi_toi_da,
        t.created_at,
        (
          SELECT ti.image_url
          FROM tour_images ti
          WHERE ti.tour_id = t.id
          ORDER BY ti.id ASC
          LIMIT 1
        ) AS hinh_anh
     FROM tours t
     WHERE t.tinh_thanh = ? AND t.id <> ?
     ORDER BY t.created_at DESC
     LIMIT ${safeLimit}`,
    [baseTour.tinh_thanh, tourId]
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

export const updateTourImageById = async (id, imageUrl) => {
  const [result] = await pool.execute("UPDATE tour_images SET image_url = ? WHERE id = ?", [imageUrl, id]);
  if (result.affectedRows === 0) {
    return null;
  }

  return getTourImageById(id);
};

export const setTourCoverImageById = async (imageId) => {
  const selectedImage = await getTourImageById(imageId);
  if (!selectedImage) {
    return null;
  }

  const [firstRows] = await pool.execute(
    "SELECT id, tour_id, image_url FROM tour_images WHERE tour_id = ? ORDER BY id ASC LIMIT 1",
    [selectedImage.tour_id]
  );
  const firstImage = firstRows[0] || null;

  if (!firstImage) {
    return null;
  }

  if (firstImage.id === selectedImage.id) {
    return getTourImageById(firstImage.id);
  }

  await pool.execute("UPDATE tour_images SET image_url = ? WHERE id = ?", [selectedImage.image_url, firstImage.id]);
  await pool.execute("UPDATE tour_images SET image_url = ? WHERE id = ?", [firstImage.image_url, selectedImage.id]);

  return getTourImageById(firstImage.id);
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
