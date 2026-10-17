import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Capture nonce from the native camera challenge flow' })
  @IsOptional()
  @IsString()
  captureNonce?: string;

  @ApiPropertyOptional({ description: 'Hardware/Device metadata for sensory integrity verification' })
  @IsOptional()
  @IsObject()
  deviceMetadata?: Record<string, any>;
}

export class ChallengeNonceDto {
  @ApiProperty({ description: 'Contract ID for which the nonce is requested' })
  @IsString()
  contractId!: string;
}

export class VerifyNonceDto {
  @ApiProperty({ description: 'The nonce string to verify' })
  @IsString()
  nonce!: string;
}
