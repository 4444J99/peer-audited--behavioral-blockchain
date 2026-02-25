"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_INSTRUCTION = exports.GEMINI_MODEL_VERSION = void 0;
exports.callGemini = callGemini;
exports.generateVCQuestions = generateVCQuestions;
exports.simplifyConcept = simplifyConcept;
exports.screenGoalEthics = screenGoalEthics;
exports.GEMINI_MODEL_VERSION = "gemini-2.5-flash-preview-09-2025";
exports.SYSTEM_INSTRUCTION = "You are an elite Y-Combinator level startup advisor.";
async function callGemini(prompt, isJson = false) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY not configured');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${exports.GEMINI_MODEL_VERSION}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: exports.SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: isJson ? { responseMimeType: 'application/json' } : {},
        }),
    });
    if (!response.ok) {
        throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
async function generateVCQuestions(slideContent) {
    const raw = await callGemini(`Given this startup pitch slide content, generate 3 tough VC "Grill Me" questions. Return a JSON array of strings.\n\n${slideContent}`, true);
    return JSON.parse(raw);
}
async function simplifyConcept(text) {
    return callGemini(`Explain this like I'm 5 years old:\n\n${text}`);
}
async function screenGoalEthics(goalDescription, oathCategory) {
    const isRecovery = oathCategory?.startsWith('RECOVERY_');
    const recoveryClause = isRecovery
        ? ' Additionally, because this is a recovery/no-contact contract, also reject goals that involve: coercive control over another person, isolation from support networks (therapists, sponsors, family), stalking or surveillance behavior, preventing contact with emergency services, or any pattern that suggests the user is being coerced into this contract by a third party.'
        : '';
    const raw = await callGemini(`You are a content safety reviewer for a behavioral accountability platform. Evaluate whether this user goal is ethical and safe. Reject goals that involve: self-harm, eating disorders, harming others, illegal activity, discrimination, or dangerous challenges.${recoveryClause} Return JSON: { "ethical": boolean, "reason": "brief explanation if rejected" }\n\nGoal: "${goalDescription}"`, true);
    return JSON.parse(raw);
}
//# sourceMappingURL=GeminiClient.js.map