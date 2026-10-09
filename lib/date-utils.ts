/**
 * Date helpers for date-only values stored in the database.
 *
 * Avoid toISOString() for calendar dates: it converts to UTC and can
 * select yesterday or tomorrow for users in other time zones.
 */

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateDaysAgo(days: number, from: Date = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() - days);

  return getLocalDateString(date);
}
