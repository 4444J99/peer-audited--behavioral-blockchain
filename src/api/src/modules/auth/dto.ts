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
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
