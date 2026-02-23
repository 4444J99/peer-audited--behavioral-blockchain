import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { ContractsService, CreateContractDto, SubmitProofDto } from './contracts.service';
import { DisputeService } from '../../../services/escrow/dispute.service';
import { StripeFboService } from '../../../services/escrow/stripe.service';
import { LedgerService } from '../../../services/ledger/ledger.service';
import { TruthLogService } from '../../../services/ledger/truth-log.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { processIAP } from '../../../services/billing';

@Controller('contracts')
@UseGuards(GeofenceGuard, AuthGuard)
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly disputeService: DisputeService,
    private readonly pool: Pool,
    private readonly stripe: StripeFboService,
    private readonly ledger: LedgerService,
    private readonly truthLog: TruthLogService,
  ) {}

  @Get()
  async findByUser(@CurrentUser() user: { id: string }) {
    return this.contractsService.getUserContracts(user.id);
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: Omit<CreateContractDto, 'userId'>) {
    return this.contractsService.createContract({ ...dto, userId: user.id });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractsService.getContract(id);
  }

  @Get(':id/proofs')
  async getProofs(@Param('id') contractId: string) {
    return this.contractsService.getContractProofs(contractId);
  }

  @Post(':id/proof')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async submitProof(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: Omit<SubmitProofDto, 'userId'>,
  ) {
    return this.contractsService.submitProof(contractId, { ...dto, userId: user.id });
  }

  @Post(':id/grace-day')
  async useGraceDay(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.useGraceDay(contractId, user.id);
  }

  @Post(':id/dispute')
  async disputeVerdict(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.fileDispute(user.id, contractId);
  }

  @Post(':id/ticket')
  async purchaseTicket(
    @Param('id') contractId: string,
    @CurrentUser() user: { id: string },
  ) {
    return processIAP(this.pool, this.stripe, this.ledger, this.truthLog, user.id, contractId);
  }
}
