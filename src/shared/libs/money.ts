/**
 * Money utilities — all internal amounts are stored as integer cents.
 * Use toCents() at system boundaries (user input) and toDollars() for display.
 */

// Tolerance for IEEE-754 float error when deciding whether a dollar amount lands on a
// whole-cent boundary. $0.005 * 100 = 0.4999999... in binary; we treat anything within
// this epsilon of an integer cent as that integer cent (robust rounding), and reject
// anything that genuinely carries a fractional cent (e.g. $10.005, $19.999).
const CENT_EPSILON = 1e-6;

/**
 * Convert a dollar amount to integer cents.
 *
 * Throws if the input is not a finite number, OR if it does not represent a whole number
 * of cents (within float tolerance). Silently rounding fractional-cent inputs (the old
 * behavior) hides boundary/units bugs at money-handling sites, so they are surfaced instead.
 */
export function toCents(dollars: number): number {
  if (!Number.isFinite(dollars)) {
    throw new Error(`toCents: expected a finite number, received ${dollars}`);
  }
  const exactCents = dollars * 100;
  const rounded = Math.round(exactCents);
  if (Math.abs(exactCents - rounded) > CENT_EPSILON) {
    throw new Error(
      `toCents: ${dollars} is not a whole number of cents (got ${exactCents}). ` +
        `Round to the nearest cent before converting.`,
    );
  }
  // Normalize -0 to 0 and return the epsilon-tolerant rounded integer.
  return rounded === 0 ? 0 : rounded;
}

/**
 * Convert integer cents to a dollar amount for display.
 * Validates that the input is a non-negative integer; internal amounts must never be
 * negative or fractional, so a sign/units error is surfaced rather than rendered.
 */
export function toDollars(cents: number): number {
  assertNonNegativeIntegerCents(cents, 'toDollars');
  return cents / 100;
}

/** Format cents as a dollar string (e.g., 4999 → "$49.99"). */
export function formatCents(cents: number): string {
  assertNonNegativeIntegerCents(cents, 'formatCents');
  return `$${(cents / 100).toFixed(2)}`;
}

/** Guard that an amount is a non-negative integer number of cents. */
function assertNonNegativeIntegerCents(cents: number, fn: string): void {
  if (!Number.isInteger(cents)) {
    throw new Error(`${fn}: expected an integer number of cents, received ${cents}`);
  }
  if (cents < 0) {
    throw new Error(`${fn}: expected a non-negative amount of cents, received ${cents}`);
  }
}
