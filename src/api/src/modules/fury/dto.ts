import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVerdictDto {
  @ApiProperty({ description: 'Fury assignment ID to verdict on' })
  @IsString()
  assignmentId: string;

  @ApiProperty({ description: 'Verdict: PASS or FAIL', enum: ['PASS', 'FAIL'] })
  @IsEnum(['PASS', 'FAIL'])
  verdict: 'PASS' | 'FAIL';
}
