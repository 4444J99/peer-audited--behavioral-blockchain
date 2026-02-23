import { callGemini, generateVCQuestions, simplifyConcept, screenGoalEthics } from './GeminiClient';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

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

      const result = await callGemini('test prompt');
      expect(result).toBe('Hello world');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(options.headers['x-goog-api-key']).toBe('test-key');
    });

    it('should throw when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(callGemini('test')).rejects.toThrow('GEMINI_API_KEY not configured');
    });

    it('should throw on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
      });

      await expect(callGemini('test')).rejects.toThrow('Gemini API 429');
    });

    it('should request JSON response when isJson is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '["q1","q2"]' }] } }],
        }),
      });

      await callGemini('test', true);
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

      await callGemini('test', false);
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

      const result = await generateVCQuestions('Our product does X');
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

      const result = await simplifyConcept('Blockchain escrow');
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

      const result = await screenGoalEthics('Run a 5K marathon');
      expect(result).toEqual({ ethical: true });
    });

    it('should return ethical:false with reason for unsafe goals', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"ethical":false,"reason":"Self-harm risk"}' }] } }],
        }),
      });

      const result = await screenGoalEthics('Starve myself');
      expect(result).toEqual({ ethical: false, reason: 'Self-harm risk' });
    });

    it('should send JSON mode request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"ethical":true}' }] } }],
        }),
      });

      await screenGoalEthics('Read more books');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.generationConfig.responseMimeType).toBe('application/json');
    });
  });
});
