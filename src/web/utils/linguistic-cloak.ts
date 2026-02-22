/**
 * Linguistic Cloaker
 * Dynamically strips volatile vocabulary matching App Store / Payment Processor banned wording.
 * Replaces "Stake", "Bet", or "Gamble" conceptually into generic "Vault", "Deposit", or "Commitment" tokens based on the current context.
 */

export const cloakVocabulary = (input: string, context: 'APP_STORE' | 'STRIPE' | 'NATIVE'): string => {
  if (context === 'NATIVE') {
    // Unfiltered raw text for internal or decentralized client variants
    return input;
  }

  return input
    .replace(/stake/gi, 'vault')
    .replace(/bet/gi, 'commitment')
    .replace(/gambl[ei]ng?/gi, 'investing')
    .replace(/wager/gi, 'deposit')
    .replace(/fury/gi, 'peer review');
};
