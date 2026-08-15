import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../../guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { IdentityOathService } from "./identity-oath.service";
import { DeclareIdentityOathDto } from "./dto";

@ApiTags("Onboarding")
@ApiBearerAuth()
@Controller("onboarding")
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly identityOaths: IdentityOathService) {}

  @Get("identity-oath")
  @ApiOperation({
    summary: "Get resumable identity-oath onboarding state for the user",
  })
  async getIdentityOath(
    @CurrentUser() user: { id: string },
    @Query("oathCategory") oathCategory?: string,
  ) {
    return this.identityOaths.getOnboardingState(user.id, oathCategory);
  }

  @Post("identity-oath")
  @ApiOperation({
    summary: "Declare the identity the user is becoming for this journey",
  })
  async declareIdentityOath(
    @CurrentUser() user: { id: string },
    @Body() dto: DeclareIdentityOathDto,
  ) {
    return this.identityOaths.declare(user.id, dto);
  }
}
