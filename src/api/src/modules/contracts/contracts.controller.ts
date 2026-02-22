import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ContractsService, CreateContractDto, SubmitProofDto } from './contracts.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { GeofenceGuard } from '../../common/guards/geofence.guard';

@Controller('contracts')
@UseGuards(GeofenceGuard, AuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async findByUser(@Query('userId') userId: string) {
    return this.contractsService.getUserContracts(userId);
  }

  @Post()
  async create(@Body() dto: CreateContractDto) {
    return this.contractsService.createContract(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractsService.getContract(id);
  }

  @Post(':id/proof')
  async submitProof(@Param('id') contractId: string, @Body() dto: SubmitProofDto) {
    return this.contractsService.submitProof(contractId, dto);
  }
}
