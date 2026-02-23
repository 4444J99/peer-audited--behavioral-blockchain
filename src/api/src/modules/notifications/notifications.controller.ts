import { Controller, Get, Post, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser() user: { id: string }) {
    return this.notifications.getUserNotifications(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notifications.getUnreadCount(user.id);
    return { count };
  }

  @Sse('stream')
  stream(@CurrentUser() user: { id: string }): Observable<MessageEvent> {
    return this.notifications.getStreamForUser(user.id);
  }

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.notifications.markRead(id, user.id);
    return { status: 'read' };
  }
}

/**
 * Public feed controller — serves anonymized system events.
 * Mounted at /feed (separate from /notifications which requires auth).
 */
@Controller('feed')
export class FeedController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Public()
  async getPublicFeed(@Query('limit') limit?: string) {
    const maxLimit = Math.min(parseInt(limit || '50', 10) || 50, 100);
    return this.notifications.getPublicFeed(maxLimit);
  }
}
