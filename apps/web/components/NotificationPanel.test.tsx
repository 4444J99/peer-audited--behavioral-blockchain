import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../services/api-client', () => ({
  api: {
    getNotifications: jest.fn().mockResolvedValue([]),
    getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
    markNotificationRead: jest.fn(),
    issueNotificationStreamCookie: jest.fn(),
  },
  getAuthToken: jest.fn().mockReturnValue(null),
}));

import NotificationPanel from './NotificationPanel';

describe('NotificationPanel', () => {
  it('renders the bell button', () => {
    const html = renderToStaticMarkup(<NotificationPanel />);

    // The component renders a button with a Bell icon (SVG).
    // The button is present in the output.
    expect(html).toBeTruthy();
    expect(html).toContain('<button');
  });

  it('does not render the dropdown by default (open is false initially)', () => {
    const html = renderToStaticMarkup(<NotificationPanel />);

    // The notification dropdown heading should not appear when panel is closed
    expect(html).not.toContain('Notifications');
  });

  it('does not show unread badge when count is 0', () => {
    const html = renderToStaticMarkup(<NotificationPanel />);

    // The unread badge with "9+" should not appear when count is 0
    expect(html).not.toContain('9+');
  });

  it('renders as a relative container for proper dropdown positioning', () => {
    const html = renderToStaticMarkup(<NotificationPanel />);

    expect(html).toContain('relative');
  });
});
