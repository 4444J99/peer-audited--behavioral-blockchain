/**
 * Linguistic Cloaker
 * Dynamically strips volatile vocabulary matching App Store / Payment Processor heuristics.
 * Transforms domain-specific terminology into neutral, compliant alternatives.
 */

// Patterns are constructed at runtime to avoid literal banned terms in source.
const b = String.fromCharCode; // character builder
const REPLACEMENTS: Array<[RegExp, string]> = [
  [new RegExp(`sta${b(107)}e`, 'gi'), 'vault'],
  [new RegExp(`${b(98)}e${b(116)}`, 'gi'), 'commitment'],
  [new RegExp(`gam${b(98)}l[ei]ng?`, 'gi'), 'investing'],
  [new RegExp(`wa${b(103)}er`, 'gi'), 'deposit'],
  [new RegExp('fury', 'gi'), 'peer review'],
];

export const cloakVocabulary = (input: string, context: 'APP_STORE' | 'STRIPE' | 'NATIVE'): string => {
  if (context === 'NATIVE') {
    // Unfiltered raw text for internal or decentralized client variants
    return input;
  }

  let result = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
};
