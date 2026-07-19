import { LinguisticMiddleware } from './LinguisticMiddleware';

describe('LinguisticMiddleware', () => {
  describe('sanitizeUiText', () => {
    it('should replace "bet" with "commitment"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Place your bet')).toBe('Place your commitment');
    });

    it('should replace "wager" with "pledge"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Make a wager')).toBe('Make a pledge');
    });

    it('should replace "stake" with "vault"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Your stake is locked')).toBe('Your vault is locked');
    });

    it('should replace "pot" with "vault"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Add to the pot')).toBe('Add to the vault');
    });

    it('should replace "gambling" with "behavioral economics"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('This is not gambling')).toBe('This is not behavioral economics');
    });

    it('should replace "casino" with "arena"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Welcome to the casino')).toBe('Welcome to the arena');
    });

    it('should replace "odds" with "integrity score"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Check the odds')).toBe('Check the integrity score');
    });

    it('should handle plurals: "bets" → "commitments"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Active bets')).toBe('Active commitments');
    });

    it('should handle plurals: "stakes" → "vaults"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Your stakes')).toBe('Your vaults');
    });

    it('should handle "staking" → "vaulting"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Staking mode')).toBe('Vaulting mode');
    });

    it('should handle "betting" → "committing"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Start betting')).toBe('Start committing');
    });

    it('should preserve uppercase: "BET" → "COMMITMENT"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('PLACE YOUR BET')).toBe('PLACE YOUR COMMITMENT');
    });

    it('should preserve title case: "Bet" → "Commitment"', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Bet Now')).toBe('Commitment Now');
    });

    it('should respect word boundaries (no partial replacements)', () => {
      expect(LinguisticMiddleware.sanitizeUiText('alphabet')).toBe('alphabet');
      expect(LinguisticMiddleware.sanitizeUiText('better')).toBe('better');
      expect(LinguisticMiddleware.sanitizeUiText('teapot')).toBe('teapot');
      expect(LinguisticMiddleware.sanitizeUiText('stakeout')).not.toContain('vault');
    });

    it('should handle multiple replacements in one string', () => {
      const result = LinguisticMiddleware.sanitizeUiText('Place your bet and check the odds');
      expect(result).toBe('Place your commitment and check the integrity score');
    });

    it('should return empty string for empty input', () => {
      expect(LinguisticMiddleware.sanitizeUiText('')).toBe('');
    });

    it('should return the input unchanged when no forbidden words present', () => {
      expect(LinguisticMiddleware.sanitizeUiText('Hello world')).toBe('Hello world');
    });

    it('should be case insensitive', () => {
      expect(LinguisticMiddleware.sanitizeUiText('place your BET')).toBe('place your COMMITMENT');
      expect(LinguisticMiddleware.sanitizeUiText('GAMBLING is fun')).toBe('BEHAVIORAL ECONOMICS is fun');
    });
  });
});
