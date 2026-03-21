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

const firstTourImageSubquery = `
  SELECT timg.tour_id, timg.image_url
  FROM tour_images timg
  INNER JOIN (
    SELECT tour_id, MIN(id) AS first_image_id
    FROM tour_images
    GROUP BY tour_id
  ) tif ON tif.tour_id = timg.tour_id AND tif.first_image_id = timg.id
`;

const futureScheduleSaleSubquery = `
  SELECT
    ts.tour_id,
    MAX(
      CASE
        WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
        THEN ts.discount_percent
        ELSE 0
      END
    ) AS discount_percent
  FROM tour_schedules ts
  WHERE DATE(ts.start_date) >= CURDATE()
  GROUP BY ts.tour_id
`;

const tourSearchSelect = `
  SELECT
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
    ti.image_url AS hinh_anh,
    MIN(ts.start_date) AS nearest_start_date,
    MAX(
      CASE
        WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
        THEN ts.discount_percent
        ELSE 0
      END
    ) AS discount_percent,
    CASE
      WHEN MAX(
        CASE
          WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
          THEN ts.discount_percent
          ELSE 0
        END
      ) > 0
      THEN TRUE
      ELSE FALSE
    END AS is_on_sale
  FROM tours t
  INNER JOIN tour_schedules ts ON ts.tour_id = t.id
  LEFT JOIN (${firstTourImageSubquery}) ti ON ti.tour_id = t.id
`;

const DESTINATION_ALIASES = {
  "da nang": ["Đà Nẵng", "Da Nang", "da-nang"],
  "ha noi": ["Hà Nội", "Ha Noi", "ha-noi"],
  "phu quoc": ["Phú Quốc", "Phu Quoc", "phu-quoc"],
  "hoi an": ["Hội An", "Hoi An", "hoi-an"],
  "da lat": ["Đà Lạt", "Da Lat", "da-lat"],
  "quang ninh": ["Quảng Ninh", "Ha Long", "Hạ Long", "quang-ninh"],
  "nha trang": ["Nha Trang", "Khánh Hòa", "khanh-hoa"],
  "ho chi minh": ["TP. Hồ Chí Minh", "Ho Chi Minh", "hcm"],
};

const normalizeDestinationInput = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
};

const getDestinationCandidates = (destination) => {
  const normalized = normalizeDestinationInput(destination);
  if (!normalized) return [];

  const candidates = new Set([
    normalized,
    normalized.replace(/\s+/g, "-"),
    normalized.replace(/\s+/g, ""),
  ]);

  const aliases = DESTINATION_ALIASES[normalized] || [];
  aliases.forEach((alias) => {
    const normalizedAlias = normalizeDestinationInput(alias);
    if (normalizedAlias) {
      candidates.add(normalizedAlias);
      candidates.add(normalizedAlias.replace(/\s+/g, "-"));
    }
    if (typeof alias === "string" && alias.trim()) {
      candidates.add(alias.trim().toLowerCase());
    }
  });

  return [...candidates];
};

const buildDestinationSqlFilter = (destination) => {
  const candidates = getDestinationCandidates(destination);
  if (candidates.length === 0) {
    return { clause: "", params: [] };
  }

  const parts = [];
  const params = [];

  candidates.forEach((candidate) => {
    const likeValue = `%${candidate}%`;
    parts.push(
      "(LOWER(t.tinh_thanh) LIKE ? OR LOWER(REPLACE(t.tinh_thanh, '-', ' ')) LIKE ? OR LOWER(t.ten_tour) LIKE ?)"
    );
    params.push(likeValue, likeValue, likeValue);
  });

  return {
    clause: `(${parts.join(" OR ")})`,
    params,
  };
};

