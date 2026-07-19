import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { Pool } from 'pg';
import { firstValueFrom, timeout } from 'rxjs';

describe('NotificationsService — SSE', () => {
  let service: NotificationsService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new NotificationsService(mockPool as unknown as Pool);
    jest.clearAllMocks();
  });

  it('should emit notification to SSE stream for matching userId', async () => {
    const mockNotification = {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'CONTRACT_CREATED',
      title: 'Test',
      body: null,
      read: false,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    mockPool.query.mockResolvedValueOnce({ rows: [mockNotification] });

    const stream = service.getStreamForUser('user-1');

    // Create notification — should emit to stream
    const notificationPromise = firstValueFrom(stream.pipe(timeout(1000)));

    await service.create({
      userId: 'user-1',
      type: 'CONTRACT_CREATED',
      title: 'Test',
    });

    const event = await notificationPromise;
    expect(event.data).toEqual(mockNotification);
  });

  it('should NOT emit to SSE stream for different userId', async () => {
    const mockNotification = {
      id: 'notif-2',
      user_id: 'user-2',
      type: 'PROOF_SUBMITTED',
      title: 'Other User',
      body: null,
      read: false,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    mockPool.query.mockResolvedValueOnce({ rows: [mockNotification] });

    const stream = service.getStreamForUser('user-1'); // Listening as user-1

    let received = false;
    const sub = stream.subscribe(() => { received = true; });

    // Create notification for user-2
    await service.create({
      userId: 'user-2',
      type: 'PROOF_SUBMITTED',
      title: 'Other User',
    });

    // Small delay to ensure event would have fired
    await new Promise((r) => setTimeout(r, 50));

    expect(received).toBe(false);
    sub.unsubscribe();
  });

  it('should emit multiple notifications in order', async () => {
    const notifications: string[] = [];

    const stream = service.getStreamForUser('user-3');
    const sub = stream.subscribe((event) => {
      notifications.push((event.data as any).title);
    });

    // Create 3 notifications
    for (let i = 1; i <= 3; i++) {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: `notif-${i}`,
          user_id: 'user-3',
          type: 'TEST',
          title: `Notification ${i}`,
          body: null,
          read: false,
          metadata: null,
          created_at: new Date().toISOString(),
        }],
      });
      await service.create({
        userId: 'user-3',
        type: 'TEST',
        title: `Notification ${i}`,
      });
    }

    await new Promise((r) => setTimeout(r, 50));

    expect(notifications).toEqual(['Notification 1', 'Notification 2', 'Notification 3']);
    sub.unsubscribe();
  });
});
