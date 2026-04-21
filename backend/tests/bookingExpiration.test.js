import test from "node:test";
import assert from "node:assert/strict";
import { getBookingPendingCutoff, getPendingExpireMinutes } from "../src/utils/bookingExpiration.js";

const ORIGINAL_ENV_VALUE = process.env.BOOKING_PENDING_EXPIRE_MINUTES;

function withEnv(value, fn) {
  const previous = process.env.BOOKING_PENDING_EXPIRE_MINUTES;
  if (value === undefined) {
    delete process.env.BOOKING_PENDING_EXPIRE_MINUTES;
  } else {
    process.env.BOOKING_PENDING_EXPIRE_MINUTES = value;
  }

  try {
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.BOOKING_PENDING_EXPIRE_MINUTES;
    } else {
      process.env.BOOKING_PENDING_EXPIRE_MINUTES = previous;
    }
  }
}

test("getPendingExpireMinutes uses default when env is missing", () => {
  withEnv(undefined, () => {
    assert.equal(getPendingExpireMinutes(), 15);
  });
});

test("getPendingExpireMinutes clamps configured value into supported range", () => {
  withEnv("3", () => {
    assert.equal(getPendingExpireMinutes(), 10);
  });

  withEnv("30", () => {
    assert.equal(getPendingExpireMinutes(), 15);
  });
});

test("getBookingPendingCutoff returns mysql datetime string", () => {
  const originalNow = Date.now;
  Date.now = () => new Date("2026-04-20T12:00:00.000Z").getTime();

  try {
    assert.equal(getBookingPendingCutoff(15), "2026-04-20 11:45:00");
  } finally {
    Date.now = originalNow;
  }
});

test.after(() => {
  if (ORIGINAL_ENV_VALUE === undefined) {
    delete process.env.BOOKING_PENDING_EXPIRE_MINUTES;
  } else {
    process.env.BOOKING_PENDING_EXPIRE_MINUTES = ORIGINAL_ENV_VALUE;
  }
});