export const searchToursByCriteria = async ({ destination, date, guests }) => {
  const guestCount = Number.isFinite(Number(guests)) ? Math.max(1, Number(guests)) : 1;
  const filters = [];
  const filterParams = [];

  const destinationFilter = buildDestinationSqlFilter(destination);

  if (destinationFilter.clause) {
    filters.push(destinationFilter.clause);
    filterParams.push(...destinationFilter.params);
  }

  const hasRequestedDate = Boolean(date);
  if (hasRequestedDate) {
    filters.push("ts.start_date >= ?");
    filterParams.push(date);
  }

  filters.push("ts.available_slots >= ?");
  filterParams.push(guestCount);

  const whereSql = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const groupOrderSql = "GROUP BY t.id ORDER BY nearest_start_date ASC, t.created_at DESC";

  const [rows] = await pool.execute(
    `${tourSearchSelect}
     ${whereSql}
     ${groupOrderSql}`,
    filterParams
  );

  if (rows.length > 0 || !hasRequestedDate) {
    return {
      tours: rows,
      message: rows.length > 0 ? "Tìm thấy tour phù hợp." : "Không tìm thấy tour phù hợp.",
      usedNearestDate: false,
    };
  }

  const nearestDateFilters = [];
  const nearestDateParams = [];

  if (destinationFilter.clause) {
    nearestDateFilters.push(destinationFilter.clause);
    nearestDateParams.push(...destinationFilter.params);
  }

  nearestDateFilters.push("ts.start_date >= ?");
  nearestDateParams.push(date);
  nearestDateFilters.push("ts.available_slots >= ?");
  nearestDateParams.push(guestCount);

  const nearestDateWhere = `WHERE ${nearestDateFilters.join(" AND ")}`;

  const [nearestDateRows] = await pool.execute(
    `SELECT MIN(ts.start_date) AS nearest_start_date
     FROM tours t
     INNER JOIN tour_schedules ts ON ts.tour_id = t.id
     ${nearestDateWhere}`,
    nearestDateParams
  );

  const nearestDate = nearestDateRows[0]?.nearest_start_date || null;
  if (!nearestDate) {
    return {
      tours: [],
      message: "Không tìm thấy tour phù hợp với điều kiện tìm kiếm.",
      usedNearestDate: false,
    };
  }

  const suggestedFilters = [];
  const suggestedParams = [];

  if (destinationFilter.clause) {
    suggestedFilters.push(destinationFilter.clause);
    suggestedParams.push(...destinationFilter.params);
  }

  suggestedFilters.push("ts.start_date = ?");
  suggestedParams.push(nearestDate);
  suggestedFilters.push("ts.available_slots >= ?");
  suggestedParams.push(guestCount);

  const suggestedWhere = `WHERE ${suggestedFilters.join(" AND ")}`;

  const [suggestedRows] = await pool.execute(
    `${tourSearchSelect}
     ${suggestedWhere}
     ${groupOrderSql}`,
    suggestedParams
  );

  return {
    tours: suggestedRows,
    message: "Không có tour đúng ngày bạn chọn. Đây là các ngày khởi hành gần nhất.",
    usedNearestDate: true,
  };
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
        ti.image_url AS hinh_anh,
        COALESCE(ss.discount_percent, 0) AS discount_percent,
        CASE
          WHEN COALESCE(ss.discount_percent, 0) > 0 THEN TRUE
          ELSE FALSE
        END AS is_on_sale
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
     LEFT JOIN (${futureScheduleSaleSubquery}) ss ON ss.tour_id = t.id
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
            ) AS hinh_anh,
            (
              SELECT COALESCE(
                MAX(
                  CASE
                    WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                    THEN ts.discount_percent
                    ELSE 0
                  END
                ),
                0
              )
              FROM tour_schedules ts
              WHERE ts.tour_id = tours.id AND DATE(ts.start_date) >= CURDATE()
            ) AS discount_percent,
            (
              SELECT CASE
                WHEN COALESCE(
                  MAX(
                    CASE
                      WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                      THEN ts.discount_percent
                      ELSE 0
                    END
                  ),
                  0
                ) > 0
                THEN TRUE
                ELSE FALSE
              END
              FROM tour_schedules ts
              WHERE ts.tour_id = tours.id AND DATE(ts.start_date) >= CURDATE()
            ) AS is_on_sale
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
            ) AS hinh_anh,
            (
              SELECT COALESCE(
                MAX(
                  CASE
                    WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                    THEN ts.discount_percent
                    ELSE 0
                  END
                ),
                0
              )
              FROM tour_schedules ts
              WHERE ts.tour_id = tours.id AND DATE(ts.start_date) >= CURDATE()
            ) AS discount_percent,
            (
              SELECT CASE
                WHEN COALESCE(
                  MAX(
                    CASE
                      WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                      THEN ts.discount_percent
                      ELSE 0
                    END
                  ),
                  0
                ) > 0
                THEN TRUE
                ELSE FALSE
              END
              FROM tour_schedules ts
              WHERE ts.tour_id = tours.id AND DATE(ts.start_date) >= CURDATE()
            ) AS is_on_sale
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
        ) AS hinh_anh,
        (
          SELECT COALESCE(
            MAX(
              CASE
                WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                THEN ts.discount_percent
                ELSE 0
              END
            ),
            0
          )
          FROM tour_schedules ts
          WHERE ts.tour_id = t.id AND DATE(ts.start_date) >= CURDATE()
        ) AS discount_percent,
        (
          SELECT CASE
            WHEN COALESCE(
              MAX(
                CASE
                  WHEN ts.is_on_sale = TRUE AND ts.discount_percent > 0
                  THEN ts.discount_percent
                  ELSE 0
                END
              ),
              0
            ) > 0
            THEN TRUE
            ELSE FALSE
          END
          FROM tour_schedules ts
          WHERE ts.tour_id = t.id AND DATE(ts.start_date) >= CURDATE()
        ) AS is_on_sale
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
    `SELECT ts.id,
            ts.tour_id,
            ts.start_date,
            COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
            COALESCE(SUM(CASE WHEN b.trang_thai = 'confirmed' THEN b.so_nguoi ELSE 0 END), 0) AS booked_slots,
            ts.min_required_ratio,
            GREATEST(
              COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) -
              COALESCE(SUM(CASE WHEN b.trang_thai = 'confirmed' THEN b.so_nguoi ELSE 0 END), 0),
              0
            ) AS available_slots,
            t.so_nguoi_toi_da,
                 ts.status,
                 ts.is_on_sale,
                 ts.discount_percent
     FROM tour_schedules ts
     JOIN tours t ON t.id = ts.tour_id
     LEFT JOIN bookings b ON b.schedule_id = ts.id
     WHERE ts.tour_id = ? AND DATE(ts.start_date) >= CURDATE()
               GROUP BY ts.id, ts.tour_id, ts.start_date, ts.max_slots, ts.min_required_ratio, ts.status, ts.is_on_sale, ts.discount_percent, t.so_nguoi_toi_da
     ORDER BY ts.start_date ASC`,
    [tourId]
  );
  return rows;
};

