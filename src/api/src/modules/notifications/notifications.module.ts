import { Module } from "@nestjs/common";
import {
  NotificationsController,
  PublicFeedController,
} from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushTokensService } from "./push-tokens.service";
import { PushDispatchWorker } from "./push-dispatch.worker";
import { ExpoPushProvider } from "./expo-push.provider";
import { NotificationComposerService } from "./notification-composer.service";

@Module({
  controllers: [NotificationsController, PublicFeedController],
  providers: [
    NotificationsService,
    PushTokensService,
    ExpoPushProvider,
    PushDispatchWorker,
    NotificationComposerService,
  ],
  exports: [NotificationsService, PushTokensService, NotificationComposerService],
})
export class NotificationsModule {}
