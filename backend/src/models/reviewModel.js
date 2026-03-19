import pool from "../config/db.js";

export const createReview = async ({ user_id, tour_id, rating, comment }) => {
  const [result] = await pool.execute(
    "INSERT INTO reviews (user_id, tour_id, rating, comment) VALUES (?, ?, ?, ?)",
    [user_id, tour_id, rating, comment]
  );
  return result.insertId;
};

export const getAllReviews = async () => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, r.tour_id, r.rating, r.comment, r.created_at,
            u.ho_ten AS user_name,
            t.ten_tour
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN tours t ON t.id = r.tour_id
     ORDER BY r.id DESC`
  );

  return rows;
};

export const getReviewById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, r.tour_id, r.rating, r.comment, r.created_at,
            u.ho_ten AS user_name,
            t.ten_tour
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN tours t ON t.id = r.tour_id
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getReviewsByTourId = async (tourId) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, r.tour_id, r.rating, r.comment, r.created_at,
            u.ho_ten AS user_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.tour_id = ?
     ORDER BY r.id DESC`,
    [tourId]
  );
  return rows;
};

export const hasUserReviewedTour = async (userId, tourId) => {
  const [rows] = await pool.execute("SELECT id FROM reviews WHERE user_id = ? AND tour_id = ? LIMIT 1", [userId, tourId]);
  return rows.length > 0;
};

export const updateReviewById = async (id, { rating, comment }) => {
  await pool.execute("UPDATE reviews SET rating = ?, comment = ? WHERE id = ?", [rating, comment, id]);
  return getReviewById(id);
};

export const deleteReviewById = async (id) => {
  const [result] = await pool.execute("DELETE FROM reviews WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
