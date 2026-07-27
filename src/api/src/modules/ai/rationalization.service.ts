import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { callGemini } from '../../../services/intelligence/GeminiClient';
import type { RationalizationCategory, RationalizationResult, RationalizationHistory } from '../../../../shared/index';

const GEMINI_SYSTEM_PROMPT = `You are a compassionate but honest behavioral coach analyzing user rationalizations for a commitment accountability platform.

Classify the user's statement into exactly one of three categories:

1. GENUINE_EMERGENCY — A real, acute, unavoidable event (medical emergency, family crisis, natural disaster, legal obligation like court date). These are rare and should be approved with compassion.

2. LEGITIMATE_BUT_NOT_BLOCKING — A real challenge that is difficult but NOT impossible to work around (busy workload, mild illness, travel, fatigue, "I have 13 kids like Tolstoy" problems). These are real but the user can still do something.

3. PURE_RATIONALIZATION — An excuse that sounds reasonable but is actually Resistance disguised as reason. Key Pressfield indicators: over-dramatization, comparing oneself to others who succeeded under worse conditions, perfectionism ("if I can't do it perfectly..."), all-or-nothing thinking, victimhood narrative.

Return JSON: {
  "category": "GENUINE_EMERGENCY" | "LEGITIMATE_BUT_NOT_BLOCKING" | "PURE_RATIONALIZATION",
  "confidence": 0.0-1.0,
  "reasoning": "1-2 sentence explanation"
}`;

const RESPONSES: Record<RationalizationCategory, (text: string) => string> = {
  GENUINE_EMERGENCY: () =>
    'That sounds really difficult. Take care of what matters right now — your contracts will be here when you\'re ready. We\'re waiving any penalties for this period.',

  LEGITIMATE_BUT_NOT_BLOCKING: (text) => {
    if (text.length > 100) text = text.slice(0, 100);
    return `That's a real challenge, and it's valid. But it doesn't have to stop you completely. Would you like to reduce your daily requirement instead of pausing? Even a 5-minute version of your commitment keeps the streak alive.`;
  },

  PURE_RATIONALIZATION: () =>
    `That sounds reasonable — and that's exactly how Resistance works. The best time to push through is when every excuse feels justified. What's one small thing you can do right now, even if it's imperfect?`,
};

@Injectable()
export class RationalizationService {
  private readonly logger = new Logger(RationalizationService.name);

  constructor(private readonly pool: Pool) {}

  async classify(
    userId: string,
    text: string,
    contextType: 'GRACE_DAY' | 'EXTENSION_REQUEST' | 'DISPUTE_NARRATIVE' | 'PROOF_FAILURE',
    contextId?: string,
  ): Promise<RationalizationResult> {
    const pastPattern = await this.getPastPattern(userId);

    const prompt = `${GEMINI_SYSTEM_PROMPT}

User context: This user has submitted ${pastPattern.totalLogs} prior rationalization(s) — ${pastPattern.pureRationalization} classified as pure rationalization.

User statement: "${text}"

Classify this statement.`;

    let category: RationalizationCategory;
    let confidence: number;
    let reasoning: string;

    try {
      const raw = await callGemini(prompt, true);
      const parsed = JSON.parse(raw);

      if (!['GENUINE_EMERGENCY', 'LEGITIMATE_BUT_NOT_BLOCKING', 'PURE_RATIONALIZATION'].includes(parsed.category)) {
        throw new Error(`Unexpected category: ${parsed.category}`);
      }

      category = parsed.category;
      confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
      reasoning = parsed.reasoning || '';
    } catch (err: any) {
      this.logger.warn(`Gemini classification failed, falling back: ${err.message}`);
      category = 'LEGITIMATE_BUT_NOT_BLOCKING';
      confidence = 0.5;
      reasoning = 'Fallback — AI unavailable';
    }

    // Escalate response for repeat rationalizers
    let response: string;
    if (category === 'PURE_RATIONALIZATION' && pastPattern.pureRationalization >= 3) {
      response =
        `You've used similar reasoning ${pastPattern.pureRationalization} times before. ` +
        `Pressfield wrote: "The rationalizations that Resistance presents to us are insidious because a lot of them are TRUE." ` +
        `The question isn't whether your reason is valid — it's whether it's stopping you. ` +
        `What's the smallest possible action you can take right now?`;
    } else {
      response = RESPONSES[category](text);
    }

    await this.pool.query(
      `INSERT INTO rationalization_log (user_id, context_type, context_id, raw_text, classification, confidence, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, contextType, contextId ?? null, text, category, confidence, response],
    );

    this.logger.log(`[Rationalization] User ${userId} → ${category} (${contextType})`);

    return { category, confidence, reasoning, response };
  }

  private async getPastPattern(userId: string): Promise<{
    totalLogs: number;
    genuineEmergency: number;
    legitimateButNotBlocking: number;
    pureRationalization: number;
  }> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS "totalLogs",
         COUNT(*) FILTER (WHERE classification = 'GENUINE_EMERGENCY')::int AS "genuineEmergency",
         COUNT(*) FILTER (WHERE classification = 'LEGITIMATE_BUT_NOT_BLOCKING')::int AS "legitimateButNotBlocking",
         COUNT(*) FILTER (WHERE classification = 'PURE_RATIONALIZATION')::int AS "pureRationalization"
       FROM rationalization_log
       WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] || { totalLogs: 0, genuineEmergency: 0, legitimateButNotBlocking: 0, pureRationalization: 0 };
  }

  async getHistory(userId: string): Promise<RationalizationHistory> {
    const pattern = await this.getPastPattern(userId);

    const recent = await this.pool.query(
      `SELECT id, context_type, classification, raw_text, created_at
       FROM rationalization_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId],
    );

    return {
      totalLogs: pattern.totalLogs,
      genuineEmergency: pattern.genuineEmergency,
      legitimateButNotBlocking: pattern.legitimateButNotBlocking,
      pureRationalization: pattern.pureRationalization,
      recentLogs: recent.rows.map((r) => ({
        id: r.id,
        contextType: r.context_type,
        classification: r.classification,
        rawText: r.raw_text,
        createdAt: r.created_at.toISOString(),
      })),
    };
  }
}
