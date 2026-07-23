import { Module } from "@nestjs/common";
import { BetaWaitlistController } from "./beta-waitlist.controller";
import { BetaWaitlistService } from "./beta-waitlist.service";
import { RoleGuard } from "../../common/guards/role.guard";
import {
  BETA_WAITLIST_NOTIFIER,
  LoggingBetaWaitlistNotifier,
} from "./beta-waitlist.notifier";

// Pool is provided by the global DatabaseModule.
@Module({
  controllers: [BetaWaitlistController],
  providers: [
    BetaWaitlistService,
    RoleGuard,
    { provide: BETA_WAITLIST_NOTIFIER, useClass: LoggingBetaWaitlistNotifier },
  ],
  exports: [BetaWaitlistService],
})
export class MarketingModule {}
