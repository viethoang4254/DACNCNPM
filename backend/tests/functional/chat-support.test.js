import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, loginByEnv, asPositiveInt, randomText, skipReason } from "./helpers/apiTestHelper.js";

const skip = skipReason([
  "TEST_CUSTOMER_EMAIL",
  "TEST_CUSTOMER_PASSWORD",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
]);

test("TC17 - Customer/Admin chat send-receive flow works", { skip: skip || undefined }, async () => {
  const customerToken = await loginByEnv("customer");
  const adminToken = await loginByEnv("admin");

  const startRes = await apiRequest("/api/chat/start", {
    method: "POST",
    token: customerToken,
  });

  assert.ok([200, 201].includes(startRes.status));
  const conversationId = asPositiveInt(startRes.payload?.data?.id);
  assert.ok(conversationId > 0);

  const customerMessage = randomText("customer_msg");
  const sendRes = await apiRequest("/api/chat/send", {
    method: "POST",
    token: customerToken,
    body: {
      conversationId,
      message: customerMessage,
    },
  });

  assert.equal(sendRes.status, 201);
  assert.equal(Boolean(sendRes.payload?.success), true);

  const adminReply = randomText("admin_reply");
  const replyRes = await apiRequest("/api/chat/reply", {
    method: "POST",
    token: adminToken,
    body: {
      conversationId,
      content: adminReply,
      message_type: "text",
    },
  });

  assert.equal(replyRes.status, 201);
  assert.equal(Boolean(replyRes.payload?.success), true);

  const readRes = await apiRequest(`/api/chat/messages/${conversationId}?limit=20&offset=0`, {
    token: customerToken,
  });

  assert.equal(readRes.status, 200);
  assert.equal(Boolean(readRes.payload?.success), true);
  const messages = Array.isArray(readRes.payload?.data) ? readRes.payload.data : [];
  assert.ok(messages.length >= 2);
});
