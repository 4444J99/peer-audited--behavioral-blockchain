import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../../guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ModerationService, ContentType } from "../../../services/security/moderation.service";
import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class FlagContentDto {
  @ApiProperty({ description: "Type of content", enum: ["PROOF_MEDIA", "PROFILE_TEXT", "CONTRACT_TITLE", "WHISTLEBLOWER_REPORT"] })
  @IsEnum(["PROOF_MEDIA", "PROFILE_TEXT", "CONTRACT_TITLE", "WHISTLEBLOWER_REPORT"])
  contentType!: ContentType;

  @ApiProperty({ description: "ID of the content" })
  @IsString()
  contentId!: string;

  @ApiProperty({ description: "Reason for flagging" })
  @IsString()
  reason!: string;

  @ApiProperty({ description: "Additional details", required: false })
  @IsOptional()
  @IsString()
  details?: string;
}

export class AppealContentDto {
  @ApiProperty({ description: "Appeal explanation text" })
  @IsString()
  appealText!: string;
}

@ApiTags("Moderation (User)")
@ApiBearerAuth()
@Controller("moderation")
@UseGuards(AuthGuard)
export class UserModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post("flag")
  @ApiOperation({ summary: "Flag content for moderation review" })
  async flagContent(
    @CurrentUser() user: { id: string },
    @Body() body: FlagContentDto,
  ) {
    return this.moderation.flagContent(
      body.contentType,
      body.contentId,
      body.reason,
      { reporterId: user.id, details: body.details }
    );
  }

  @Post("appeal/:flagId")
  @ApiOperation({ summary: "Appeal a moderation decision" })
  async appealContent(
    @Param("flagId") flagId: string,
    @CurrentUser() user: { id: string },
    @Body() body: AppealContentDto,
  ) {
    return this.moderation.appealContent(flagId, user.id, body.appealText);
  }
}
