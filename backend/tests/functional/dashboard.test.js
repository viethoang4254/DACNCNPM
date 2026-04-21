import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, skipReason } from "./helpers/apiTestHelper.js";

const skip = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

test("TC18 - Admin dashboard summary endpoints return data", { skip: skip || undefined }, async () => {
  const adminToken = await loginByEnv("admin");

  const summaryRes = await apiRequest("/api/dashboard/summary", { token: adminToken });
  assert.equal(summaryRes.status, 200);
  assert.equal(Boolean(summaryRes.payload?.success), true);

  const bookingStatusRes = await apiRequest("/api/dashboard/booking-status", { token: adminToken });
  assert.equal(bookingStatusRes.status, 200);
  assert.equal(Boolean(bookingStatusRes.payload?.success), true);

  const revenueChartRes = await apiRequest("/api/dashboard/revenue-chart", { token: adminToken });
  assert.equal(revenueChartRes.status, 200);
  assert.equal(Boolean(revenueChartRes.payload?.success), true);

  const alertsRes = await apiRequest("/api/dashboard/alerts", { token: adminToken });
  assert.equal(alertsRes.status, 200);
  assert.equal(Boolean(alertsRes.payload?.success), true);
});
