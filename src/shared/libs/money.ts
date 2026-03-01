/**
 * Money utilities — all internal amounts are stored as integer cents.
 * Use toCents() at system boundaries (user input) and toDollars() for display.
 */

/** Convert a dollar amount to integer cents. Throws if the result is not an integer. */
export function toCents(dollars: number): number {
  const cents = Math.round(dollars * 100);
  return cents;
}

/** Convert integer cents to a dollar amount for display. */
export function toDollars(cents: number): number {
  return cents / 100;
}

/** Format cents as a dollar string (e.g., 4999 → "$49.99"). */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
