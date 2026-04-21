import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, randomEmail, RUN_FUNCTIONAL, skipReason } from "./helpers/apiTestHelper.js";

const authSkip = skipReason([]);

test("TC01 - Login success returns token", { skip: authSkip || undefined }, async () => {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: process.env.TEST_CUSTOMER_EMAIL,
      mat_khau: process.env.TEST_CUSTOMER_PASSWORD,
    },
  });

  assert.equal(res.status, 200);
  assert.equal(Boolean(res.payload?.success), true);
  assert.ok(res.payload?.data?.token);
});

test("TC02 - Login wrong password shows auth error", { skip: authSkip || undefined }, async () => {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: process.env.TEST_CUSTOMER_EMAIL,
      mat_khau: `${process.env.TEST_CUSTOMER_PASSWORD}_wrong`,
    },
  });

  assert.equal(res.status, 401);
  assert.equal(Boolean(res.payload?.success), false);
});

test("TC03 - Register new account success", { skip: RUN_FUNCTIONAL ? undefined : "Set TEST_RUN_FUNCTIONAL=1" }, async () => {
  const email = randomEmail("register_ok");
  const res = await apiRequest("/api/auth/register", {
    method: "POST",
    body: {
      ho_ten: "TC Register",
      email,
      mat_khau: "123456",
      so_dien_thoai: `09${Math.floor(1_000_00000 + Math.random() * 9_000_00000)}`,
    },
  });

  assert.equal(res.status, 201);
  assert.equal(Boolean(res.payload?.success), true);
});

test("TC04 - Register duplicate email returns conflict", { skip: authSkip || undefined }, async () => {
  const duplicateEmail = process.env.TEST_CUSTOMER_EMAIL;

  const res = await apiRequest("/api/auth/register", {
    method: "POST",
    body: {
      ho_ten: "TC Register Duplicate",
      email: duplicateEmail,
      mat_khau: "123456",
      so_dien_thoai: `09${Math.floor(1_000_00000 + Math.random() * 9_000_00000)}`,
    },
  });

  assert.equal(res.status, 409);
  assert.equal(Boolean(res.payload?.success), false);
  assert.match(String(res.payload?.message || ""), /email/i);
});
