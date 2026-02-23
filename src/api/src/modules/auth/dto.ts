import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string; // allow-secret
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string; // allow-secret
}

export class EnterpriseTokenDto {
  @IsString()
  enterpriseToken: string; // allow-secret
}
