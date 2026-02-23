import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { generateVCQuestions, simplifyConcept } from '../../../services/intelligence/GeminiClient';
import { AuthGuard } from '../../../guards/auth.guard';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  @Post('grill-me')
  async grillMe(@Body('slideContent') slideContent: string) {
    if (!slideContent || typeof slideContent !== 'string') {
      throw new HttpException('slideContent is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const questions = await generateVCQuestions(slideContent);
      return { questions };
    } catch (error: any) {
      throw new HttpException(
        `AI service error: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('eli5')
  async eli5(@Body('text') text: string) {
    if (!text || typeof text !== 'string') {
      throw new HttpException('text is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const explanation = await simplifyConcept(text);
      return { explanation };
    } catch (error: any) {
      throw new HttpException(
        `AI service error: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
