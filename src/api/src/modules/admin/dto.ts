import { IsString, IsEnum, IsOptional, IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BanUserDto {
  @ApiProperty({
    description: "Reason for the ban",
    example: "Repeated fraud attempts",
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ResolveContractDto {
  @ApiProperty({
    description: "Contract resolution outcome",
    enum: ["COMPLETED", "FAILED"],
  })
  @IsEnum(["COMPLETED", "FAILED"])
  outcome!: "COMPLETED" | "FAILED";
}

export class AdminCrisisEscalateDto {
  @ApiProperty({ description: "Target user ID" })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: "Trigger text that caused the escalation" })
  @IsString()
  @IsNotEmpty()
  trigger!: string;
}

export class UpdateJurisdictionDto {
  @ApiProperty({
    description: "Jurisdiction tier",
    enum: ["FULL_ACCESS", "REFUND_ONLY", "HARD_BLOCK"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["FULL_ACCESS", "REFUND_ONLY", "HARD_BLOCK"])
  tier?: "FULL_ACCESS" | "REFUND_ONLY" | "HARD_BLOCK";

  @ApiProperty({
    description: "Disposition mode for settlements",
    enum: ["HOUSE_RETAINED", "REFUND_ONLY"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["HOUSE_RETAINED", "REFUND_ONLY"])
  dispositionMode?: "HOUSE_RETAINED" | "REFUND_ONLY";
}

export class AdminReviewContentDto {
  @ApiProperty({ description: "Review decision", enum: ["APPROVED", "REMOVED"] })
  @IsEnum(["APPROVED", "REMOVED"])
  decision!: "APPROVED" | "REMOVED";

  @ApiProperty({ description: "Admin notes" })
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

export class AdminResolveAppealDto {
  @ApiProperty({ description: "Appeal resolution", enum: ["UPHELD", "OVERTURNED"] })
  @IsEnum(["UPHELD", "OVERTURNED"])
  resolution!: "UPHELD" | "OVERTURNED";

  @ApiProperty({ description: "Admin notes" })
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

// Moderation queue query DTO
export class GetModerationQueueDto {
  @ApiProperty({
    description: "Filter by flag status",
    enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REMOVED", "ESCALATED"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["PENDING", "UNDER_REVIEW", "APPROVED", "REMOVED", "ESCALATED"])
  status?: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REMOVED" | "ESCALATED";
}

// User moderation DTOs with non-empty validation
export class ReportContentDto {
  @ApiProperty({ description: "Content ID being reported" })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  contentId!: string;

  @ApiProperty({ description: "Reason for report" })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AppealContentDto {
  @ApiProperty({ description: "Appeal text" })
  @IsString()
  @IsNotEmpty()
  appealText!: string;
}