export const getScheduleById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT ts.id,
            ts.tour_id,
            ts.start_date,
            ts.available_slots,
            t.so_nguoi_toi_da,
            CASE
              WHEN DATE(ts.start_date) > CURDATE() THEN 'Sắp khởi hành'
              WHEN DATE(ts.start_date) = CURDATE() THEN 'Đang khởi hành'
              ELSE 'Đã khởi hành'
            END AS status
     FROM tour_schedules ts
     JOIN tours t ON t.id = ts.tour_id
     WHERE ts.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const createTourSchedule = async ({ tour_id, start_date, available_slots }) => {
  const [tourRows] = await pool.execute(
    "SELECT so_nguoi_toi_da FROM tours WHERE id = ? LIMIT 1",
    [tour_id]
  );

  const tour = tourRows[0] || null;
  if (!tour) {
    const err = new Error("Tour not found");
    err.statusCode = 404;
    throw err;
  }

  if (Number(available_slots) > Number(tour.so_nguoi_toi_da)) {
    const err = new Error(
      `Số chỗ còn lại không được vượt quá ${tour.so_nguoi_toi_da} chỗ của tour.`
    );
    err.statusCode = 400;
    throw err;
  }

  const [result] = await pool.execute(
    "INSERT INTO tour_schedules (tour_id, start_date, available_slots) VALUES (?, ?, ?)",
    [tour_id, start_date, available_slots]
  );

  return getScheduleById(result.insertId);
};

export const updateTourSchedule = async (id, { start_date, available_slots }) => {
  const existing = await getScheduleById(id);
  if (!existing) {
    const err = new Error("Schedule not found");
    err.statusCode = 404;
    throw err;
  }

  if (Number(available_slots) > Number(existing.so_nguoi_toi_da)) {
    const err = new Error(
      `Số chỗ còn lại không được vượt quá ${existing.so_nguoi_toi_da} chỗ của tour.`
    );
    err.statusCode = 400;
    throw err;
  }

  await pool.execute("UPDATE tour_schedules SET start_date = ?, available_slots = ? WHERE id = ?", [start_date, available_slots, id]);
  return getScheduleById(id);
};

export const deleteTourScheduleById = async (id) => {
  const [result] = await pool.execute("DELETE FROM tour_schedules WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
