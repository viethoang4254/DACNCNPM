import pool from "../config/db.js";
import { getBookingPendingCutoff } from "../utils/bookingExpiration.js";

export const getBookingById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.tour_id, b.schedule_id, b.so_nguoi, b.tong_tien, b.trang_thai, b.created_at,
            u.ho_ten AS user_name, u.email AS user_email,
            t.ten_tour, t.gia, t.tinh_thanh,
            s.start_date,
            ti.image_url AS image
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN tours t ON t.id = b.tour_id
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
     LEFT JOIN (
       SELECT tour_id, MIN(id) AS first_image_id
       FROM tour_images
       GROUP BY tour_id
     ) tif ON tif.tour_id = t.id
     LEFT JOIN tour_images ti ON ti.id = tif.first_image_id
     WHERE b.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getBookingsByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.tour_id, b.schedule_id, b.so_nguoi, b.tong_tien, b.trang_thai, b.created_at,
            t.ten_tour, t.gia, t.tinh_thanh,
            s.start_date,
            ti.image_url AS image
     FROM bookings b
     INNER JOIN tours t ON t.id = b.tour_id
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
     LEFT JOIN (
       SELECT tour_id, MIN(id) AS first_image_id
       FROM tour_images
       GROUP BY tour_id
     ) tif ON tif.tour_id = t.id
     LEFT JOIN tour_images ti ON ti.id = tif.first_image_id
     WHERE b.user_id = ?
     ORDER BY b.id DESC`,
    [userId]
  );
  return rows;
};

export const getAllBookings = async () => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.tour_id, b.schedule_id, b.so_nguoi, b.tong_tien, b.trang_thai, b.created_at,
            u.ho_ten AS user_name, u.email AS user_email,
            t.ten_tour, t.gia, t.tinh_thanh,
            s.start_date,
            ti.image_url AS image
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN tours t ON t.id = b.tour_id
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
     LEFT JOIN (
       SELECT tour_id, MIN(id) AS first_image_id
       FROM tour_images
       GROUP BY tour_id
     ) tif ON tif.tour_id = t.id
     LEFT JOIN tour_images ti ON ti.id = tif.first_image_id
     ORDER BY b.id DESC`
  );
  return rows;
};

export const createBookingRecord = async ({ user_id, tour_id, schedule_id, so_nguoi, tong_tien, trang_thai }, connection = pool) => {
  const [result] = await connection.execute(
    "INSERT INTO bookings (user_id, tour_id, schedule_id, so_nguoi, tong_tien, trang_thai) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, tour_id, schedule_id, so_nguoi, tong_tien, trang_thai]
  );
  return result.insertId;
};

export const updateBookingStatus = async (id, status) => {
  const [result] = await pool.execute("UPDATE bookings SET trang_thai = ? WHERE id = ?", [status, id]);
  return result.affectedRows > 0;
};

export const deleteBookingById = async (id) => {
  const [result] = await pool.execute("DELETE FROM bookings WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const hasUserBookedTour = async (userId, tourId) => {
  const [rows] = await pool.execute(
    "SELECT id FROM bookings WHERE user_id = ? AND tour_id = ? AND trang_thai IN ('pending', 'confirmed') LIMIT 1",
    [userId, tourId]
  );
  return rows.length > 0;
};

export const expirePendingBookings = async (expireMinutes, connection = pool) => {
  const cutoff = getBookingPendingCutoff(expireMinutes);
  const [result] = await connection.execute(
    "UPDATE bookings SET trang_thai = 'cancelled' WHERE trang_thai = 'pending' AND created_at <= ?",
    [cutoff]
  );
  return Number(result?.affectedRows || 0);
};

export const expirePendingBookingById = async (id, expireMinutes, connection = pool) => {
  const cutoff = getBookingPendingCutoff(expireMinutes);
  const [result] = await connection.execute(
    "UPDATE bookings SET trang_thai = 'cancelled' WHERE id = ? AND trang_thai = 'pending' AND created_at <= ?",
    [id, cutoff]
  );
  return Number(result?.affectedRows || 0);
};
