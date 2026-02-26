import { Controller, Post, Get, Param, Body, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { ContractsService } from './contracts.service';
import { CreateContractDto, SubmitProofDto } from './dto';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { BannedUserGuard } from '../../guards/banned-user.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { processIAP } from '../../../services/billing';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly disputeService: DisputeService,
    private readonly pool: Pool,
    private readonly stripe: StripeFboService,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
  ) {}

  @UseGuards(GeofenceGuard, AuthGuard)
  @Get()
  @ApiOperation({ summary: 'List contracts for the authenticated user' })
  async findByUser(@CurrentUser() user: { id: string }) {
    return this.contractsService.getUserContracts(user.id);
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new behavioral contract with a financial stake' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateContractDto) {
    return this.contractsService.createContract({ ...dto, userId: user.id });
  }

  @UseGuards(GeofenceGuard, AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a single contract by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.getContract(id, { userId: user.id });
  }

  @UseGuards(GeofenceGuard, AuthGuard)
  @Get(':id/proofs')
  @ApiOperation({ summary: 'List proof submissions for a contract' })
  async getProofs(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.getContractProofs(contractId, { userId: user.id });
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post(':id/proof')
  @ApiOperation({ summary: 'Submit a proof of compliance for peer review' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async submitProof(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitProofDto,
  ) {
    return this.contractsService.submitProof(contractId, { ...dto, userId: user.id });
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post(':id/grace-day')
  @ApiOperation({ summary: 'Use a grace day on a contract' })
  async useGraceDay(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.useGraceDay(contractId, user.id);
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post(':id/dispute')
  @ApiOperation({ summary: 'File a dispute against a verdict' })
  async disputeVerdict(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.fileDispute(user.id, contractId);
  }

  @UseGuards(GeofenceGuard, AuthGuard, BannedUserGuard)
  @Post(':id/ticket')
  @ApiOperation({ summary: 'Purchase an in-app ticket for a contract' })
  async purchaseTicket(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return processIAP(this.pool, this.stripe, this.ledger, this.truthLog, user.id, contractId);
  }

  // --- No Auth Guard for Bounty Claims (Ex-partner access) ---
  @Post('bounty/:linkId')
  @ApiOperation({ summary: 'Submit evidence against a user via their unique whistleblower bounty link' })
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // Stricter throttling for public endpoint
  async claimBounty(
    @Param('linkId') linkId: string,
    @Body() dto: { mediaUri: string },
    @Res() res: any, // Extract Request to get IP if possible, NestJS often uses @Req
    @Req() req: any
  ) {
    const claimantIp = req.ip || req.connection.remoteAddress;
    const result = await this.contractsService.claimBounty(linkId, dto.mediaUri, claimantIp);
    return res.json(result);
  }
}
