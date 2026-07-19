import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../../guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";

@ApiTags("Behavioral")
@Controller("behavioral")
export class BehavioralController {
  constructor(private readonly enhancements: BehavioralEnhancementsService) {}

  @Get("commitment-devices/catalog")
  @ApiOperation({ summary: "List the catalog of available commitment devices" })
  getCatalog() {
    return this.enhancements.getCommitmentDeviceCatalog();
  }

  @Post("commitment-devices/:deviceId/subscribe")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Subscribe to a commitment device (persisted to DB; H1 fix)",
  })
  @UseGuards(AuthGuard)
  async subscribe(
    @CurrentUser() user: { id: string },
    @Param("deviceId") deviceId: string,
  ) {
    return this.enhancements.subscribeToDevice(user.id, deviceId);
  }

  @Delete("commitment-devices/:deviceId/subscribe")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel a commitment device subscription" })
  @UseGuards(AuthGuard)
  async unsubscribe(
    @CurrentUser() user: { id: string },
    @Param("deviceId") deviceId: string,
  ) {
    return this.enhancements.unsubscribeFromDevice(user.id, deviceId);
  }

  @Get("crab-bucket/risk")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Classify crab-bucket (self-sabotage) risk for the current user",
  })
  @UseGuards(AuthGuard)
  async risk(@CurrentUser() user: { id: string }) {
    return this.enhancements.analyzeCrabBucketRisk(user.id);
  }

  @Get("habituation/:contractId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Detect habituation signals on a contract" })
  @UseGuards(AuthGuard)
  async habituation(@Param("contractId") contractId: string) {
    return this.enhancements.detectContractHabituation(contractId);
  }

  @Post("swaps")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Propose a behavior swap from one contract to a different oath category",
  })
  @UseGuards(AuthGuard)
  async proposeSwap(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      sourceContractId: string;
      targetOathCategory: string;
      carryOverPct: number;
    },
  ) {
    return this.enhancements.proposeBehaviorSwap(
      user.id,
      body.sourceContractId,
      body.targetOathCategory,
      body.carryOverPct,
    );
  }
}
