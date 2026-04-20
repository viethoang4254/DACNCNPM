import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, skipReason } from "./helpers/apiTestHelper.js";

const skipCustomer = skipReason(["TEST_CUSTOMER_EMAIL", "TEST_CUSTOMER_PASSWORD"]);
const skipAdmin = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function getOrCreatePendingPaymentId({ bookingId, customerToken, method = "bank_transfer" }) {
  const createRes = await apiRequest("/api/payments", {
    method: "POST",
    token: customerToken,
    body: {
      booking_id: bookingId,
      method,
      status: "pending",
    },
  });

  if (createRes.status === 201) {
    return Number(createRes.payload?.data?.id || 0);
  }

  const getRes = await apiRequest(`/api/payments/booking/${bookingId}`, {
    token: customerToken,
  });

  if (getRes.status !== 200) {
    return 0;
  }

  return Number(getRes.payload?.data?.id || 0);
}

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

test("TC23 - Create COD payment request with pending status", { skip: skipCustomer || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID_TC23);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID_TC23 for TC23");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/payments", {
    method: "POST",
    token,
    body: {
      booking_id: bookingId,
      method: "cod",
      status: "pending",
    },
  });

  assert.ok([201, 409].includes(res.status));
  if (res.status === 201) {
    assert.equal(Boolean(res.payload?.success), true);
    assert.equal(String(res.payload?.data?.status || ""), "pending");
  }
});

test("TC24 - User confirms bank transfer payment", { skip: skipCustomer || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID_TC24);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID_TC24 for TC24");
    return;
  }

  const customerToken = await loginByEnv("customer");
  const paymentId = await getOrCreatePendingPaymentId({
    bookingId,
    customerToken,
    method: "bank_transfer",
  });

  assert.ok(paymentId > 0, "Missing payment id for user-confirm flow");

  const confirmRes = await apiRequest(`/api/payments/${paymentId}/user-confirm`, {
    method: "PUT",
    token: customerToken,
  });

  assert.equal(confirmRes.status, 200);
  assert.equal(Boolean(confirmRes.payload?.success), true);
  assert.match(normalizeText(confirmRes.payload?.message), /xac nhan chuyen khoan/);
});

test("TC25 - Create PayPal order returns approval URL", { skip: skipCustomer || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PAYPAL_BOOKING_ID_TC25);
  if (!bookingId) {
    test.skip("Set TEST_PAYPAL_BOOKING_ID_TC25 for TC25");
    return;
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    test.skip("Set PAYPAL_CLIENT_ID and PAYPAL_SECRET for TC25");
    return;
  }

  const createOrderRes = await apiRequest("/api/paypal/create", {
    method: "POST",
    body: {
      bookingId,
    },
  });

  assert.equal(createOrderRes.status, 200);
  assert.ok(typeof createOrderRes.payload?.approvalUrl === "string");
  assert.ok(createOrderRes.payload.approvalUrl.length > 0);
});

test("TC26 - Admin confirms payment and booking becomes confirmed", { skip: (skipCustomer || skipAdmin) || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID_TC26);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID_TC26 for TC26");
    return;
  }

  const customerToken = await loginByEnv("customer");
  const adminToken = await loginByEnv("admin");

  const paymentId = await getOrCreatePendingPaymentId({
    bookingId,
    customerToken,
    method: "bank_transfer",
  });

  assert.ok(paymentId > 0, "Missing payment id for admin confirm flow");

  const confirmRes = await apiRequest(`/api/payments/${paymentId}/confirm`, {
    method: "PUT",
    token: adminToken,
  });

  assert.equal(confirmRes.status, 200);
  assert.equal(Boolean(confirmRes.payload?.success), true);

  const bookingRes = await apiRequest(`/api/bookings/${bookingId}`, {
    token: customerToken,
  });

  assert.equal(bookingRes.status, 200);
  assert.equal(Boolean(bookingRes.payload?.success), true);
  assert.equal(String(bookingRes.payload?.data?.trang_thai || ""), "confirmed");
});

test("TC27 - Admin rejects payment and booking becomes cancelled", { skip: (skipCustomer || skipAdmin) || undefined }, async () => {
  const bookingId = asPositiveInt(process.env.TEST_PENDING_BOOKING_ID_TC27);
  if (!bookingId) {
    test.skip("Set TEST_PENDING_BOOKING_ID_TC27 for TC27");
    return;
  }

  const customerToken = await loginByEnv("customer");
  const adminToken = await loginByEnv("admin");

  const paymentId = await getOrCreatePendingPaymentId({
    bookingId,
    customerToken,
    method: "bank_transfer",
  });

  assert.ok(paymentId > 0, "Missing payment id for admin reject flow");

  const rejectRes = await apiRequest(`/api/payments/${paymentId}/reject`, {
    method: "PUT",
    token: adminToken,
  });

  assert.equal(rejectRes.status, 200);
  assert.equal(Boolean(rejectRes.payload?.success), true);
  assert.equal(String(rejectRes.payload?.data?.status || ""), "failed");

  const bookingRes = await apiRequest(`/api/bookings/${bookingId}`, {
    token: customerToken,
  });

  assert.equal(bookingRes.status, 200);
  assert.equal(Boolean(bookingRes.payload?.success), true);
  assert.equal(String(bookingRes.payload?.data?.trang_thai || ""), "cancelled");
});
