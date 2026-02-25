import { Injectable } from '@nestjs/common';

export interface GoalEthicsResult {
  ethical: boolean;
  reason?: string;
}

/**
 * Ethical screening for goal descriptions via Gemini 2.5 Flash content policy check.
 * Rejects goals involving self-harm, eating disorders, harming others,
 * illegal activity, discrimination, or dangerous challenges.
 * Fails open: if Gemini is unavailable or no API key is set, goals pass through.
 *
 * This service lives in the API layer (not shared/) because it depends on
 * the GeminiClient, respecting the shared → api dependency direction.
 */
@Injectable()
export class GoalEthicsService {

  async isGoalEthical(goalDescription: string): Promise<boolean> {
    if (!process.env.GEMINI_API_KEY) return true;

    try {
      const { screenGoalEthics } = await import('./GeminiClient');
      const result = await screenGoalEthics(goalDescription);
      return result.ethical;
    } catch {
      // Fail open: allow goal if screening service is unavailable
      return true;
    }
  }
}
