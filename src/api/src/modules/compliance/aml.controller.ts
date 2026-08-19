import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { AmlScreeningService } from './aml-screening.service';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('compliance/aml')
@UseGuards(AuthGuard, RoleGuard)
@Roles('ADMIN')
export class AmlController {
  constructor(private readonly amlScreening: AmlScreeningService) {}

  @Post('screen/:userId')
  @ApiOperation({
    summary:
      'Run AML screening for a user (watchlist, blocklist, transaction patterns) — Admin only',
  })
  async screenUser(@Param('userId') userId: string) {
    return this.amlScreening.screenUser(userId);
  }

  @Get('screenings/:userId')
  @ApiOperation({ summary: 'Get AML screening history for a user (Admin only)' })
  async getScreeningHistory(@Param('userId') userId: string) {
    return this.amlScreening.getScreeningHistory(userId);
  }

  @Get('patterns/:userId')
  @ApiOperation({
    summary:
      'Run transaction-pattern detectors (structuring, rapid movement) and blocklist check without recording a screening — Admin only',
  })
  async detectPatterns(
    @Param('userId') userId: string,
    @Query('windowHours') windowHours?: string,
  ) {
    let parsedWindowHours: number | undefined;
    if (windowHours !== undefined) {
      parsedWindowHours = parseInt(windowHours, 10);
      if (!Number.isFinite(parsedWindowHours) || parsedWindowHours <= 0) {
        throw new BadRequestException('windowHours must be a positive integer');
      }
    }

    const [blocked, structuring, rapidMovement] = await Promise.all([
      this.amlScreening.isBlocked(userId),
      this.amlScreening.detectStructuring(userId),
      parsedWindowHours !== undefined
        ? this.amlScreening.detectRapidMovement(userId, parsedWindowHours)
        : this.amlScreening.detectRapidMovement(userId),
    ]);

    return { userId, blocked, structuring, rapidMovement };
  }

  @Post('sar')
  @ApiOperation({ summary: 'File a Suspicious Activity Report draft (Admin only)' })
  async fileSar(
    @Body()
    body: {
      userId: string;
      transactionIds: string[];
      suspicionType: string;
      description: string;
    },
  ) {
    if (!body?.userId) {
      throw new BadRequestException('userId is required');
    }
    if (!Array.isArray(body.transactionIds) || body.transactionIds.length === 0) {
      throw new BadRequestException('transactionIds (non-empty array) is required');
    }
    if (!body.suspicionType) {
      throw new BadRequestException('suspicionType is required');
    }
    if (!body.description) {
      throw new BadRequestException('description is required');
    }

    return this.amlScreening.fileSAR(
      body.userId,
      body.transactionIds,
      body.suspicionType,
      body.description,
    );
  }

  @Get('sar/:userId')
  @ApiOperation({ summary: 'Get SAR filing history for a user (Admin only)' })
  async getSarHistory(@Param('userId') userId: string) {
    return this.amlScreening.getSARHistory(userId);
  }
}
