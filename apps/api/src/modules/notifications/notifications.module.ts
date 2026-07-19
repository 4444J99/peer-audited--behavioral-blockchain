import { Module } from "@nestjs/common";
import {
  NotificationsController,
  PublicFeedController,
} from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController, PublicFeedController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
