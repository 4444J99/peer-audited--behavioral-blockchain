import { STYX_KNOWLEDGE } from './styx-knowledge';

describe('styx-knowledge (auto-generated knowledge base)', () => {
  describe('export integrity', () => {
    it('exports STYX_KNOWLEDGE as a non-empty string', () => {
      expect(typeof STYX_KNOWLEDGE).toBe('string');
      expect(STYX_KNOWLEDGE.length).toBeGreaterThan(0);
    });

    it('knowledge base is substantial (>30KB)', () => {
      // The assembled knowledge should be at least 30KB
      expect(STYX_KNOWLEDGE.length).toBeGreaterThan(30000);
    });

    it('knowledge base fits in ~15K tokens (under 60KB)', () => {
      // Should stay under 60KB to leave room in 128K context window
      expect(STYX_KNOWLEDGE.length).toBeLessThan(60000);
    });
  });

  describe('required sections', () => {
    it('contains PROJECT OVERVIEW section from CLAUDE.md', () => {
      expect(STYX_KNOWLEDGE).toContain('=== PROJECT OVERVIEW');
      expect(STYX_KNOWLEDGE).toContain('File: CLAUDE.md');
    });

    it('contains BEHAVIORAL LOGIC section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== BEHAVIORAL LOGIC');
      expect(STYX_KNOWLEDGE).toContain('behavioral-logic.ts');
    });

    it('contains INTEGRITY SCORE section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== INTEGRITY SCORE');
      expect(STYX_KNOWLEDGE).toContain('integrity.ts');
    });

    it('contains MONEY UTILITIES section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== MONEY UTILITIES');
      expect(STYX_KNOWLEDGE).toContain('money.ts');
    });

    it('contains DATABASE SCHEMA section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== DATABASE SCHEMA');
      expect(STYX_KNOWLEDGE).toContain('schema.sql');
    });

    it('contains FEATURE BACKLOG section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== FEATURE BACKLOG');
      expect(STYX_KNOWLEDGE).toContain('FEATURE-BACKLOG.md');
    });

    it('contains IMPLEMENTATION STATUS section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== IMPLEMENTATION STATUS');
      expect(STYX_KNOWLEDGE).toContain('implementation-status.md');
    });

    it('contains PHASE 1 PRIVATE BETA SCOPE section', () => {
      expect(STYX_KNOWLEDGE).toContain('=== PHASE 1 PRIVATE BETA SCOPE');
      expect(STYX_KNOWLEDGE).toContain('phase1-private-beta-scope.md');
    });

    it('contains PROJECT METADATA section from seed.yaml', () => {
      expect(STYX_KNOWLEDGE).toContain('=== PROJECT METADATA');
      expect(STYX_KNOWLEDGE).toContain('seed.yaml');
    });
  });

  describe('critical domain knowledge', () => {
    it('contains loss aversion coefficient (1.955)', () => {
      expect(STYX_KNOWLEDGE).toContain('1.955');
    });

    it('contains all 7 oath streams', () => {
      expect(STYX_KNOWLEDGE).toContain('BIOLOGICAL');
      expect(STYX_KNOWLEDGE).toContain('COGNITIVE');
      expect(STYX_KNOWLEDGE).toContain('PROFESSIONAL');
      expect(STYX_KNOWLEDGE).toContain('CREATIVE');
      expect(STYX_KNOWLEDGE).toContain('RECOVERY');
    });

    it('contains integrity score base value (50)', () => {
      expect(STYX_KNOWLEDGE).toContain('BASE_INTEGRITY');
      expect(STYX_KNOWLEDGE).toContain('50');
    });

    it('contains tier thresholds', () => {
      expect(STYX_KNOWLEDGE).toContain('RESTRICTED_MODE');
      expect(STYX_KNOWLEDGE).toContain('TIER_1_MICRO_STAKES');
      expect(STYX_KNOWLEDGE).toContain('TIER_2_STANDARD');
      expect(STYX_KNOWLEDGE).toContain('TIER_3_HIGH_ROLLER');
      expect(STYX_KNOWLEDGE).toContain('TIER_4_WHALE_VAULTS');
    });

    it('contains Fury accuracy formula components', () => {
      expect(STYX_KNOWLEDGE).toContain('calculateAccuracy');
      expect(STYX_KNOWLEDGE).toContain('FALSE_ACCUSATION_WEIGHT');
      expect(STYX_KNOWLEDGE).toContain('shouldDemoteFury');
    });

    it('contains auditor stake amount ($2.00)', () => {
      expect(STYX_KNOWLEDGE).toContain('AUDITOR_STAKE_AMOUNT');
      expect(STYX_KNOWLEDGE).toContain('200'); // 200 cents
    });

    it('contains grace day limit (2 per month)', () => {
      expect(STYX_KNOWLEDGE).toContain('MAX_GRACE_DAYS_PER_MONTH');
    });

    it('contains database tables', () => {
      expect(STYX_KNOWLEDGE).toContain('CREATE TABLE users');
      expect(STYX_KNOWLEDGE).toContain('CREATE TABLE contracts');
      expect(STYX_KNOWLEDGE).toContain('CREATE TABLE proofs');
      expect(STYX_KNOWLEDGE).toContain('CREATE TABLE fury_assignments');
      expect(STYX_KNOWLEDGE).toContain('CREATE TABLE entries');
    });

    it('contains double-entry ledger (event_log with hash chain)', () => {
      expect(STYX_KNOWLEDGE).toContain('event_log');
      expect(STYX_KNOWLEDGE).toContain('previous_hash');
      expect(STYX_KNOWLEDGE).toContain('current_hash');
    });

    it('contains money utilities (toCents, toDollars, formatCents)', () => {
      expect(STYX_KNOWLEDGE).toContain('toCents');
      expect(STYX_KNOWLEDGE).toContain('toDollars');
      expect(STYX_KNOWLEDGE).toContain('formatCents');
    });

    it('contains feature backlog executive summary', () => {
      expect(STYX_KNOWLEDGE).toContain('Executive Summary');
      expect(STYX_KNOWLEDGE).toContain('IMPLEMENTED');
      expect(STYX_KNOWLEDGE).toContain('NOT_STARTED');
    });

    it('contains Phase 1 scope constraints', () => {
      expect(STYX_KNOWLEDGE).toContain('TestFlight');
      expect(STYX_KNOWLEDGE).toContain('No-Contact recovery');
    });

    it('contains workspace architecture (NestJS, Next.js, React Native, Tauri)', () => {
      expect(STYX_KNOWLEDGE).toContain('NestJS');
      expect(STYX_KNOWLEDGE).toContain('Next.js');
      expect(STYX_KNOWLEDGE).toContain('React Native');
      expect(STYX_KNOWLEDGE).toContain('Tauri');
    });

    it('contains organ membership metadata', () => {
      expect(STYX_KNOWLEDGE).toContain('organ: III');
      expect(STYX_KNOWLEDGE).toContain('Commerce');
    });
  });
});
