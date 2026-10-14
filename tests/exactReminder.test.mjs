import assert from "node:assert/strict";
import { test } from "node:test";
import { getExactReminderAt } from "../src/utils/exactReminder.ts";

const now = new Date("2026-10-01T12:00:00-06:00");
const expiration = new Date("2026-10-10T15:00:00-06:00");

test("an exact reminder accepts a future date before expiration", () => {
  assert.equal(getExactReminderAt("2026-10-09T09:00", expiration, now)?.toISOString(), "2026-10-09T15:00:00.000Z");
});

test("an exact reminder rejects dates at or after expiration", () => {
  assert.equal(getExactReminderAt("2026-10-10T15:00", expiration, now), null);
  assert.equal(getExactReminderAt("2026-10-11T09:00", expiration, now), null);
});

test("an exact reminder rejects past and invalid dates", () => {
  assert.equal(getExactReminderAt("2026-09-30T09:00", expiration, now), null);
  assert.equal(getExactReminderAt("not-a-date", expiration, now), null);
  assert.equal(getExactReminderAt("", expiration, now), null);
});
