import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.notifications.markRead(id, user.id);
    return { status: 'read' };
  }
}
