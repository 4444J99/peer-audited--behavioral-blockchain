/**
 * HoneypotEngine
 *
 * Injects mathematically indistinguishable "fake" whistleblower artifacts
 * into the Fury Audit stream to identify and slash dishonest auditors.
 */

import { randomUUID, randomBytes, randomInt } from 'crypto';

export interface HoneypotArtifact {
  id: string;
  type: 'fake_text' | 'fake_call_log';
  timestamp: string;
  isHoneypot: true;
  expectedResult: 'BREACH' | 'CLEAN';
  payload: any;
}

/**
 * Varied payload pools per expected result. A large, randomized pool keeps
 * honeypots from being trivially memorizable / detectable by their text.
 */
const BREACH_MESSAGE_TEMPLATES: ((name: string) => string)[] = [
  (n) => `Hey ${n}, I'm thinking about you... can't stop.`,
  (n) => `${n}, are you free tonight? Don't tell anyone we talked.`,
  (n) => `I know I shouldn't message you ${n}, but I miss this.`,
  (n) => `Delete this after you read it, ${n}. Same place as last time?`,
  (n) => `${n} you looked amazing earlier. Keep it between us.`,
];

const CLEAN_MESSAGE_TEMPLATES: ((name: string) => string)[] = [
  () => `Your Amazon delivery is arriving today.`,
  (n) => `Hi ${n}, your appointment is confirmed for 3pm.`,
  () => `Your verification code is ${randomBytes(3).toString('hex')}.`,
  (n) => `${n}, the team standup moved to 10:30 tomorrow.`,
  () => `Reminder: your subscription renews next week.`,
];

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie'];

export class HoneypotEngine {
  /**
   * Generates a realistic but fake whistleblower artifact.
   */
  public generateHoneypot(expectedResult: 'BREACH' | 'CLEAN'): HoneypotArtifact {
    // Unpredictable, non-enumerable identifier.
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    // crypto.randomInt is a CSPRNG with a uniform (unbiased) distribution, so it
    // avoids both the predictability of Math.random and the modulo bias of
    // randomBytes(1)[0] % n when selecting honeypot content.
    const name = FIRST_NAMES[randomInt(FIRST_NAMES.length)];
    const pool = expectedResult === 'BREACH' ? BREACH_MESSAGE_TEMPLATES : CLEAN_MESSAGE_TEMPLATES;
    const template = pool[randomInt(pool.length)];

    return {
      id,
      type: 'fake_text',
      timestamp,
      isHoneypot: true,
      expectedResult,
      payload: {
        message: template(name),
        // Cryptographically random sender hash (unpredictable, fixed-width).
        senderHash: '0x' + randomBytes(20).toString('hex'),
      },
    };
  }

  /**
   * Verifies an auditor's decision against the honeypot's truth.
   */
  public verifyAuditor(decision: 'BREACH' | 'CLEAN', expected: 'BREACH' | 'CLEAN'): boolean {
    return decision === expected;
  }
}
