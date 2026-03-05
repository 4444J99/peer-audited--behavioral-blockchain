import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProofMediaType {
  VIDEO = 'video/mp4',
  IMAGE = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  SCREENSHOT = 'image/webp',
}

export class RequestUploadUrlDto {
  @ApiProperty({ description: 'Contract ID associated with this proof', example: 'c8f7e6d5-a4b3-c2d1-e0f9-a8b7c6d5e4f3' })
  @IsString()
  contractId!: string;

  @ApiProperty({ description: 'MIME type of the proof media', enum: ProofMediaType, example: 'video/mp4' })
  @IsEnum(ProofMediaType)
  contentType!: ProofMediaType;

  @ApiPropertyOptional({ description: 'Optional description of the proof', example: 'No Contact compliance — Day 7' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'R2 storage key returned from the upload URL request', example: 'proofs/abc123/1709123456789.mp4' })
  @IsString()
  storageKey!: string;

  @ApiPropertyOptional({ description: 'Flag indicating if the proof was captured with biometric lock active' })
  @IsOptional()
  @IsBoolean()
  biometricVerified?: boolean;

  @ApiPropertyOptional({ description: 'Type of biometric used', enum: ['FACE', 'VOICE'] })
  @IsOptional()
  @IsString()
  biometricType?: 'FACE' | 'VOICE';

  @ApiPropertyOptional({ description: 'Hardware/Device metadata for sensory integrity verification' })
  @IsOptional()
  @IsObject()
  deviceMetadata?: Record<string, any>;
}
