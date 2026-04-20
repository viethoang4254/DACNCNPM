import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, skipReason } from "./helpers/apiTestHelper.js";

const skipBase = skipReason(["TEST_CUSTOMER_EMAIL", "TEST_CUSTOMER_PASSWORD"]);

let createdBookingId = 0;

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

export function getCreatedBookingId() {
  return createdBookingId;
}
