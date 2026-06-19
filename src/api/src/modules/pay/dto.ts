import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { MeteredEventType } from '../b2b/billing.service';

export const METERED_EVENT_TYPES: MeteredEventType[] = [
  'phash_scan',
  'gemini_call',
  'anomaly_detection',
];

export class RecordMeteredUsageDto {
  @IsString()
  @Matches(/^[A-Za-z0-9-]{1,64}$/)
  enterpriseId!: string;

  @IsIn(METERED_EVENT_TYPES)
  metric!: MeteredEventType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_.:-]{1,128}$/)
  eventId?: string;
}
