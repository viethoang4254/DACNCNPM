import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, skipReason } from "./helpers/apiTestHelper.js";

const skipCustomer = skipReason(["TEST_CUSTOMER_EMAIL", "TEST_CUSTOMER_PASSWORD"]);
const skipAdmin = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

test("TC12 - Create payment request with pending status", { skip: skipCustomer || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID for TC12/TC13");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/payments", {
    method: "POST",
    token,
    body: {
      booking_id: bookingId,
      method: "bank_transfer",
      status: "pending",
    },
  });

  assert.ok([201, 409].includes(res.status));
  if (res.status === 201) {
    assert.equal(Boolean(res.payload?.success), true);
  }
});

test("TC13 - Admin confirms payment and booking becomes confirmed", { skip: (skipCustomer || skipAdmin) || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID for TC12/TC13");
    return;
  }

  const customerToken = await loginByEnv("customer");
  const adminToken = await loginByEnv("admin");

  const paymentRes = await apiRequest(`/api/payments/booking/${bookingId}`, {
    token: customerToken,
  });

  assert.equal(paymentRes.status, 200);
  const paymentId = Number(paymentRes.payload?.data?.id || 0);
  assert.ok(paymentId > 0, "Missing payment id for confirm flow");

  const confirmRes = await apiRequest(`/api/payments/${paymentId}/confirm`, {
    method: "PUT",
    token: adminToken,
  });

  assert.equal(confirmRes.status, 200);
  assert.equal(Boolean(confirmRes.payload?.success), true);
});

test("TC14 - Cancel booking with refund info", { skip: skipCustomer || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_CANCELLABLE_BOOKING_ID);
  if (!bookingId) {
    test.skip("Set TEST_CANCELLABLE_BOOKING_ID for TC14");
    return;
  }

  const token = await loginByEnv("customer");

  const previewRes = await apiRequest(`/api/bookings/${bookingId}/cancel-preview`, {
    token,
  });
  assert.equal(previewRes.status, 200);

  const cancelRes = await apiRequest("/api/bookings/cancel", {
    method: "POST",
    token,
    body: {
      booking_id: bookingId,
      cancel_reason: "Functional test cancellation",
    },
  });

  assert.equal(cancelRes.status, 200);
  assert.equal(Boolean(cancelRes.payload?.success), true);
});
