import pool from "../config/db.js";

export const createNotification = async (
  { type, message },
  connection = pool,
) => {
  const [result] = await connection.execute(
    "INSERT INTO notifications (type, message) VALUES (?, ?)",
    [type, message],
  );

  return result.insertId;
};

export const getNotifications = async () => {
  const [rows] = await pool.execute(
    `SELECT id, type, message, is_read, created_at
     FROM notifications
     ORDER BY created_at DESC, id DESC`,
  );

  return rows;
};

export const getUnreadNotificationsCount = async () => {
  const [[row]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM notifications WHERE is_read = FALSE",
  );

  return Number(row?.total || 0);
};

export const markNotificationAsRead = async (id) => {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read = TRUE WHERE id = ?",
    [id],
  );

  return Number(result?.affectedRows || 0) > 0;
};
