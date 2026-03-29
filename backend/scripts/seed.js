import mysql from "mysql2/promise";
import { faker } from "@faker-js/faker";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "2701",
  database: "vietxanh_travel",
});

const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const categories = ["Hà Nội", "Đà Nẵng", "Hạ Long", "Phú Quốc", "Sapa"];

async function run() {
  const conn = await pool.getConnection();

  try {
    console.log("🚀 Start seeding...");

    const [users] = await conn.query(
      "SELECT id FROM users WHERE role = 'customer' LIMIT 50"
    );

    if (users.length === 0) {
      console.log("⚠️ No users found");
      return;
    }

    // -----------------
    // CREATE TOURS
    // -----------------
    for (let i = 0; i < 100; i++) {
      const name = `Tour ${faker.location.city()} ${i}`;
      const price = random(1000000, 10000000);

      const [tourResult] = await conn.query(
        `INSERT INTO tours 
        (ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          faker.lorem.paragraph(),
          price,
          categories[random(0, categories.length - 1)],
          "TP.HCM",
          "Xe + Máy bay",
          random(2, 7),
          random(20, 50),
        ]
      );

      const tourId = tourResult.insertId;

      // ITINERARY
      const days = random(2, 5);
      for (let d = 1; d <= days; d++) {
        await conn.query(
          `INSERT INTO tour_itineraries (tour_id, day_number, title, description)
           VALUES (?, ?, ?, ?)`,
          [
            tourId,
            d,
            `Day ${d}`,
            faker.lorem.paragraph(),
          ]
        );
      }

      // SCHEDULE
      for (let s = 0; s < 2; s++) {
        const maxSlots = random(20, 40);
        const bookedSlots = random(5, maxSlots);

        await conn.query(
          `INSERT INTO tour_schedules 
          (tour_id, start_date, max_slots, booked_slots, available_slots, status)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            tourId,
            faker.date.future(),
            maxSlots,
            bookedSlots,
            maxSlots - bookedSlots,
            "open",
          ]
        );
      }
    }

    console.log("✅ Created tours");

    // -----------------
    // BOOKINGS + PAYMENT
    // -----------------
    const [schedules] = await conn.query(
      "SELECT * FROM tour_schedules LIMIT 200"
    );

    for (let i = 0; i < 200; i++) {
      const user = users[random(0, users.length - 1)];
      const schedule = schedules[random(0, schedules.length - 1)];

      const people = random(1, 5);
      const total = people * random(500000, 2000000);

      const isCancel = Math.random() < 0.3;

      const [bookingResult] = await conn.query(
        `INSERT INTO bookings 
        (user_id, tour_id, schedule_id, so_nguoi, tong_tien, trang_thai)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          schedule.tour_id,
          schedule.id,
          people,
          total,
          isCancel ? "cancelled" : "confirmed",
        ]
      );

      const bookingId = bookingResult.insertId;

      await conn.query(
        `INSERT INTO payments (booking_id, amount, method, status)
         VALUES (?, ?, ?, ?)`,
        [
          bookingId,
          total,
          "bank",
          isCancel ? "refunded" : "paid",
        ]
      );

      if (isCancel) {
        await conn.query(
          `UPDATE bookings 
           SET cancelled_at = NOW(),
               cancel_reason = 'User cancel',
               refund_amount = ?,
               refund_status = 'processed',
               cancelled_by = 'user'
           WHERE id = ?`,
          [total, bookingId]
        );
      }
    }

    console.log("⭐ Seeding reviews...");

    // -----------------
    // REVIEWS (FIXED)
    // -----------------
    const [tours] = await conn.query("SELECT id FROM tours LIMIT 100");

    for (const tour of tours) {
      const reviewCount = random(2, 8);

      for (let i = 0; i < reviewCount; i++) {
        const user = users[random(0, users.length - 1)];
        const rating = random(3, 5);

        const comment =
          rating >= 4
            ? faker.lorem.sentences(2)
            : faker.lorem.sentences(1);

        try {
          await conn.query(
            `INSERT INTO reviews (user_id, tour_id, rating, comment)
             VALUES (?, ?, ?, ?)`,
            [user.id, tour.id, rating, comment]
          );
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") continue;
          throw err;
        }
      }
    }

    console.log("🎉 Done!");
  } catch (err) {
    console.error(err);
  } finally {
    conn.release();
    process.exit();
  }
}

run();