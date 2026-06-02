import { IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BanUserDto {
  @ApiProperty({
    description: "Reason for the ban",
    example: "Repeated fraud attempts",
  })
  @IsString()
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
  userId!: string;

  @ApiProperty({ description: "Trigger text that caused the escalation" })
  @IsString()
  trigger!: string;
}

export class UpdateJurisdictionDto {
  @ApiProperty({
    description: "Jurisdiction tier",
    enum: ["FULL_ACCESS", "REFUND_ONLY", "HARD_BLOCK"],
    required: false,
  })
  @IsEnum(["FULL_ACCESS", "REFUND_ONLY", "HARD_BLOCK"])
  tier?: "FULL_ACCESS" | "REFUND_ONLY" | "HARD_BLOCK";

  @ApiProperty({
    description: "Disposition mode for settlements",
    enum: ["HOUSE_RETAINED", "REFUND_ONLY"],
    required: false,
  })
  @IsEnum(["HOUSE_RETAINED", "REFUND_ONLY"])
  dispositionMode?: "HOUSE_RETAINED" | "REFUND_ONLY";
}
