import { IsString, IsEnum } from 'class-validator';

export class SubmitVerdictDto {
  @IsString()
  assignmentId: string;

  @IsEnum(['PASS', 'FAIL'])
  verdict: 'PASS' | 'FAIL';
}
