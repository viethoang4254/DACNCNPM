import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, randomText, skipReason } from "./helpers/apiTestHelper.js";

const skip = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

let createdTourId = 0;

test("TC08 - Admin creates tour", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");

  const res = await apiRequest("/api/tours", {
    method: "POST",
    token: adminToken,
    body: {
      ten_tour: randomText("TC Tour"),
      mo_ta: "Automated functional test",
      gia: 1500000,
      tinh_thanh: "Ha Noi",
      diem_khoi_hanh: "Ha Noi",
      phuong_tien: "Xe",
      so_ngay: 2,
      so_nguoi_toi_da: 10,
    },
  });

  assert.equal(res.status, 201);
  assert.equal(Boolean(res.payload?.success), true);
  createdTourId = Number(res.payload?.data?.id || 0);
  assert.ok(createdTourId > 0);
});

test("TC09 - Admin updates tour", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");
  assert.ok(createdTourId > 0, "TC08 must create tour first");

  const res = await apiRequest(`/api/tours/${createdTourId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      ten_tour: randomText("TC Tour Updated"),
      mo_ta: "Updated by functional test",
      gia: 1700000,
      tinh_thanh: "Da Nang",
      diem_khoi_hanh: "Da Nang",
      phuong_tien: "May bay",
      so_ngay: 3,
      so_nguoi_toi_da: 12,
    },
  });

  assert.equal(res.status, 200);
  assert.equal(Boolean(res.payload?.success), true);
});
