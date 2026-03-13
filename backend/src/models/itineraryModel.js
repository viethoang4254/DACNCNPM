import pool from "../config/db.js";

export const getTourByIdForItinerary = async (tourId) => {
  const [rows] = await pool.execute(
    "SELECT id, ten_tour FROM tours WHERE id = ? LIMIT 1",
    [tourId]
  );
  return rows[0] || null;
};

export const getItinerariesByTourId = async (tourId) => {
  const [rows] = await pool.execute(
    `SELECT ti.id, ti.tour_id, t.ten_tour, ti.ngay_thu, ti.tieu_de, ti.description, ti.image_url, ti.created_at
     FROM tour_itineraries ti
     JOIN tours t ON t.id = ti.tour_id
     WHERE ti.tour_id = ?
     ORDER BY ti.ngay_thu ASC, ti.id ASC`,
    [tourId]
  );

  return rows;
};

export const getItineraryById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT ti.id, ti.tour_id, t.ten_tour, ti.ngay_thu, ti.tieu_de, ti.description, ti.image_url, ti.created_at
     FROM tour_itineraries ti
     JOIN tours t ON t.id = ti.tour_id
     WHERE ti.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const normalizeNullableString = (value) => {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  return value.replace(/\r\n/g, "\n");
};

export const createItinerary = async ({ tour_id, ngay_thu, tieu_de, description, image_url }) => {
  const [result] = await pool.execute(
    `INSERT INTO tour_itineraries (tour_id, ngay_thu, tieu_de, description, image_url)
     VALUES (?, ?, ?, ?, ?)`,
    [tour_id, ngay_thu, tieu_de.trim(), normalizeNullableString(description), normalizeNullableString(image_url)]
  );

  return getItineraryById(result.insertId);
};

export const updateItineraryById = async (id, { tour_id, ngay_thu, tieu_de, description, image_url }) => {
  await pool.execute(
    `UPDATE tour_itineraries
     SET tour_id = ?, ngay_thu = ?, tieu_de = ?, description = ?, image_url = ?
     WHERE id = ?`,
    [tour_id, ngay_thu, tieu_de.trim(), normalizeNullableString(description), normalizeNullableString(image_url), id]
  );

  return getItineraryById(id);
};

export const deleteItineraryById = async (id) => {
  const [result] = await pool.execute("DELETE FROM tour_itineraries WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
