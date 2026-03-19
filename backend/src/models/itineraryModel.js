import pool from "../config/db.js";

const normalizeNullableString = (value) => {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  return value.replace(/\r\n/g, "\n");
};

export const getTourByIdForItinerary = async (tourId) => {
  const [rows] = await pool.execute(
    "SELECT id, ten_tour, so_ngay FROM tours WHERE id = ? LIMIT 1",
    [tourId]
  );
  return rows[0] || null;
};

export const getAdminItineraryTours = async ({ page = 1, limit = 10, search = "" }) => {
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const offset = (safePage - 1) * safeLimit;

  const whereParts = [];
  const params = [];

  if (search) {
    whereParts.push("(t.ten_tour LIKE ? OR t.id = ?)");
    params.push(`%${search}%`, Number(search) || 0);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tours t
     ${whereSql}`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT
      t.id,
      t.ten_tour,
      t.so_ngay,
      COUNT(i.id) AS itinerary_count
     FROM tours t
     LEFT JOIN tour_itineraries i ON t.id = i.tour_id
     ${whereSql}
     GROUP BY t.id, t.ten_tour, t.so_ngay
     ORDER BY t.id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  return {
    tours: rows,
    total: countRows[0]?.total || 0,
    page: safePage,
    limit: safeLimit,
  };
};

export const getItinerariesByTourId = async (tourId) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      tour_id,
      day_number,
      title,
      description,
      created_at,
      updated_at
     FROM tour_itineraries
     WHERE tour_id = ?
     ORDER BY day_number ASC, id ASC`,
    [tourId]
  );

  return rows;
};

export const getItineraryDetailByTourId = async (tourId) => {
  const tour = await getTourByIdForItinerary(tourId);
  if (!tour) return null;

  const itineraries = await getItinerariesByTourId(tourId);
  return { tour, itineraries };
};

const buildBulkValues = (tourId, itineraries) =>
  itineraries.map((item) => [
    tourId,
    Number(item.day_number),
    String(item.title || "").trim(),
    normalizeNullableString(item.description),
  ]);

export const replaceTourItineraries = async (tourId, itineraries) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute("DELETE FROM tour_itineraries WHERE tour_id = ?", [tourId]);

    if (itineraries.length > 0) {
      const values = buildBulkValues(tourId, itineraries);
      await connection.query(
        `INSERT INTO tour_itineraries (tour_id, day_number, title, description)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    return getItineraryDetailByTourId(tourId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteTourItinerariesByTourId = async (tourId) => {
  const [result] = await pool.execute("DELETE FROM tour_itineraries WHERE tour_id = ?", [tourId]);
  return result.affectedRows;
};
