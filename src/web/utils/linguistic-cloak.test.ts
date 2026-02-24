import { cloakVocabulary } from './linguistic-cloak';

describe('Linguistic Cloaker', () => {
  it('should replace volatile terms in APP_STORE context', () => {
    const input = 'Place your stake in the fury network';
    const result = cloakVocabulary(input, 'APP_STORE');

    expect(result).not.toMatch(/stake/i);
    expect(result).not.toMatch(/fury/i);
    expect(result).toContain('vault');
    expect(result).toContain('peer review');
  });

  it('should replace volatile terms in STRIPE context', () => {
    const input = 'Your bet has been placed via the fury audit';
    const result = cloakVocabulary(input, 'STRIPE');

    expect(result).not.toMatch(/\bbet\b/i);
    expect(result).not.toMatch(/fury/i);
    expect(result).toContain('commitment');
    expect(result).toContain('peer review');
  });

  it('should return input unmodified in NATIVE context', () => {
    const input = 'Place your stake in the fury network with a bet';
    const result = cloakVocabulary(input, 'NATIVE');

    expect(result).toBe(input);
  });

  it('should handle empty strings', () => {
    expect(cloakVocabulary('', 'APP_STORE')).toBe('');
    expect(cloakVocabulary('', 'NATIVE')).toBe('');
  });

  it('should handle text with no banned terms', () => {
    const input = 'Welcome to the platform dashboard';
    expect(cloakVocabulary(input, 'APP_STORE')).toBe(input);
  });

  it('should replace "no contact" with "personal boundary" in APP_STORE context', () => {
    const input = 'Maintain no contact with your ex';
    const result = cloakVocabulary(input, 'APP_STORE');
    expect(result).not.toMatch(/no.?contact/i);
    expect(result).toContain('personal boundary');
  });

  it('should replace "no-contact" (hyphenated) with "personal boundary"', () => {
    const input = 'Your no-contact commitment is active';
    const result = cloakVocabulary(input, 'APP_STORE');
    expect(result).toContain('personal boundary');
  });

  it('should replace "relapse" with "setback" in STRIPE context', () => {
    const input = 'Prevent relapse with financial accountability';
    const result = cloakVocabulary(input, 'STRIPE');
    expect(result).not.toMatch(/relapse/i);
    expect(result).toContain('setback');
  });

  it('should not replace recovery terms in NATIVE context', () => {
    const input = 'no contact relapse prevention';
    const result = cloakVocabulary(input, 'NATIVE');
    expect(result).toBe(input);
  });
});
