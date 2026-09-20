/** Browser storage identifiers are disposable, not device attestations.
 * Omit deviceFingerprint until a separately verified browser signal exists.
 * This deliberately makes no claim of browser device-based Sybil prevention.
 */
export function browserRegistrationOptions(dateOfBirth: string) {
  return { ageConfirmation: true, termsAccepted: true, dateOfBirth };
}
