import { IsEmail, IsString, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Public beta-waitlist signup payload. The global ValidationPipe runs with
 * `whitelist: true`, so every accepted field must be declared here; unknown
 * keys are stripped before they reach the service.
 */
export class JoinBetaWaitlistDto {
  @ApiProperty({ description: "Prospect email address", example: "you@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Display name" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: "What the prospect wants help with",
    example: "no-contact",
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  goal?: string;

  @ApiPropertyOptional({ description: "Target platform (Phase 1 wedge is iOS)" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string;

  @ApiPropertyOptional({ description: "Raw source token from the CTA/campaign" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @ApiPropertyOptional({ description: "Intent tag carried by the CTA" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  intent?: string;

  @ApiPropertyOptional({ description: "utm_source campaign param" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utm_source?: string;

  @ApiPropertyOptional({ description: "utm_campaign campaign param" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utm_campaign?: string;

  @ApiPropertyOptional({ description: "utm_medium campaign param" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utm_medium?: string;

  @ApiPropertyOptional({ description: "HTTP/document referrer" })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  referrer?: string;

  @ApiPropertyOptional({ description: "Referral code from a `ref` param" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ref?: string;

  @ApiPropertyOptional({ description: "Explicit channel override (rarely needed)" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  channel?: string;
}
