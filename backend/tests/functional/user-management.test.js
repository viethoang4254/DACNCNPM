import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, randomEmail, randomText, skipReason } from "./helpers/apiTestHelper.js";

const skip = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

let createdUserId = 0;

test("TC05 - Admin creates user", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");
  const email = randomEmail("admin_create_user");

  const res = await apiRequest("/api/users", {
    method: "POST",
    token: adminToken,
    body: {
      ho_ten: "TC User Create",
      email,
      so_dien_thoai: `09${Math.floor(1_000_00000 + Math.random() * 9_000_00000)}`,
      mat_khau: "123456",
      role: "customer",
    },
  });

  assert.equal(res.status, 201);
  assert.equal(Boolean(res.payload?.success), true);
  createdUserId = Number(res.payload?.data?.id || 0);
  assert.ok(createdUserId > 0);
});

test("TC06 - Admin updates user", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");
  assert.ok(createdUserId > 0, "TC05 must create user first");

  const nextName = randomText("Updated_User");
  const res = await apiRequest(`/api/users/${createdUserId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      ho_ten: nextName,
      email: randomEmail("admin_update_user"),
      so_dien_thoai: `09${Math.floor(1_000_00000 + Math.random() * 9_000_00000)}`,
      mat_khau: "123456",
      role: "customer",
    },
  });

  assert.equal(res.status, 200);
  assert.equal(Boolean(res.payload?.success), true);
});

test("TC07 - Admin deletes user", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");
  assert.ok(createdUserId > 0, "TC05 must create user first");

  const res = await apiRequest(`/api/users/${createdUserId}`, {
    method: "DELETE",
    token: adminToken,
  });

  assert.equal(res.status, 200);
  assert.equal(Boolean(res.payload?.success), true);
});
