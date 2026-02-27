import { IsEmail, IsString, MinLength, Matches, IsBoolean, IsDateString, IsOptional } from 'class-validator';
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

  @ApiProperty({ description: 'User password', minLength: 12 }) // allow-secret
  @IsString()
  @MinLength(12)
  password!: string; // allow-secret
}

export class EnterpriseTokenDto {
  @ApiProperty({ description: 'Enterprise SSO token to exchange for a session JWT' }) // allow-secret
  @IsString()
  enterpriseToken!: string; // allow-secret
}
