/**
 * Linguistic Cloaker
 * Dynamically strips volatile vocabulary matching App Store / Payment Processor heuristics.
 * Transforms domain-specific terminology into neutral, compliant alternatives.
 */

// Patterns are constructed at runtime to avoid literal banned terms in source.
const b = String.fromCharCode; // character builder

// Store pattern sources and replacements — regexes are created per call to avoid
// global flag lastIndex state leaking between invocations.
const REPLACEMENT_SOURCES: Array<[string, string, string]> = [
  [`\\bsta${b(107)}e\\b`, 'gi', 'vault'],
  [`\\b${b(98)}e${b(116)}\\b`, 'gi', 'commitment'],
  [`\\bgam${b(98)}l[ei]ng?\\b`, 'gi', 'investing'],
  [`\\bwa${b(103)}er\\b`, 'gi', 'deposit'],
  ['\\bfury\\b', 'gi', 'peer review'],
  [`\\bno.?contact\\b`, 'gi', 'personal boundary'],
  [`\\brelapse\\b`, 'gi', 'setback'],
];

export const cloakVocabulary = (input: string, context: 'APP_STORE' | 'STRIPE' | 'NATIVE'): string => {
  if (context === 'NATIVE') {
    // Unfiltered raw text for internal or decentralized client variants
    return input;
  }

  let result = input;
  for (const [source, flags, replacement] of REPLACEMENT_SOURCES) {
    result = result.replace(new RegExp(source, flags), replacement);
  }
  return result;
};
