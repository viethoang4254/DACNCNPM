import assert from "node:assert/strict";

export const RUN_FUNCTIONAL = process.env.TEST_RUN_FUNCTIONAL === "1";
export const API_BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:5000";

const tokenCache = new Map();

function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
}

export function randomText(prefix = "test") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export function randomEmail(prefix = "test") {
  return `${randomText(prefix)}@example.com`;
}

export function missingEnv(keys) {
  return keys.filter((key) => !process.env[key]);
}

export function skipReason(keys) {
  const missing = missingEnv(keys);
  if (!RUN_FUNCTIONAL) {
    return "Set TEST_RUN_FUNCTIONAL=1 to run functional API tests.";
  }
  if (missing.length > 0) {
    return `Missing env: ${missing.join(", ")}`;
  }
  return "";
}

export async function loginByEnv(role) {
  const emailKey = role === "admin" ? "TEST_ADMIN_EMAIL" : "TEST_CUSTOMER_EMAIL";
  const passwordKey = role === "admin" ? "TEST_ADMIN_PASSWORD" : "TEST_CUSTOMER_PASSWORD";

  const cacheKey = `${role}:${process.env[emailKey]}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }

  const loginRes = await apiRequest("/api/auth/login", {
    method: "POST",
    body: {
      email: process.env[emailKey],
      mat_khau: process.env[passwordKey],
    },
  });

  assert.equal(loginRes.status, 200, `Login failed for ${role}`);
  assert.equal(Boolean(loginRes.payload?.success), true, `Login success=false for ${role}`);

  const token = loginRes.payload?.data?.token;
  assert.ok(token, `Missing token for ${role}`);

  tokenCache.set(cacheKey, token);
  return token;
}

export function asPositiveInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
