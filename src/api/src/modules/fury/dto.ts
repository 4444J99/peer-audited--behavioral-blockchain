import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FuryViolationCode } from '../../../../shared/fury-logic/violation-codes';

export class SubmitVerdictDto {
  @ApiProperty({ description: 'Fury assignment ID to verdict on' })
  @IsString()
  assignmentId!: string;

  @ApiProperty({ description: 'Verdict: PASS or FAIL', enum: ['PASS', 'FAIL'] })
  @IsEnum(['PASS', 'FAIL'])
  verdict!: 'PASS' | 'FAIL';

  @ApiProperty({ description: 'Rejection reason code (required if verdict is FAIL)', required: false, enum: FuryViolationCode })
  @IsOptional()
  @IsEnum(FuryViolationCode)
  rejectionCode?: FuryViolationCode;
}
