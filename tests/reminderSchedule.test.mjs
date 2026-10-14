import assert from "node:assert/strict";
import { test } from "node:test";
import { getReminderTime } from "../src/utils/reminderSchedule.ts";

test("a minute reminder uses the exact expiration instant", () => {
  const expires = new Date("2026-10-10T15:00:00-06:00");
  const reminder = { amount: 1, unit: "minutes", message: "", notificationTime: "09:00" };

  assert.equal(getReminderTime(expires, reminder)?.toISOString(), "2026-10-10T20:59:00.000Z");
});

test("a day reminder uses the selected local time", () => {
  const expires = new Date("2026-10-10T15:00:00-06:00");
  const reminder = { amount: 1, unit: "days", message: "", notificationTime: "09:00" };

  assert.equal(getReminderTime(expires, reminder)?.toISOString(), "2026-10-09T15:00:00.000Z");
});

test("a month reminder clamps to the last day of a shorter month", () => {
  const expires = new Date("2026-03-31T15:00:00-06:00");
  const reminder = { amount: 1, unit: "months", message: "", notificationTime: "09:00" };

  assert.equal(getReminderTime(expires, reminder)?.toISOString(), "2026-02-28T16:00:00.000Z");
});

test("a day reminder keeps the chosen wall clock time across daylight saving time", () => {
  const expires = new Date("2026-03-08T15:00:00-06:00");
  const reminder = { amount: 1, unit: "days", message: "", notificationTime: "09:00" };

  assert.equal(getReminderTime(expires, reminder)?.toISOString(), "2026-03-07T16:00:00.000Z");
});

test("invalid amount is rejected", () => {
  const expires = new Date("2026-10-10T15:00:00-06:00");
  const reminder = { amount: 0, unit: "days", message: "", notificationTime: "09:00" };

  assert.equal(getReminderTime(expires, reminder), null);
});
