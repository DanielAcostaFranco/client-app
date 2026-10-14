export const REMINDER_UNITS = [
  "seconds",
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "years",
] as const;

export type ReminderUnit = (typeof REMINDER_UNITS)[number];

export type ReminderDraft = {
  amount: number;
  unit: ReminderUnit;
  message: string;
};

export const REMINDER_UNIT_LABELS: Record<ReminderUnit, string> = {
  seconds: "seconds",
  minutes: "minutes",
  hours: "hours",
  days: "days",
  weeks: "weeks",
  months: "months",
  years: "years",
};

export function reminderLabel(reminder: ReminderDraft) {
  return `${reminder.amount} ${REMINDER_UNIT_LABELS[reminder.unit]}`;
}
