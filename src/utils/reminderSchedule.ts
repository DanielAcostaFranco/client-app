import type { ReminderDraft } from "@/types/reminders";

export function getReminderTime(expiration: Date, reminder: ReminderDraft): Date | null {
  if (Number.isNaN(expiration.getTime()) || !Number.isInteger(reminder.amount) || reminder.amount < 1 || reminder.amount > 9999) {
    return null;
  }

  const result = new Date(expiration);
  switch (reminder.unit) {
    case "seconds":
      result.setTime(result.getTime() - reminder.amount * 1000);
      break;
    case "minutes":
      result.setTime(result.getTime() - reminder.amount * 60_000);
      break;
    case "hours":
      result.setTime(result.getTime() - reminder.amount * 3_600_000);
      break;
    case "days":
      result.setDate(result.getDate() - reminder.amount);
      break;
    case "weeks":
      result.setDate(result.getDate() - reminder.amount * 7);
      break;
    case "months": {
      const originalDay = result.getDate();
      result.setDate(1);
      result.setMonth(result.getMonth() - reminder.amount);
      const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(originalDay, lastDay));
      break;
    }
    case "years": {
      const originalDay = result.getDate();
      result.setDate(1);
      result.setFullYear(result.getFullYear() - reminder.amount);
      const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(originalDay, lastDay));
      break;
    }
  }

  if (["days", "weeks", "months", "years"].includes(reminder.unit) && reminder.notificationTime) {
    const match = /^(\d{2}):(\d{2})$/.exec(reminder.notificationTime);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
    result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }

  return result;
}
