/**
 * ISO week-numbering utility. Extracted from the CLI for testability.
 *
 * Given a date string "YYYY-MM-DD", returns the ISO week as "YYYY-WNN".
 * Uses the ISO 8601 definition: weeks start Monday; the first week of
 * a year is the one containing the first Thursday. The "ISO year" of a
 * date near the start of January or end of December can differ from the
 * Gregorian year (e.g. 2026-01-01 is in ISO year 2026, and 2025-12-29
 * is also in ISO year 2026).
 *
 * Implementation: shift the date to the Thursday of its ISO week, then
 * compute the week number from Jan 1 of the Thursday's year (the ISO
 * year). All math is in UTC to avoid timezone drift — `new Date(s)` for
 * a date-only string parses as UTC, so we use the UTC accessors.
 */
export function isoWeekString(isoDate: string): string {
  const d = new Date(isoDate);
  // Work in UTC. The input is parsed as UTC midnight for date-only
  // strings; getUTCDate returns the same date regardless of timezone.
  // Day of week, with Monday=1, Sunday=7.
  const day = d.getUTCDay() || 7;
  // Shift to the Thursday of this ISO week.
  const utc = new Date(d.getTime());
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const isoYear = utc.getUTCFullYear();
  // Jan 1 of the ISO year.
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  // Week 1 is the week containing the first Thursday.
  const weekNumber = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${isoYear}-W${String(weekNumber).padStart(2, "0")}`;
}
