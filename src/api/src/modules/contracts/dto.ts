import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, IsEmail, Min, Max, ValidateNested, IsInt, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthMetricsDto {
  @ApiProperty({ description: 'Current weight in pounds', example: 180 })
  @IsNumber()
  @Min(1)
  currentWeightLbs!: number;

  @ApiProperty({ description: 'Height in inches', example: 70 })
  @IsNumber()
  @Min(1)
  heightInches!: number;

  @ApiProperty({ description: 'Target weight in pounds', example: 165 })
  @IsNumber()
  @Min(1)
  targetWeightLbs!: number;
}

export class RecoveryAcknowledgmentsDto {
  @ApiProperty({ description: 'User confirms this contract is voluntary' })
  @IsBoolean()
  voluntary!: boolean;

  @ApiProperty({ description: 'User confirms no minors are involved' })
  @IsBoolean()
  noMinors!: boolean;

  @ApiProperty({ description: 'User confirms no dependents are affected' })
  @IsBoolean()
  noDependents!: boolean;

  @ApiProperty({ description: 'User confirms no legal obligations are being violated' })
  @IsBoolean()
  noLegalObligations!: boolean;
}

export class RecoveryMetadataDto {
  @ApiProperty({ description: 'Email of the accountability partner', example: 'friend@example.com' })
  @IsEmail()
  accountabilityPartnerEmail!: string;

  @ApiPropertyOptional({ description: 'Client-side hashed no-contact identifiers (max 3)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3)
  noContactIdentifiers?: string[];

  @ApiProperty({ description: 'Safety acknowledgments', type: RecoveryAcknowledgmentsDto })
  @ValidateNested()
  @Type(() => RecoveryAcknowledgmentsDto)
  acknowledgments!: RecoveryAcknowledgmentsDto;
}

export class CreateContractDto {
  @ApiProperty({ description: 'Oath category (Biological, Cognitive, Professional, Creative, Environmental, Character, Recovery)', example: 'Biological' })
  @IsString()
  oathCategory!: string;

  @ApiProperty({ description: 'Verification method (photo, video, sensor, text)', example: 'photo' })
  @IsString()
  verificationMethod!: string;

  @ApiProperty({ description: 'Financial stake amount in USD', example: 50, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  stakeAmount!: number;

  @ApiProperty({ description: 'Contract duration in days', example: 30, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays!: number;

  @ApiPropertyOptional({ description: 'Health metrics for biological oaths', type: HealthMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthMetricsDto)
  healthMetrics?: HealthMetricsDto;

  @ApiPropertyOptional({ description: 'Recovery stream metadata (required for RECOVERY_ oaths)', type: RecoveryMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecoveryMetadataDto)
  recoveryMetadata?: RecoveryMetadataDto;
}

export class SubmitProofDto {
  @ApiProperty({ description: 'R2 media URI of the proof submission', example: 'r2://styx-proofs/abc123.jpg' })
  @IsString()
  mediaUri!: string;
}
