import pool from "../config/db.js";

export const createPayment = async ({ booking_id, amount, method, status }) => {
  const [result] = await pool.execute(
    "INSERT INTO payments (booking_id, amount, method, status) VALUES (?, ?, ?, ?)",
    [booking_id, amount, method, status]
  );
  return getPaymentById(result.insertId);
};

export const getPaymentById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at,
            b.user_id, b.tour_id, b.trang_thai AS booking_status
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getPaymentByBookingId = async (bookingId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at,
            b.user_id, b.tour_id, b.trang_thai AS booking_status
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.booking_id = ?
     LIMIT 1`,
    [bookingId]
  );
  return rows[0] || null;
};

export const getAllPayments = async () => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at,
            b.user_id, b.tour_id, b.trang_thai AS booking_status
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     ORDER BY p.id DESC`
  );
  return rows;
};
