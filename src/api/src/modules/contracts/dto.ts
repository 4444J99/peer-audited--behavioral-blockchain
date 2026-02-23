import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class HealthMetricsDto {
  @IsNumber()
  @Min(1)
  currentWeightLbs: number;

  @IsNumber()
  @Min(1)
  heightInches: number;

  @IsNumber()
  @Min(1)
  targetWeightLbs: number;
}

export class CreateContractDto {
  @IsString()
  oathCategory: string;

  @IsString()
  verificationMethod: string;

  @IsNumber()
  @Min(0.01)
  stakeAmount: number;

  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthMetricsDto)
  healthMetrics?: HealthMetricsDto;
}

export class SubmitProofDto {
  @IsString()
  mediaUri: string;
}
