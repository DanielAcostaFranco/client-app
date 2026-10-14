export function getExactReminderAt(value: string, expiration: Date, now = new Date()): Date | null {
  if (!value) return null;
  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime()) || scheduled <= now || scheduled >= expiration) return null;
  return scheduled;
}
