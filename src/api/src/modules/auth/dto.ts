import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (minimum 6 characters)', example: 'secure123', minLength: 6 }) // allow-secret
  @IsString()
  @MinLength(6)
  password: string; // allow-secret
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' }) // allow-secret
  @IsString()
  @MinLength(1)
  password: string; // allow-secret
}

export class EnterpriseTokenDto {
  @ApiProperty({ description: 'Enterprise SSO token to exchange for a session JWT' }) // allow-secret
  @IsString()
  enterpriseToken: string; // allow-secret
}
