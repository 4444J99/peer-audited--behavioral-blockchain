import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthMetricsDto {
  @ApiProperty({ description: 'Current weight in pounds', example: 180 })
  @IsNumber()
  @Min(1)
  currentWeightLbs: number;

  @ApiProperty({ description: 'Height in inches', example: 70 })
  @IsNumber()
  @Min(1)
  heightInches: number;

  @ApiProperty({ description: 'Target weight in pounds', example: 165 })
  @IsNumber()
  @Min(1)
  targetWeightLbs: number;
}

export class CreateContractDto {
  @ApiProperty({ description: 'Oath category (Biological, Cognitive, Professional, Creative, Environmental, Character)', example: 'Biological' })
  @IsString()
  oathCategory: string;

  @ApiProperty({ description: 'Verification method (photo, video, sensor, text)', example: 'photo' })
  @IsString()
  verificationMethod: string;

  @ApiProperty({ description: 'Financial stake amount in USD', example: 50, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  stakeAmount: number;

  @ApiProperty({ description: 'Contract duration in days', example: 30, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiPropertyOptional({ description: 'Health metrics for biological oaths', type: HealthMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthMetricsDto)
  healthMetrics?: HealthMetricsDto;
}

export class SubmitProofDto {
  @ApiProperty({ description: 'R2 media URI of the proof submission', example: 'r2://styx-proofs/abc123.jpg' })
  @IsString()
  mediaUri: string;
}
