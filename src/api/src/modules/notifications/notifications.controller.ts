import { Controller, Get, Post, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser, Public } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  async getNotifications(@CurrentUser() user: { id: string }) {
    return this.notifications.getUserNotifications(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notifications.getUnreadCount(user.id);
    return { count };
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to real-time notification stream via SSE' })
  stream(@CurrentUser() user: { id: string }): Observable<MessageEvent> {
    return this.notifications.getStreamForUser(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
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
@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the public anonymized event feed' })
  @Public()
  async getPublicFeed(@Query('limit') limit?: string) {
    const maxLimit = Math.min(parseInt(limit || '50', 10) || 50, 100);
    return this.notifications.getPublicFeed(maxLimit);
  }
}
