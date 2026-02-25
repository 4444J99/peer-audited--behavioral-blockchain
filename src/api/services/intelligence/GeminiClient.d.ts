export declare const GEMINI_MODEL_VERSION = "gemini-2.5-flash-preview-09-2025";
export declare const SYSTEM_INSTRUCTION = "You are an elite Y-Combinator level startup advisor.";
export declare function callGemini(prompt: string, isJson?: boolean): Promise<string>;
export declare function generateVCQuestions(slideContent: string): Promise<string[]>;
export declare function simplifyConcept(text: string): Promise<string>;
export declare function screenGoalEthics(goalDescription: string, oathCategory?: string): Promise<{
    ethical: boolean;
    reason?: string;
}>;
