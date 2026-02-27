import { GoalEthicsService } from './goal-ethics.service';

describe('GoalEthicsService', () => {
  let service: GoalEthicsService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    service = new GoalEthicsService();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true (pass through) when no GEMINI_API_KEY is set', async () => {
    const result = await service.isGoalEthical('I want to lose 50 pounds in a week by starving');
    expect(result).toBe(true);
  });

  it('should return true when Gemini screening passes', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    jest.mock('./GeminiClient', () => ({
      screenGoalEthics: jest.fn().mockResolvedValue({ ethical: true }),
    }), { virtual: true });

    const result = await service.isGoalEthical('Run a 5K by the end of the month');
    expect(result).toBe(true);
  });

  it('should return true (fail open) when Gemini import fails', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    // Force the dynamic import to fail
    jest.mock('./GeminiClient', () => {
      throw new Error('Module not found');
    }, { virtual: true });

    const result = await service.isGoalEthical('Any goal description');
    expect(result).toBe(true);
  });

  it('should return true (fail open) when screenGoalEthics throws', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    jest.mock('./GeminiClient', () => ({
      screenGoalEthics: jest.fn().mockRejectedValue(new Error('Gemini API unavailable')),
    }), { virtual: true });

    const result = await service.isGoalEthical('Any goal description');
    expect(result).toBe(true);
  });

  it('should accept a benign goal description', async () => {
    // Without API key, all goals pass
    const result = await service.isGoalEthical('Read 30 minutes every day');
    expect(result).toBe(true);
  });

  it('should handle empty goal description', async () => {
    const result = await service.isGoalEthical('');
    expect(result).toBe(true);
  });
});
