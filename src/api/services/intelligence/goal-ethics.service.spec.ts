import { jest } from '@jest/globals';
import { GoalEthicsService, type GoalEthicsResult } from './goal-ethics.service';

describe('GoalEthicsService', () => {
  let service: GoalEthicsService;
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    // The service uses import(), so mock the ESM registry, not only require().
    // Clear cached synthetic modules so each case exercises its own factory.
    jest.resetModules();
    jest.unstable_unmockModule('./GeminiClient');
    service = new GoalEthicsService();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    jest.unstable_unmockModule('./GeminiClient');
  });

  it('passes through without loading Gemini when no key is configured', async () => {
    const load = jest.fn(() => { throw new Error('Must not load without a key'); });
    jest.unstable_mockModule('./GeminiClient', load);
    expect(await service.isGoalEthical('An arbitrary description')).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it.each([true, false])('returns the actual screening decision: %s', async (ethical) => {
    process.env.GEMINI_API_KEY = 'test-key';
    const screenGoalEthics = jest.fn<(description: string) => Promise<GoalEthicsResult>>()
      .mockResolvedValue({ ethical });
    jest.unstable_mockModule('./GeminiClient', () => ({ screenGoalEthics }));
    const description = 'Run a 5K by the end of the month';
    expect(await service.isGoalEthical(description)).toBe(ethical);
    expect(screenGoalEthics).toHaveBeenCalledTimes(1);
    expect(screenGoalEthics).toHaveBeenCalledWith(description);
  });

  it('preserves the existing fallback when the Gemini import fails', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const load = jest.fn(() => { throw new Error('Module not found'); });
    jest.unstable_mockModule('./GeminiClient', load);
    expect(await service.isGoalEthical('Any goal description')).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('preserves the existing fallback when screening rejects', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const screenGoalEthics = jest.fn<(description: string) => Promise<GoalEthicsResult>>()
      .mockRejectedValue(new Error('Gemini API unavailable'));
    jest.unstable_mockModule('./GeminiClient', () => ({ screenGoalEthics }));
    expect(await service.isGoalEthical('Any goal description')).toBe(true);
    expect(screenGoalEthics).toHaveBeenCalledTimes(1);
    expect(screenGoalEthics).toHaveBeenCalledWith('Any goal description');
  });

  it('accepts a benign description when screening is unconfigured', async () => {
    expect(await service.isGoalEthical('Read 30 minutes every day')).toBe(true);
  });

  it('preserves the unconfigured empty-description behavior', async () => {
    expect(await service.isGoalEthical('')).toBe(true);
  });
});
