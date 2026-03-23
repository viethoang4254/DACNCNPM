import pool from "../config/db.js";

const COD_METHOD_CONDITION = `LOWER(REPLACE(REPLACE(COALESCE(p.method, ''), '-', '_'), ' ', '_'))
  IN ('pay_at_place', 'pay_later', 'cod', 'cash_on_delivery', 'cash')`;

const NON_COD_METHOD_CONDITION = `LOWER(REPLACE(REPLACE(COALESCE(p.method, ''), '-', '_'), ' ', '_'))
  NOT IN ('pay_at_place', 'pay_later', 'cod', 'cash_on_delivery', 'cash')`;

const toNumber = (value) => Number(value || 0);

const computeGrowth = (currentValue, previousValue) => {
  const current = toNumber(currentValue);
  const previous = toNumber(previousValue);

  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const getDashboardSummary = async () => {
  const [[userStat]] = await pool.execute(
    "SELECT COUNT(*) AS totalUsers FROM users",
  );
  const [[tourStat]] = await pool.execute(
    "SELECT COUNT(*) AS totalTours FROM tours",
  );
  const [[bookingStat]] = await pool.execute(
    "SELECT COUNT(*) AS totalBookings FROM bookings WHERE trang_thai = 'confirmed'",
  );

  const [[revenueStat]] = await pool.execute(
    `SELECT COALESCE(SUM(p.amount), 0) AS totalRevenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid'
       AND b.trang_thai = 'confirmed'
       AND ${NON_COD_METHOD_CONDITION}`,
  );

  const [[userGrowthStat]] = await pool.execute(
    `SELECT
       SUM(CASE
         WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS currentValue,
       SUM(CASE
         WHEN created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS previousValue
     FROM users`,
  );

  const [[tourGrowthStat]] = await pool.execute(
    `SELECT
       SUM(CASE
         WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS currentValue,
       SUM(CASE
         WHEN created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS previousValue
     FROM tours`,
  );

  const [[bookingGrowthStat]] = await pool.execute(
    `SELECT
       SUM(CASE
         WHEN trang_thai = 'confirmed'
          AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS currentValue,
       SUM(CASE
         WHEN trang_thai = 'confirmed'
          AND created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN 1 ELSE 0
       END) AS previousValue
     FROM bookings`,
  );

  const [[revenueGrowthStat]] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE
         WHEN p.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN p.amount ELSE 0
       END), 0) AS currentValue,
       COALESCE(SUM(CASE
         WHEN p.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND p.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         THEN p.amount ELSE 0
       END), 0) AS previousValue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid'
       AND b.trang_thai = 'confirmed'
       AND ${NON_COD_METHOD_CONDITION}`,
  );

  return {
    totalUsers: toNumber(userStat?.totalUsers),
    totalTours: toNumber(tourStat?.totalTours),
    totalBookings: toNumber(bookingStat?.totalBookings),
    totalRevenue: toNumber(revenueStat?.totalRevenue),
    growth: {
      users: computeGrowth(userGrowthStat?.currentValue, userGrowthStat?.previousValue),
      tours: computeGrowth(tourGrowthStat?.currentValue, tourGrowthStat?.previousValue),
      bookings: computeGrowth(
        bookingGrowthStat?.currentValue,
        bookingGrowthStat?.previousValue,
      ),
      revenue: computeGrowth(
        revenueGrowthStat?.currentValue,
        revenueGrowthStat?.previousValue,
      ),
    },
  };
};

export const getDashboardBookingStatus = async () => {
  const [[paidStat]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM bookings b
     INNER JOIN payments p ON p.booking_id = b.id
     WHERE b.trang_thai = 'confirmed'
       AND p.status = 'paid'
       AND ${NON_COD_METHOD_CONDITION}`,
  );

  const [[codStat]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM bookings b
     INNER JOIN payments p ON p.booking_id = b.id
     WHERE b.trang_thai = 'confirmed'
       AND p.status IN ('pending', 'paid')
       AND ${COD_METHOD_CONDITION}`,
  );

  const [[pendingStat]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE (
        b.trang_thai = 'pending'
        OR (
          b.trang_thai = 'confirmed'
          AND (p.id IS NULL OR (p.status = 'pending' AND ${NON_COD_METHOD_CONDITION}))
        )
     )`,
  );

  const [[cancelledStat]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM bookings WHERE trang_thai = 'cancelled'",
  );

  return {
    paid: toNumber(paidStat?.total),
    cod: toNumber(codStat?.total),
    pending: toNumber(pendingStat?.total),
    cancelled: toNumber(cancelledStat?.total),
  };
};

