import pool from "../config/db.js";

const firstTourImageSubquery = `
  SELECT timg.tour_id, timg.image_url
  FROM tour_images timg
  INNER JOIN (
    SELECT tour_id, MIN(id) AS first_image_id
    FROM tour_images
    GROUP BY tour_id
  ) tif ON tif.tour_id = timg.tour_id AND tif.first_image_id = timg.id
`;

export const upsertTourHistory = async ({ user_id, tour_id }) => {
  await pool.execute(
    `INSERT INTO tour_history (user_id, tour_id, viewed_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP`,
    [user_id, tour_id]
  );

  const [rows] = await pool.execute(
    `SELECT id, user_id, tour_id, viewed_at
     FROM tour_history
     WHERE user_id = ? AND tour_id = ?
     LIMIT 1`,
    [user_id, tour_id]
  );

  return rows[0] || null;
};

export const getTourHistoryByUserId = async (userId, limit = 10) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;

  const [rows] = await pool.execute(
    `SELECT
        h.id,
        h.user_id,
        h.tour_id,
        h.viewed_at,
        t.ten_tour,
        t.gia,
        t.tinh_thanh,
        t.phuong_tien,
        t.so_ngay,
        t.created_at,
        ti.image_url AS hinh_anh
     FROM tour_history h
     INNER JOIN tours t ON t.id = h.tour_id
     LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
     WHERE h.user_id = ?
     ORDER BY h.viewed_at DESC
     LIMIT ${safeLimit}`,
    [userId]
  );

  return rows;
};

export const getRecommendedToursByUserId = async (userId, limit = 6) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 6;

  const [viewedRows] = await pool.execute(
    `SELECT h.tour_id, t.tinh_thanh
     FROM tour_history h
     INNER JOIN tours t ON t.id = h.tour_id
     WHERE h.user_id = ?
     ORDER BY h.viewed_at DESC`,
    [userId]
  );

  if (viewedRows.length === 0) {
    const [randomRows] = await pool.execute(
      `SELECT
          t.id,
          t.ten_tour,
          t.gia,
          t.tinh_thanh,
          t.phuong_tien,
          t.so_ngay,
          t.created_at,
          ti.image_url AS hinh_anh
       FROM tours t
       LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
       ORDER BY RAND()
       LIMIT ${safeLimit}`
    );

    return randomRows;
  }

  const viewedTourIds = [...new Set(viewedRows.map((row) => Number(row.tour_id)).filter(Boolean))];
  const viewedProvinces = [
    ...new Set(viewedRows.map((row) => row.tinh_thanh).filter((value) => typeof value === "string" && value.trim())),
  ];

  let recommended = [];

  if (viewedProvinces.length > 0) {
    const provincePlaceholders = viewedProvinces.map(() => "?").join(", ");
    const viewedPlaceholders = viewedTourIds.map(() => "?").join(", ");

    const [provinceRows] = await pool.execute(
      `SELECT
          t.id,
          t.ten_tour,
          t.gia,
          t.tinh_thanh,
          t.phuong_tien,
          t.so_ngay,
          t.created_at,
          ti.image_url AS hinh_anh
       FROM tours t
       LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
       WHERE t.tinh_thanh IN (${provincePlaceholders})
       AND t.id NOT IN (${viewedPlaceholders})
       ORDER BY t.created_at DESC
       LIMIT ${safeLimit}`,
      [...viewedProvinces, ...viewedTourIds]
    );

    recommended = provinceRows;
  }

  if (recommended.length >= safeLimit) {
    return recommended.slice(0, safeLimit);
  }

  const needed = safeLimit - recommended.length;
  const excludedIds = [...new Set([...viewedTourIds, ...recommended.map((item) => item.id)])];

  let randomRows = [];

  if (excludedIds.length > 0) {
    const excludedPlaceholders = excludedIds.map(() => "?").join(", ");

    const [rows] = await pool.execute(
      `SELECT
          t.id,
          t.ten_tour,
          t.gia,
          t.tinh_thanh,
          t.phuong_tien,
          t.so_ngay,
          t.created_at,
          ti.image_url AS hinh_anh
       FROM tours t
       LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
       WHERE t.id NOT IN (${excludedPlaceholders})
       ORDER BY RAND()
       LIMIT ${needed}`,
      excludedIds
    );

    randomRows = rows;
  } else {
    const [rows] = await pool.execute(
      `SELECT
          t.id,
          t.ten_tour,
          t.gia,
          t.tinh_thanh,
          t.so_ngay,
          t.created_at,
          ti.image_url AS hinh_anh
       FROM tours t
       LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
       ORDER BY RAND()
       LIMIT ${needed}`
    );

    randomRows = rows;
  }

  return [...recommended, ...randomRows].slice(0, safeLimit);
};
