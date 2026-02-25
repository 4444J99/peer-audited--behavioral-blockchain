/**
 * Linguistic Middleware
 * Applies the "Linguistic Cloaking" required by the Gatekeeper Compliance spec.
 * Protects the iOS/Android apps from App Store rejection by replacing
 * gambling-adjacent terminology with wellness/behavioral terminology.
 */

export class LinguisticMiddleware {
  private static readonly DICTIONARY: Record<string, string> = {
    // Exact word matches (case-insensitive)
    'bet': 'commitment',
    'wager': 'pledge',
    'pot': 'vault',
    'stake': 'vault',
    'gambling': 'behavioral economics',
    'casino': 'arena',
    'odds': 'integrity score',

    // Plurals and variations
    'bets': 'commitments',
    'wagers': 'pledges',
    'pots': 'vaults',
    'stakes': 'vaults',
    'staking': 'vaulting',
    'betting': 'committing',
  };

  /**
   * Sanitizes a string of text for UI rendering.
   * e.g. "Place your bet" -&gt; "Place your commitment"
   */
  static sanitizeUiText(text: string): string {
    if (!text) return text;

    let sanitized = text;

    for (const [forbidden, safe] of Object.entries(this.DICTIONARY)) {
      // Regex boundary \b ensures we only replace whole words
      // 'gi' flag for global and case-insensitive
      const regex = new RegExp(`\\b${forbidden}\\b`, 'gi');

      sanitized = sanitized.replace(regex, (match) => {
        // Preserve original capitalization if possible
        if (match === match.toUpperCase()) return safe.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return safe.charAt(0).toUpperCase() + safe.slice(1);
        return safe;
      });
    }

    return sanitized;
  }
}
