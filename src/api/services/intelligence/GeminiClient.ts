/**
 * Gemini AI Integration Helper
 *
 * Provides three capabilities:
 * 1. callGemini(prompt, isJson) — Core API interaction with Gemini 2.5 Flash.
 * 2. generateVCQuestions(slideContent) — The "Grill Me" feature (SL-03).
 * 3. simplifyConcept(text) — The "ELI5" feature (SL-05).
 */

export const GEMINI_MODEL_VERSION = "gemini-2.5-flash-preview-09-2025";
export const SYSTEM_INSTRUCTION = "You are an elite Y-Combinator level startup advisor.";

/**
 * Call the Gemini generative AI API with an optional JSON response mode.
 * Requires GEMINI_API_KEY to be set in environment.
 */
export async function callGemini(prompt: string, isJson: boolean = false): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_VERSION}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: isJson ? { responseMimeType: 'application/json' } : {},
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Generate 3 tough VC "Grill Me" questions based on a pitch slide's content.
 * Returns a parsed array of question strings.
 */
export async function generateVCQuestions(slideContent: string): Promise<string[]> {
  const raw = await callGemini(
    `Given this startup pitch slide content, generate 3 tough VC "Grill Me" questions. Return a JSON array of strings.\n\n${slideContent}`,
    true,
  );
  return JSON.parse(raw);
}

/**
 * Explain a concept in simple terms (ELI5 — Explain Like I'm 5).
 */
export async function simplifyConcept(text: string): Promise<string> {
  return callGemini(`Explain this like I'm 5 years old:\n\n${text}`);
}

/**
 * Screen a user-submitted goal description for ethical/safety compliance.
 * Rejects goals involving self-harm, eating disorders, harming others,
 * illegal activity, discrimination, or dangerous challenges.
 */
export async function screenGoalEthics(goalDescription: string): Promise<{ ethical: boolean; reason?: string }> {
  const raw = await callGemini(
    `You are a content safety reviewer for a behavioral accountability platform. Evaluate whether this user goal is ethical and safe. Reject goals that involve: self-harm, eating disorders, harming others, illegal activity, discrimination, or dangerous challenges. Return JSON: { "ethical": boolean, "reason": "brief explanation if rejected" }\n\nGoal: "${goalDescription}"`,
    true,
  );
  return JSON.parse(raw);
}
