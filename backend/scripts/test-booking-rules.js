import "dotenv/config";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";
import { createBooking, cancelBooking } from "../src/services/bookingService.js";

function randomSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

async function createUser(connection, label) {
  const email = `booking_test_${label}_${randomSuffix()}@example.com`;
  const [result] = await connection.execute(
    `INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, role)
     VALUES (?, ?, ?, ?, 'customer')`,
    [`Booking Test ${label}`, email, "test_password_hash", `090${Math.floor(Math.random() * 1_000_0000).toString().padStart(7, "0")}`],
  );
  return Number(result.insertId);
}

async function createTour(connection, label, maxPeople = 10) {
  const [result] = await connection.execute(
    `INSERT INTO tours (
      ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `Tour Booking Test ${label}`,
      "Tour test cho booking rules",
      1000000,
      "Ha Noi",
      "Ha Noi",
      "Xe",
      3,
      maxPeople,
    ],
  );
  return Number(result.insertId);
}

async function createSchedule(connection, tourId, maxSlots = 10, daysFromNow = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysFromNow);
  const yyyy = startDate.getFullYear();
  const mm = String(startDate.getMonth() + 1).padStart(2, "0");
  const dd = String(startDate.getDate()).padStart(2, "0");
  const dateKey = `${yyyy}-${mm}-${dd}`;

  const [result] = await connection.execute(
    `INSERT INTO tour_schedules (
      tour_id, start_date, max_slots, booked_slots, available_slots, status, min_required_ratio
    ) VALUES (?, ?, ?, 0, ?, 'open', 0.50)`,
    [tourId, dateKey, maxSlots, maxSlots],
  );

  return Number(result.insertId);
}

async function cleanupData({ bookingIds = [], scheduleIds = [], tourIds = [], userIds = [] }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const bookingId of bookingIds) {
      await connection.execute("DELETE FROM payments WHERE booking_id = ?", [bookingId]);
      await connection.execute("DELETE FROM bookings WHERE id = ?", [bookingId]);
    }

    for (const scheduleId of scheduleIds) {
      await connection.execute("DELETE FROM tour_schedules WHERE id = ?", [scheduleId]);
    }

    for (const tourId of tourIds) {
      await connection.execute("DELETE FROM tours WHERE id = ?", [tourId]);
    }

    for (const userId of userIds) {
      await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function testDuplicateBookingBlocked() {
  const meta = { bookingIds: [], scheduleIds: [], tourIds: [], userIds: [] };

  try {
    const connection = await pool.getConnection();
    try {
      const userId = await createUser(connection, "duplicate");
      const tourId = await createTour(connection, "duplicate", 10);
      const scheduleId = await createSchedule(connection, tourId, 10, 9);

      meta.userIds.push(userId);
      meta.tourIds.push(tourId);
      meta.scheduleIds.push(scheduleId);
    } finally {
      connection.release();
    }

    const first = await createBooking({
      userId: meta.userIds[0],
      scheduleId: meta.scheduleIds[0],
      quantity: 2,
    });
    assert.equal(first.success, true, "Booking đầu tiên phải thành công");
    meta.bookingIds.push(Number(first?.data?.id || 0));

    const second = await createBooking({
      userId: meta.userIds[0],
      scheduleId: meta.scheduleIds[0],
      quantity: 1,
    });

    assert.equal(second.success, false, "Booking trùng phải bị chặn");
    assert.equal(second.statusCode, 409, "Booking trùng phải trả về 409");
    assert.equal(second.message, "Bạn đã đặt tour này rồi");

    console.log("PASS - Duplicate active booking is blocked");
  } finally {
    await cleanupData(meta);
  }
}

async function testRebookAfterCancelled() {
  const meta = { bookingIds: [], scheduleIds: [], tourIds: [], userIds: [] };

  try {
    const connection = await pool.getConnection();
    try {
      const userId = await createUser(connection, "rebook");
      const tourId = await createTour(connection, "rebook", 10);
      const scheduleId = await createSchedule(connection, tourId, 10, 8);

      meta.userIds.push(userId);
      meta.tourIds.push(tourId);
      meta.scheduleIds.push(scheduleId);
    } finally {
      connection.release();
    }

    const first = await createBooking({
      userId: meta.userIds[0],
      scheduleId: meta.scheduleIds[0],
      quantity: 1,
    });

    assert.equal(first.success, true, "Booking đầu tiên phải thành công");
    const firstBookingId = Number(first?.data?.id || 0);
    meta.bookingIds.push(firstBookingId);

    const tx = await pool.getConnection();
    try {
      await tx.beginTransaction();
      const cancelled = await cancelBooking({
        bookingId: firstBookingId,
        userId: meta.userIds[0],
        cancelReason: "test rebook",
        connection: tx,
      });
      assert.equal(cancelled.success, true, "Cancel booking phải thành công");
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.release();
    }

    const rebook = await createBooking({
      userId: meta.userIds[0],
      scheduleId: meta.scheduleIds[0],
      quantity: 1,
    });

    assert.equal(rebook.success, true, "Phải cho phép đặt lại sau khi booking bị huỷ");
    meta.bookingIds.push(Number(rebook?.data?.id || 0));

    console.log("PASS - Rebooking after cancelled is allowed");
  } finally {
    await cleanupData(meta);
  }
}

async function testConcurrentBookingNoOversell() {
  const meta = { bookingIds: [], scheduleIds: [], tourIds: [], userIds: [] };

  try {
    const connection = await pool.getConnection();
    try {
      const userId1 = await createUser(connection, "race_u1");
      const userId2 = await createUser(connection, "race_u2");
      const tourId = await createTour(connection, "race", 1);
      const scheduleId = await createSchedule(connection, tourId, 1, 7);

      meta.userIds.push(userId1, userId2);
      meta.tourIds.push(tourId);
      meta.scheduleIds.push(scheduleId);
    } finally {
      connection.release();
    }

    const [r1, r2] = await Promise.all([
      createBooking({ userId: meta.userIds[0], scheduleId: meta.scheduleIds[0], quantity: 1 }),
      createBooking({ userId: meta.userIds[1], scheduleId: meta.scheduleIds[0], quantity: 1 }),
    ]);

    const successCount = [r1, r2].filter((r) => r?.success).length;
    const failedCount = [r1, r2].filter((r) => !r?.success).length;

    assert.equal(successCount, 1, "Chỉ 1 booking được phép thành công khi còn 1 slot");
    assert.equal(failedCount, 1, "Booking còn lại phải thất bại");

    for (const result of [r1, r2]) {
      if (result?.success) {
        meta.bookingIds.push(Number(result?.data?.id || 0));
      }
    }

    const [[schedule]] = await pool.execute(
      "SELECT max_slots, booked_slots, available_slots FROM tour_schedules WHERE id = ? LIMIT 1",
      [meta.scheduleIds[0]],
    );

    assert.ok(Number(schedule.booked_slots) <= Number(schedule.max_slots), "booked_slots không được vượt max_slots");
    assert.ok(Number(schedule.available_slots) >= 0, "available_slots không được âm");

    console.log("PASS - Concurrent booking does not oversell slots");
  } finally {
    await cleanupData(meta);
  }
}

async function main() {
  console.log("Running booking rules integration tests...");

  await testDuplicateBookingBlocked();
  await testRebookAfterCancelled();
  await testConcurrentBookingNoOversell();

  console.log("All booking rule tests passed.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Booking rule tests failed:", error);
    await pool.end();
    process.exit(1);
  });
