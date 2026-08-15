import { IsString, IsEnum, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * How a proof's media was produced. Three states, because two would lie:
 * a proof whose origin was never recorded is UNKNOWN, and calling that
 * "synthetic" or "native" invents a fact.
 */
export const CAPTURE_SOURCES = ['NATIVE_CAMERA', 'SYNTHETIC_BETA'] as const;
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

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

  // NOTE: client-asserted biometric verification (biometricVerified/biometricType)
  // was intentionally removed. The server must not trust a client claiming its own
  // biometric check passed; that requires server-side attestation to be meaningful.
  @ApiPropertyOptional({ description: 'Hardware/Device metadata for sensory integrity verification' })
  @IsOptional()
  @IsObject()
  deviceMetadata?: Record<string, any>;

  /**
   * How the media was produced. Optional because clients predating this field
   * must keep working — but an ABSENT source is recorded as unknown and is
   * never treated as native. The server decides what the value means; the
   * client only reports it, and reporting NATIVE_CAMERA without echoing the
   * issued nonce does not make a proof verified.
   */
  @ApiPropertyOptional({
    description: 'How the media was captured',
    enum: CAPTURE_SOURCES,
    example: 'SYNTHETIC_BETA',
  })
  @IsOptional()
  @IsIn(CAPTURE_SOURCES)
  captureSource?: CaptureSource;

  @ApiPropertyOptional({ description: 'The nonce issued by POST /proofs/upload-url, echoed back' })
  @IsOptional()
  @IsString()
  captureNonce?: string;
}
