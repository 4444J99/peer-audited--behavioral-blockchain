import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RationalizationService } from './rationalization.service';

@ApiTags('AI')
@Controller('ai/rationalization')
export class RationalizationController {
  constructor(private readonly service: RationalizationService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Classify a user rationalization via AI (Pressfield categories)' })
  @UseGuards(AuthGuard)
  async classify(
    @CurrentUser() user: { id: string },
    @Body() body: {
      text: string;
      contextType: 'GRACE_DAY' | 'EXTENSION_REQUEST' | 'DISPUTE_NARRATIVE' | 'PROOF_FAILURE';
      contextId?: string;
    },
  ) {
    if (!body.text || body.text.length < 5) {
      return { error: 'Text must be at least 5 characters' };
    }
    return this.service.classify(user.id, body.text, body.contextType, body.contextId);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get your rationalization classification history' })
  @UseGuards(AuthGuard)
  async history(@CurrentUser() user: { id: string }) {
    return this.service.getHistory(user.id);
  }
}
