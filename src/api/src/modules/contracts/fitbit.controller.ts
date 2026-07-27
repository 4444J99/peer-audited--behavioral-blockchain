import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { AuthGuard } from '../../../guards/auth.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FitbitService, FitbitReadinessState } from '../../../services/health/fitbit.service';

export class SubmitFitbitReadinessDto {
  @IsEnum(FitbitReadinessState)
  state!: FitbitReadinessState;

  @IsOptional()
  @IsNumber()
  readinessScore?: number;

  @IsOptional()
  @IsNumber()
  sleepScore?: number;

  @IsOptional()
  @IsNumber()
  restingHeartRate?: number;

  @IsOptional()
  @IsNumber()
  hrv?: number;

  @IsOptional()
  @IsString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard, GeofenceGuard, BannedUserGuard)
export class FitbitController {
  constructor(private readonly fitbitService: FitbitService) {}

  @Post(':id/fitbit/readiness')
  @ApiOperation({
    summary:
      'Ingest Fitbit daily readiness score and optionally credit daily attestation',
  })
  async submitFitbitReadiness(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitFitbitReadinessDto,
  ) {
    return this.fitbitService.processReadinessState({
      contractId,
      userId: user.id,
      state: dto.state,
      readinessScore: dto.readinessScore,
      sleepScore: dto.sleepScore,
      restingHeartRate: dto.restingHeartRate,
      hrv: dto.hrv,
      recordedAt: dto.recordedAt,
      source: dto.source,
    });
  }
}
