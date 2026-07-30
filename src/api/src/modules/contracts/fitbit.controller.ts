import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { AuthGuard } from '../../../guards/auth.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FitbitService } from '../../../services/health/fitbit.service';
import { FitbitSyncService } from '../../../services/health/fitbit-sync.service';

export class ConnectFitbitDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class ManualFitbitEntryDto {
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
  @IsNumber()
  sleepMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

/**
 * Authenticated Fitbit account-linking routes.
 *
 * The former POST :id/fitbit/readiness self-report route is intentionally
 * gone (Gate 02): readiness state now only enters through the
 * signature-verified webhook + server-side fetch path
 * (FitbitWebhookController). The MANUAL route below is journal-only and can
 * never credit attestations.
 */
@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard, GeofenceGuard, BannedUserGuard)
export class FitbitController {
  constructor(
    private readonly fitbitService: FitbitService,
    private readonly fitbitSync: FitbitSyncService,
  ) {}

  @Post('fitbit/connect')
  @ApiOperation({
    summary: 'Link a Fitbit account via OAuth2 authorization code (enables verified webhook ingestion)',
  })
  async connectFitbit(
    @CurrentUser() user: { id: string },
    @Body() dto: ConnectFitbitDto,
  ) {
    return this.fitbitSync.connectUser(user.id, dto.code, dto.redirectUri);
  }

  @Delete('fitbit/connect')
  @ApiOperation({ summary: 'Unlink the Fitbit account and stop webhook ingestion' })
  async disconnectFitbit(@CurrentUser() user: { id: string }) {
    return this.fitbitSync.disconnectUser(user.id);
  }

  @Post(':id/fitbit/manual')
  @ApiOperation({
    summary: 'Record a MANUAL self-reported wellness entry (journal only — NEVER credits attestations)',
  })
  async submitManualEntry(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ManualFitbitEntryDto,
  ) {
    return this.fitbitService.recordManualEntry({
      contractId,
      userId: user.id,
      readinessScore: dto.readinessScore,
      sleepScore: dto.sleepScore,
      restingHeartRate: dto.restingHeartRate,
      hrv: dto.hrv,
      sleepMinutes: dto.sleepMinutes,
      note: dto.note,
    });
  }
}
