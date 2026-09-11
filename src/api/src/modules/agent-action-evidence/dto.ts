import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  ApprovalDecision,
  MutationOutcome,
  PeerReviewFinding,
  PolicyOutcome,
  PrincipalType,
  RollbackOutcome,
  VerificationOutcome,
} from "./agent-action-evidence.types";

const shortText = { minLength: 1, maxLength: 200 };

export class AgentPrincipalDto {
  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  id!: string;

  @ApiProperty({ enum: ["HUMAN", "SERVICE", "AGENT"] })
  @IsEnum(["HUMAN", "SERVICE", "AGENT"])
  type!: PrincipalType;

  @ApiPropertyOptional(shortText)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  organization?: string;
}

export class DelegatedAuthorityDto {
  @ApiProperty({ type: AgentPrincipalDto })
  @ValidateNested()
  @Type(() => AgentPrincipalDto)
  grantor!: AgentPrincipalDto;

  @ApiProperty({ type: [String], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(200, { each: true })
  scopes!: string[];

  @ApiProperty({ type: [String], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  constraints!: string[];

  @ApiPropertyOptional(shortText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  grantReference?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class PolicyDecisionDto {
  @ApiProperty({ enum: ["ALLOW", "DENY", "REQUIRE_APPROVAL"] })
  @IsEnum(["ALLOW", "DENY", "REQUIRE_APPROVAL"])
  outcome!: PolicyOutcome;

  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  policyId!: string;

  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  policyVersion!: string;

  @ApiProperty({ type: [String], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  reasons!: string[];

  @ApiProperty({ format: "date-time" })
  @IsISO8601()
  evaluatedAt!: string;
}

export class EvidenceReferenceDto {
  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  kind!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  uri?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  digest?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;
}

export class ToolCallReceiptDto {
  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  tool!: string;

  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  invocationId!: string;

  @ApiProperty({ enum: ["SUCCEEDED", "FAILED"] })
  @IsEnum(["SUCCEEDED", "FAILED"])
  outcome!: "SUCCEEDED" | "FAILED";

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  requestDigest?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responseDigest?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;
}

export class ProposedMutationDto {
  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  kind!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  target!: string;

  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  operation!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  summary!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}

export class ProposeAgentActionDto {
  @ApiProperty(shortText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  producer!: string;

  @ApiProperty({ type: AgentPrincipalDto })
  @ValidateNested()
  @Type(() => AgentPrincipalDto)
  actingPrincipal!: AgentPrincipalDto;

  @ApiProperty({ type: DelegatedAuthorityDto })
  @ValidateNested()
  @Type(() => DelegatedAuthorityDto)
  delegatedAuthority!: DelegatedAuthorityDto;

  @ApiProperty({ type: PolicyDecisionDto })
  @ValidateNested()
  @Type(() => PolicyDecisionDto)
  policyDecision!: PolicyDecisionDto;

  @ApiProperty({ type: [EvidenceReferenceDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EvidenceReferenceDto)
  evidence!: EvidenceReferenceDto[];

  @ApiProperty({ type: [ToolCallReceiptDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ToolCallReceiptDto)
  toolCalls!: ToolCallReceiptDto[];

  @ApiProperty({ type: ProposedMutationDto })
  @ValidateNested()
  @Type(() => ProposedMutationDto)
  proposedMutation!: ProposedMutationDto;

  @ApiProperty()
  @IsBoolean()
  requiresHumanApproval!: boolean;
}

abstract class EvidenceBearingDto {
  @ApiProperty({ type: [EvidenceReferenceDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EvidenceReferenceDto)
  evidence!: EvidenceReferenceDto[];
}

export class RecordApprovalDto extends EvidenceBearingDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] })
  @IsEnum(["APPROVED", "REJECTED"])
  decision!: ApprovalDecision;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason!: string;
}

export class RecordMutationDto extends EvidenceBearingDto {
  @ApiProperty({ enum: ["SUCCEEDED", "FAILED", "PARTIAL"] })
  @IsEnum(["SUCCEEDED", "FAILED", "PARTIAL"])
  outcome!: MutationOutcome;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  receipt!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  beforeDigest?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  afterDigest?: string;
}

export class RecordVerificationDto extends EvidenceBearingDto {
  @ApiProperty({ enum: ["PASSED", "FAILED"] })
  @IsEnum(["PASSED", "FAILED"])
  outcome!: VerificationOutcome;

  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  checks!: string[];
}

export class RecordRollbackDto extends EvidenceBearingDto {
  @ApiProperty({ enum: ["COMPLETED", "FAILED"] })
  @IsEnum(["COMPLETED", "FAILED"])
  outcome!: RollbackOutcome;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  receipt!: string;
}

export class OpenDisputeDto extends EvidenceBearingDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason!: string;
}

export class RecordPeerReviewDto extends EvidenceBearingDto {
  @ApiProperty({ enum: ["AFFIRMED", "REVERSED", "NEEDS_REMEDIATION"] })
  @IsEnum(["AFFIRMED", "REVERSED", "NEEDS_REMEDIATION"])
  finding!: PeerReviewFinding;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  rationale!: string;
}
