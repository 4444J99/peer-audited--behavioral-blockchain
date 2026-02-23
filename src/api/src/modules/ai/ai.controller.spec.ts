import { AiController } from './ai.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock the GeminiClient module
jest.mock('../../../services/intelligence/GeminiClient', () => ({
  generateVCQuestions: jest.fn(),
  simplifyConcept: jest.fn(),
}));

import { generateVCQuestions, simplifyConcept } from '../../../services/intelligence/GeminiClient';

const mockGenerateVCQuestions = generateVCQuestions as jest.MockedFunction<typeof generateVCQuestions>;
const mockSimplifyConcept = simplifyConcept as jest.MockedFunction<typeof simplifyConcept>;

describe('AiController', () => {
  let controller: AiController;

  beforeEach(() => {
    controller = new AiController();
    jest.clearAllMocks();
  });

  describe('POST /ai/grill-me', () => {
    it('should return questions array for valid slideContent', async () => {
      const mockQuestions = [
        'What is your TAM?',
        'How do you acquire users?',
        'What are your unit economics?',
      ];
      mockGenerateVCQuestions.mockResolvedValue(mockQuestions);

      const result = await controller.grillMe('We are building a behavioral market...');

      expect(result).toEqual({ questions: mockQuestions });
      expect(mockGenerateVCQuestions).toHaveBeenCalledWith('We are building a behavioral market...');
    });

    it('should reject missing slideContent with 400', async () => {
      await expect(controller.grillMe(undefined as any)).rejects.toThrow(
        new HttpException('slideContent is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should return 503 when Gemini fails', async () => {
      mockGenerateVCQuestions.mockRejectedValue(new Error('Gemini API 500: Internal error'));

      await expect(controller.grillMe('valid content')).rejects.toThrow(HttpException);
      try {
        await controller.grillMe('valid content');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });
  });

  describe('POST /ai/eli5', () => {
    it('should return explanation for valid text', async () => {
      mockSimplifyConcept.mockResolvedValue('Loss aversion means people hate losing more than they like winning.');

      const result = await controller.eli5('Explain loss aversion coefficient 1.955');

      expect(result).toEqual({
        explanation: 'Loss aversion means people hate losing more than they like winning.',
      });
      expect(mockSimplifyConcept).toHaveBeenCalledWith('Explain loss aversion coefficient 1.955');
    });

    it('should reject missing text with 400', async () => {
      await expect(controller.eli5(undefined as any)).rejects.toThrow(
        new HttpException('text is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should return 503 when Gemini fails', async () => {
      mockSimplifyConcept.mockRejectedValue(new Error('GEMINI_API_KEY not configured'));

      await expect(controller.eli5('valid text')).rejects.toThrow(HttpException);
      try {
        await controller.eli5('valid text');
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });
  });
});
