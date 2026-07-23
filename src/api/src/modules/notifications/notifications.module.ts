import { Module } from "@nestjs/common";
import {
  NotificationsController,
  PublicFeedController,
} from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushTokensService } from "./push-tokens.service";
import { PushDispatchWorker } from "./push-dispatch.worker";
import { ExpoPushProvider } from "./expo-push.provider";

@Module({
  controllers: [NotificationsController, PublicFeedController],
  providers: [
    NotificationsService,
    PushTokensService,
    ExpoPushProvider,
    PushDispatchWorker,
  ],
  exports: [NotificationsService, PushTokensService],
})
export class NotificationsModule {}
