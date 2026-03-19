import pool from "../config/db.js";

export const createPayment = async ({ booking_id, amount, method, status }) => {
  const [result] = await pool.execute(
    "INSERT INTO payments (booking_id, amount, method, status) VALUES (?, ?, ?, ?)",
    [booking_id, amount, method, status]
  );
  return getPaymentById(result.insertId);
};

const paymentSelectQuery = `SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at,
        b.user_id, b.tour_id, b.schedule_id, b.so_nguoi, b.tong_tien, b.trang_thai AS booking_status,
        u.ho_ten AS user_name, u.email AS user_email, u.so_dien_thoai AS user_phone,
        t.ten_tour,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date
 FROM payments p
 INNER JOIN bookings b ON b.id = p.booking_id
 INNER JOIN users u ON u.id = b.user_id
 INNER JOIN tours t ON t.id = b.tour_id
 INNER JOIN tour_schedules s ON s.id = b.schedule_id`;

export const getPaymentById = async (id, connection = pool) => {
  const [rows] = await connection.execute(
    `${paymentSelectQuery}
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getPaymentByBookingId = async (bookingId, connection = pool) => {
  const [rows] = await connection.execute(
    `${paymentSelectQuery}
     WHERE p.booking_id = ?
     LIMIT 1`,
    [bookingId]
  );
  return rows[0] || null;
};

export const getAllPayments = async () => {
  const [rows] = await pool.execute(`${paymentSelectQuery}
     ORDER BY p.id DESC`);
  return rows;
};
