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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import {
  AntiSybilService,
  DeviceFingerprint,
  SybilSignal,
} from './anti-sybil.service';

const PLATFORMS: DeviceFingerprint['platform'][] = ['ios', 'android', 'web'];
const SIGNAL_TYPES: SybilSignal['signalType'][] = [
  'SHARED_DEVICE',
  'SHARED_IP',
  'SHARED_PAYMENT',
  'SHARED_PHONE',
];

@Controller('security')
export class SecurityController {
  constructor(private readonly antiSybil: AntiSybilService) {}

  // ---- User-facing: register own device, appeal a shared-device flag ----

  @Post('device-fingerprint')
  @UseGuards(AuthGuard)
  async registerDeviceFingerprint(
    @CurrentUser() user: any,
    @Body()
    body: {
      hash?: string;
      platform: DeviceFingerprint['platform'];
      rawVendorId?: string;
    },
  ) {
    if (!body || !PLATFORMS.includes(body.platform)) {
      throw new BadRequestException(
        `platform must be one of: ${PLATFORMS.join(', ')}`,
      );
    }
    if (!body.hash && !body.rawVendorId) {
      throw new BadRequestException('Either hash or rawVendorId is required');
    }

    await this.antiSybil.registerDeviceFingerprint(user.id, {
      hash: body.hash ?? '',
      platform: body.platform,
      rawVendorId: body.rawVendorId,
    });

    return { registered: true };
  }

  @Post('sybil/appeal')
  @UseGuards(AuthGuard)
  async appealSharedDevice(
    @CurrentUser() user: any,
    @Body() body: { relatedUserId: string; reason: string },
  ) {
    if (!body?.relatedUserId || !body?.reason) {
      throw new BadRequestException('relatedUserId and reason are required');
    }
    return this.antiSybil.appealSharedDevice(
      user.id,
      body.relatedUserId,
      body.reason,
    );
  }

  // ---- Admin: cross-account detection + graduated enforcement ----

  @Get('sybil/users/:userId/analysis')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async analyzeUser(@Param('userId') userId: string) {
    return this.antiSybil.analyzeUser(userId);
  }

  // Runs the full analysis AND persists every detected signal, so the verdict
  // (WARNING / ACCOUNT_MERGE / BAN) is backed by an auditable signal history.
  @Post('sybil/users/:userId/enforce')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async enforce(@Param('userId') userId: string) {
    const verdict = await this.antiSybil.analyzeUser(userId);
    const recorded: SybilSignal[] = [];
    for (const signal of verdict.signals) {
      recorded.push(
        await this.antiSybil.recordSignal({
          userId: signal.userId,
          signalType: signal.signalType,
          relatedUserId: signal.relatedUserId,
          confidence: signal.confidence,
        }),
      );
    }
    return { ...verdict, signals: recorded };
  }

  @Get('sybil/users/:userId/signals')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async getSignalHistory(@Param('userId') userId: string) {
    return this.antiSybil.getSignalHistory(userId);
  }

  @Post('sybil/signals')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async recordSignal(
    @Body()
    body: {
      userId: string;
      signalType: SybilSignal['signalType'];
      relatedUserId: string;
      confidence: number;
    },
  ) {
    if (!body?.userId || !body?.relatedUserId) {
      throw new BadRequestException('userId and relatedUserId are required');
    }
    if (!SIGNAL_TYPES.includes(body.signalType)) {
      throw new BadRequestException(
        `signalType must be one of: ${SIGNAL_TYPES.join(', ')}`,
      );
    }
    const confidence = Number(body.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      throw new BadRequestException('confidence must be a number between 0 and 100');
    }
    return this.antiSybil.recordSignal({
      userId: body.userId,
      signalType: body.signalType,
      relatedUserId: body.relatedUserId,
      confidence,
    });
  }

  @Get('sybil/devices/:deviceHash/users')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async lookupDevice(@Param('deviceHash') deviceHash: string) {
    const userIds = await this.antiSybil.detectSharedDevice(deviceHash);
    return { deviceHash, userIds };
  }

  @Get('sybil/users/:userId/shared-payment')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async sharedPayment(@Param('userId') userId: string) {
    const userIds = await this.antiSybil.detectSharedPayment(userId);
    return { userId, userIds };
  }

  @Get('sybil/users/:userId/shared-ip')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  async sharedIp(@Param('userId') userId: string, @Query('ip') ip?: string) {
    if (!ip) {
      throw new BadRequestException('ip query parameter is required');
    }
    const userIds = await this.antiSybil.detectSharedIP(userId, ip);
    return { userId, ip, userIds };
  }
}
