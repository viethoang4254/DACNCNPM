import pool from "../config/db.js";

export const getAdminStats = async () => {
  const [[userStat]] = await pool.execute("SELECT COUNT(*) AS totalUsers FROM users");
  const [[tourStat]] = await pool.execute("SELECT COUNT(*) AS totalTours FROM tours");
  const [[bookingStat]] = await pool.execute("SELECT COUNT(*) AS totalBookings FROM bookings WHERE trang_thai = 'confirmed'");
  const [[revenueStat]] = await pool.execute(
    `SELECT COALESCE(SUM(p.amount), 0) AS revenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid'
       AND b.trang_thai = 'confirmed'
       AND LOWER(REPLACE(REPLACE(p.method, '-', '_'), ' ', '_'))
           NOT IN ('pay_at_place', 'pay_later', 'cod', 'cash_on_delivery', 'cash')`
  );

  return {
    totalUsers: Number(userStat.totalUsers),
    totalTours: Number(tourStat.totalTours),
    totalBookings: Number(bookingStat.totalBookings),
    revenue: Number(revenueStat.revenue),
  };
};

export const getRevenueReport = async () => {
  const [rows] = await pool.execute(
    `SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS month,
            COUNT(*) AS totalPayments,
            COALESCE(SUM(p.amount), 0) AS revenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid'
       AND b.trang_thai = 'confirmed'
       AND LOWER(REPLACE(REPLACE(p.method, '-', '_'), ' ', '_'))
           NOT IN ('pay_at_place', 'pay_later', 'cod', 'cash_on_delivery', 'cash')
     GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
     ORDER BY month DESC`
  );
  return rows;
};

export const getAdminBookings = async () => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.user_id, b.tour_id, b.schedule_id, b.so_nguoi, b.tong_tien, b.trang_thai, b.created_at,
            u.ho_ten AS user_name,
            t.ten_tour,
                 DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN tours t ON t.id = b.tour_id
     INNER JOIN tour_schedules s ON s.id = b.schedule_id
     WHERE b.trang_thai != 'pending'
     ORDER BY b.id DESC`
  );

  return rows;
};
