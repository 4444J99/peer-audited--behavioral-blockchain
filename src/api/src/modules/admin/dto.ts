import { IsString, IsEnum } from 'class-validator';

export class BanUserDto {
  @IsString()
  reason: string;
}

export class ResolveContractDto {
  @IsEnum(['COMPLETED', 'FAILED'])
  outcome: 'COMPLETED' | 'FAILED';
}
