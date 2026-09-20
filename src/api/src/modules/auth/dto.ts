import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsIn,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'exactlyOneDeviceIdentifier', async: false })
class ExactlyOneDeviceIdentifier implements ValidatorConstraintInterface {
  validate(_platform: unknown, args: ValidationArguments): boolean {
    const value = args.object as DeviceFingerprintDto;
    const hash = typeof value.hash === 'string' && /^[0-9a-f]{64}$/i.test(value.hash);
    const vendor = typeof value.rawVendorId === 'string' &&
      value.rawVendorId.length >= 16 && value.rawVendorId.length <= 256;
    return (hash && value.rawVendorId === undefined) ||
      (vendor && value.hash === undefined);
  }

  defaultMessage(): string {
    return 'deviceFingerprint requires exactly one of hash or rawVendorId';
  }
}

export class DeviceFingerprintDto {
  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsIn(['ios', 'android', 'web'])
  @Validate(ExactlyOneDeviceIdentifier)
  platform!: 'ios' | 'android' | 'web';

  @ApiProperty({ required: false, description: 'SHA-256 device identifier' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{64}$/i)
  hash?: string;

  @ApiProperty({ required: false, description: 'Opaque client device identifier' })
  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  rawVendorId?: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password (minimum 12 characters, 1 uppercase, 1 digit, 1 symbol)', minLength: 12 }) // allow-secret
  @IsString()
  @MinLength(12)
  @Matches(/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain at least 1 uppercase letter, 1 digit, and 1 symbol',
  })
  password!: string; // allow-secret

  @ApiProperty({ description: 'User confirms they are 18 years or older' })
  @IsBoolean()
  ageConfirmation!: boolean;

  @ApiProperty({ description: 'User accepts the Terms of Service and Privacy Policy' })
  @IsBoolean()
  termsAccepted!: boolean;

  @ApiProperty({ description: 'Date of birth (ISO 8601)', example: '1990-01-15', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Optional referral code', example: 'ABC123', required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ description: 'Optional device fingerprint for multi-account fraud prevention', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceFingerprintDto)
  deviceFingerprint?: DeviceFingerprintDto;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  // AU13: login validates credentials, it does not (re-)impose registration policy.
  // The old @MinLength(12) here locked out any account whose stored password is
  // shorter than the current policy and gave a minor enumeration aid. Require only a
  // non-empty string; complexity is enforced at registration (RegisterDto), not login.
  @ApiProperty({ description: 'User password' }) // allow-secret
  @IsString()
  @MinLength(1)
  password!: string; // allow-secret
}

export class EnterpriseTokenDto {
  @ApiProperty({ description: 'Enterprise SSO token to exchange for a session JWT' }) // allow-secret
  @IsString()
  enterpriseToken!: string; // allow-secret
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Human-readable API key name', required: false, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiProperty({
    description: 'API key lifetime in days',
    required: false,
    minimum: 1,
    maximum: 365,
    default: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