const monthLabelFromKey = (monthKey) => {
  const [yearText, monthText] = String(monthKey || "").split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!year || !month) {
    return "";
  }

  const shortMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return shortMonths[Math.max(0, Math.min(11, month - 1))];
};

export const getDashboardRevenueChart = async () => {
  const [rows] = await pool.execute(
    `SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS month_key,
            COALESCE(SUM(p.amount), 0) AS revenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid'
       AND b.trang_thai = 'confirmed'
       AND ${NON_COD_METHOD_CONDITION}
     GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
     ORDER BY month_key DESC
     LIMIT 12`,
  );

  return rows
    .slice()
    .reverse()
    .map((item) => ({
      month: monthLabelFromKey(item.month_key),
      revenue: toNumber(item.revenue),
      monthKey: item.month_key,
    }));
};

const getFillRatioPercent = (bookedSlots, maxSlots) => {
  const max = toNumber(maxSlots);
  const booked = toNumber(bookedSlots);
  if (max <= 0) return 0;

  return Number(((booked / max) * 100).toFixed(0));
};

export const getDashboardAlerts = async () => {
  const [scheduleRows] = await pool.execute(
    `SELECT ts.id,
            t.ten_tour,
            DATE_FORMAT(ts.start_date, '%Y-%m-%d') AS start_date,
            COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da) AS max_slots,
            ts.min_required_ratio,
            DATEDIFF(ts.start_date, CURDATE()) AS days_left,
            COALESCE(
              SUM(CASE WHEN b.trang_thai IN ('pending', 'confirmed') THEN b.so_nguoi ELSE 0 END),
              0
            ) AS booked_slots
     FROM tour_schedules ts
     INNER JOIN tours t ON t.id = ts.tour_id
     LEFT JOIN bookings b ON b.schedule_id = ts.id
     WHERE ts.start_date >= CURDATE()
     GROUP BY ts.id, t.ten_tour, ts.start_date, ts.max_slots, t.so_nguoi_toi_da, ts.min_required_ratio
     HAVING booked_slots / NULLIF(COALESCE(NULLIF(ts.max_slots, 0), t.so_nguoi_toi_da), 0) < ts.min_required_ratio
        AND DATEDIFF(ts.start_date, CURDATE()) BETWEEN 0 AND 7
     ORDER BY ts.start_date ASC`,
  );

  const scheduleAlerts = scheduleRows.map((item) => {
    const daysLeft = toNumber(item.days_left);
    const fillPercent = getFillRatioPercent(item.booked_slots, item.max_slots);
    const minPercent = Number(toNumber(item.min_required_ratio) * 100);
    const type = daysLeft <= 2 ? "risk" : "low";

    return {
      id: `schedule-${item.id}`,
      type,
      message:
        type === "risk"
          ? `Tour ${item.ten_tour} có nguy cơ hủy (${fillPercent}%/${minPercent}%), khởi hành sau ${daysLeft} ngày.`
          : `Tour ${item.ten_tour} đang thiếu khách (${fillPercent}%/${minPercent}%), còn ${daysLeft} ngày đến ngày khởi hành.`,
    };
  });

  const [paymentRows] = await pool.execute(
    `SELECT p.id,
            b.id AS booking_id,
            t.ten_tour
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     INNER JOIN tours t ON t.id = b.tour_id
     WHERE p.status = 'pending'
       AND b.trang_thai IN ('pending', 'confirmed')
     ORDER BY p.created_at ASC
     LIMIT 10`,
  );

  const paymentAlerts = paymentRows.map((item) => ({
    id: `payment-${item.id}`,
    type: "payment",
    message: `Booking #${item.booking_id} (${item.ten_tour}) chưa được xác nhận thanh toán.`,
  }));

  return [...scheduleAlerts, ...paymentAlerts].slice(0, 20);
};
