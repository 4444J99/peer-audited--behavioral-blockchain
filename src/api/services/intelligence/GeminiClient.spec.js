"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GeminiClient_1 = require("./GeminiClient");
const mockFetch = jest.fn();
global.fetch = mockFetch;
describe('GeminiClient', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.GEMINI_API_KEY = 'test-key';
    });
    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
    });
    describe('callGemini', () => {
        it('should call Gemini API with correct parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'Hello world' }] } }],
                }),
            });
            const result = await (0, GeminiClient_1.callGemini)('test prompt');
            expect(result).toBe('Hello world');
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('generativelanguage.googleapis.com');
            expect(options.headers['x-goog-api-key']).toBe('test-key');
        });
        it('should throw when API key is missing', async () => {
            delete process.env.GEMINI_API_KEY;
            await expect((0, GeminiClient_1.callGemini)('test')).rejects.toThrow('GEMINI_API_KEY not configured');
        });
        it('should throw on non-OK response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: async () => 'Rate limited',
            });
            await expect((0, GeminiClient_1.callGemini)('test')).rejects.toThrow('Gemini API 429');
        });
        it('should request JSON response when isJson is true', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '["q1","q2"]' }] } }],
                }),
            });
            await (0, GeminiClient_1.callGemini)('test', true);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.generationConfig.responseMimeType).toBe('application/json');
        });
        it('should not set responseMimeType when isJson is false', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'plain text' }] } }],
                }),
            });
            await (0, GeminiClient_1.callGemini)('test', false);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.generationConfig).toEqual({});
        });
    });
    describe('generateVCQuestions', () => {
        it('should return parsed array of questions', async () => {
            const questions = ['Why this market?', 'What is your moat?', 'How do you scale?'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: JSON.stringify(questions) }] } }],
                }),
            });
            const result = await (0, GeminiClient_1.generateVCQuestions)('Our product does X');
            expect(result).toEqual(questions);
            expect(result).toHaveLength(3);
        });
    });
    describe('simplifyConcept', () => {
        it('should return simplified text', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'It is like a piggy bank but on a computer' }] } }],
                }),
            });
            const result = await (0, GeminiClient_1.simplifyConcept)('Blockchain escrow');
            expect(result).toBe('It is like a piggy bank but on a computer');
        });
    });
    describe('screenGoalEthics', () => {
        it('should return ethical:true for safe goals', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
                }),
            });
            const result = await (0, GeminiClient_1.screenGoalEthics)('Run a 5K marathon');
            expect(result).toEqual({ ethical: true });
        });
        it('should return ethical:false with reason for unsafe goals', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":false,"reason":"Self-harm risk"}' }] } }],
                }),
            });
            const result = await (0, GeminiClient_1.screenGoalEthics)('Starve myself');
            expect(result).toEqual({ ethical: false, reason: 'Self-harm risk' });
        });
        it('should send JSON mode request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
                }),
            });
            await (0, GeminiClient_1.screenGoalEthics)('Read more books');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.generationConfig.responseMimeType).toBe('application/json');
        });
        it('should include recovery-specific screening for RECOVERY_ oaths', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
                }),
            });
            await (0, GeminiClient_1.screenGoalEthics)('No contact with ex-partner for 30 days', 'RECOVERY_NOCONTACT');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            const prompt = body.contents[0].parts[0].text;
            expect(prompt).toContain('coercive control');
            expect(prompt).toContain('isolation from support networks');
            expect(prompt).toContain('stalking');
        });
        it('should not include recovery screening for non-RECOVERY oaths', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
                }),
            });
            await (0, GeminiClient_1.screenGoalEthics)('Run a marathon', 'BIOLOGICAL_CARDIO');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            const prompt = body.contents[0].parts[0].text;
            expect(prompt).not.toContain('coercive control');
        });
        it('should not include recovery screening when oathCategory is undefined', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
                }),
            });
            await (0, GeminiClient_1.screenGoalEthics)('General goal');
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            const prompt = body.contents[0].parts[0].text;
            expect(prompt).not.toContain('coercive control');
        });
    });
});
//# sourceMappingURL=GeminiClient.spec.js.map