import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ description: 'Reason for the ban', example: 'Repeated fraud attempts' })
  @IsString()
  reason: string;
}

export class ResolveContractDto {
  @ApiProperty({ description: 'Contract resolution outcome', enum: ['COMPLETED', 'FAILED'] })
  @IsEnum(['COMPLETED', 'FAILED'])
  outcome: 'COMPLETED' | 'FAILED';
}
