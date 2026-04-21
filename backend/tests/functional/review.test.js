import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, randomText, skipReason } from "./helpers/apiTestHelper.js";

const skipCustomer = skipReason(["TEST_CUSTOMER_EMAIL", "TEST_CUSTOMER_PASSWORD"]);
const skipAdmin = skipReason(["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"]);

let createdReviewId = 0;

test("TC15 - User submits tour review", { skip: skipCustomer || undefined }, async () => {
  const tourId = asPositiveInt(process.env.TEST_COMPLETED_TOUR_ID);
  if (!tourId) {
    test.skip("Set TEST_COMPLETED_TOUR_ID for TC15");
    return;
  }

  const token = await loginByEnv("customer");
  const res = await apiRequest("/api/reviews", {
    method: "POST",
    token,
    body: {
      tour_id: tourId,
      rating: 5,
      comment: randomText("Good tour"),
    },
  });

  assert.ok([201, 409].includes(res.status));
  if (res.status === 201) {
    assert.equal(Boolean(res.payload?.success), true);
    createdReviewId = Number(res.payload?.data?.id || 0);
  }
});

test("TC16 - Admin hides/shows review", { skip: (skipCustomer || skipAdmin) || undefined }, async () => {
  let reviewId = createdReviewId;
  if (!reviewId) {
    reviewId = asPositiveInt(process.env.TEST_REVIEW_ID);
  }
  if (!reviewId) {
    test.skip("Set TEST_REVIEW_ID for TC16 (or run TC15 with new review)");
    return;
  }

  const adminToken = await loginByEnv("admin");

  const hideRes = await apiRequest(`/api/admin/reviews/${reviewId}/hide`, {
    method: "PATCH",
    token: adminToken,
  });
  assert.equal(hideRes.status, 200);
  assert.equal(Boolean(hideRes.payload?.success), true);

  const showRes = await apiRequest(`/api/admin/reviews/${reviewId}/show`, {
    method: "PATCH",
    token: adminToken,
  });
  assert.equal(showRes.status, 200);
  assert.equal(Boolean(showRes.payload?.success), true);
});
