import pool from "../config/db.js";

const refundBaseSelect = `SELECT b.id AS booking_id,
       b.user_id,
       b.tour_id,
       b.schedule_id,
       b.so_nguoi,
       b.tong_tien,
       b.trang_thai,
       b.cancel_reason,
       b.refund_amount,
       b.refund_status,
       b.cancelled_at,
       b.cancelled_by,
      s.status AS schedule_status,
       u.ho_ten AS user_name,
       u.email AS user_email,
       t.ten_tour AS tour_name,
       DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
       p.id AS payment_id,
       p.status AS payment_status,
       p.method AS payment_method,
       p.amount AS payment_amount
FROM bookings b
INNER JOIN users u ON u.id = b.user_id
INNER JOIN tours t ON t.id = b.tour_id
INNER JOIN tour_schedules s ON s.id = b.schedule_id
LEFT JOIN payments p ON p.booking_id = b.id`;

export const getRefunds = async ({ status = "pending", keyword = "" } = {}) => {
  const whereParts = [];
  const params = [];

  if (status && status !== "all") {
    whereParts.push("b.refund_status = ?");
    params.push(status);
  }

  const text = String(keyword || "").trim();
  if (text) {
    whereParts.push("(u.ho_ten LIKE ? OR t.ten_tour LIKE ? OR CAST(b.id AS CHAR) LIKE ?)");
    params.push(`%${text}%`, `%${text}%`, `%${text}%`);
  }

  if (whereParts.length === 0) {
    whereParts.push("b.refund_status = 'pending'");
  }

  const [rows] = await pool.execute(
    `${refundBaseSelect}
     WHERE ${whereParts.join(" AND ")}
     ORDER BY b.cancelled_at DESC, b.id DESC`,
    params,
  );

  return rows;
};

export const getRefundByBookingId = async (bookingId, connection = pool) => {
  const [rows] = await connection.execute(
    `${refundBaseSelect}
     WHERE b.id = ?
     LIMIT 1`,
    [bookingId],
  );

  return rows[0] || null;
};
