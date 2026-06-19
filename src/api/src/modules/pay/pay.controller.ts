import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { AuthGuard } from '../../../guards/auth.guard';
import { ComplianceAccessGuard } from '../../common/guards/compliance-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { RecordMeteredUsageDto } from './dto';
import { PayService } from './pay.service';

@ApiTags('Pay')
@ApiBearerAuth()
@Controller('pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @UseGuards(AuthGuard, GeofenceGuard)
  @Get('prices')
  @ApiOperation({ summary: 'Get configured payment prices in cents' })
  getPrices() {
    return this.payService.getPrices();
  }

  @UseGuards(AuthGuard, GeofenceGuard, ComplianceAccessGuard, BannedUserGuard)
  @Post('contracts/:contractId/ticket')
  @ApiOperation({ summary: 'Purchase an in-app ticket for a contract' })
  purchaseTicket(
    @CurrentUser() user: { id: string },
    @Param('contractId') contractId: string,
  ) {
    return this.payService.purchaseTicket(user.id, contractId);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  @Post('metered/usage')
  @ApiOperation({ summary: 'Record a Stripe metered billing usage event for an enterprise' })
  recordMeteredUsage(
    @CurrentUser() user: { id: string },
    @Body() dto: RecordMeteredUsageDto,
  ) {
    return this.payService.recordMeteredUsage(user.id, dto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  @Get('metered/:enterpriseId/summary')
  @ApiOperation({ summary: 'Get current-period Stripe metered usage for an enterprise' })
  getMeteredUsageSummary(
    @CurrentUser() user: { id: string },
    @Param('enterpriseId') enterpriseId: string,
  ) {
    return this.payService.getMeteredUsageSummary(user.id, enterpriseId);
  }
}
