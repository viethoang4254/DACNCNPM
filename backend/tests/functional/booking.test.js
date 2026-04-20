import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, skipReason } from "./helpers/apiTestHelper.js";

const skipBase = skipReason(["TEST_CUSTOMER_EMAIL", "TEST_CUSTOMER_PASSWORD"]);

let createdBookingId = 0;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

test("TC10 - Booking success redirects to payment flow", { skip: skipBase || undefined }, async () => {
  const scheduleId = asPositiveInt(process.env.TEST_OPEN_SCHEDULE_ID);
  if (!scheduleId) {
    test.skip("Set TEST_OPEN_SCHEDULE_ID for TC10");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: {
      schedule_id: scheduleId,
      quantity: 1,
    },
  });

  assert.equal(res.status, 201);
  assert.equal(Boolean(res.payload?.success), true);
  createdBookingId = Number(res.payload?.data?.id || 0);
  assert.ok(createdBookingId > 0);
});

test("TC11 - Booking full schedule is blocked", { skip: skipBase || undefined }, async () => {
  const fullScheduleId = asPositiveInt(process.env.TEST_FULL_SCHEDULE_ID);
  if (!fullScheduleId) {
    test.skip("Set TEST_FULL_SCHEDULE_ID for TC11");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: {
      schedule_id: fullScheduleId,
      quantity: 1,
    },
  });

  assert.ok([400, 409].includes(res.status), `Unexpected status: ${res.status}`);
  assert.equal(Boolean(res.payload?.success), false);
});

test("TC19 - Booking success creates pending booking", { skip: skipBase || undefined }, async () => {
  const scheduleId = asPositiveInt(process.env.TEST_OPEN_SCHEDULE_ID_TC19);
  if (!scheduleId) {
    test.skip("Set TEST_OPEN_SCHEDULE_ID_TC19 for TC19");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: {
      schedule_id: scheduleId,
      quantity: 1,
    },
  });

  assert.equal(res.status, 201);
  assert.equal(Boolean(res.payload?.success), true);
  assert.equal(String(res.payload?.data?.booking?.trang_thai || ""), "pending");
  assert.ok(Number(res.payload?.data?.id || 0) > 0);
});

test("TC20 - Booking over available slots returns not enough seats", { skip: skipBase || undefined }, async () => {
  const fullScheduleId = asPositiveInt(process.env.TEST_FULL_SCHEDULE_ID_TC20);
  if (!fullScheduleId) {
    test.skip("Set TEST_FULL_SCHEDULE_ID_TC20 for TC20");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: {
      schedule_id: fullScheduleId,
      quantity: 99,
    },
  });

  assert.equal(res.status, 400);
  assert.equal(Boolean(res.payload?.success), false);
  assert.match(normalizeText(res.payload?.message), /khong du cho/);
});

test("TC21 - Booking past schedule returns departure passed error", { skip: skipBase || undefined }, async () => {
  const pastScheduleId = asPositiveInt(process.env.TEST_PAST_SCHEDULE_ID_TC21);
  if (!pastScheduleId) {
    test.skip("Set TEST_PAST_SCHEDULE_ID_TC21 for TC21");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings", {
    method: "POST",
    token,
    body: {
      schedule_id: pastScheduleId,
      quantity: 1,
    },
  });

  assert.equal(res.status, 400);
  assert.equal(Boolean(res.payload?.success), false);
  assert.match(normalizeText(res.payload?.message), /lich khoi hanh da qua/);
});

test("TC22 - Customer can view booking history", { skip: skipBase || undefined }, async () => {
  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/bookings/my", {
    token,
  });

  assert.equal(res.status, 200);
  assert.equal(Boolean(res.payload?.success), true);
  assert.ok(Array.isArray(res.payload?.data));

  if (res.payload?.data?.length > 0) {
    const first = res.payload.data[0];
    assert.ok(Number(first?.id || 0) > 0);
    assert.ok(typeof first?.trang_thai === "string");
    assert.ok(first?.tong_tien !== undefined);
  }
});

export function getCreatedBookingId() {
  return createdBookingId;
}
