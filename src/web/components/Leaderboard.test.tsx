/** @jest-environment jsdom */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;
  withCredentials: boolean;
  closed = false;

  constructor(url: string, init?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = init?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  simulateOpen() {
    this.onopen?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.();
  }
}

jest.mock('../services/api-client', () => ({
  api: {
    getLeaderboard: jest.fn().mockResolvedValue([]),
    issueLeaderboardStreamCookie: jest.fn().mockResolvedValue({ expiresInSeconds: 60 }),
  },
  getAuthToken: jest.fn().mockReturnValue('session-token'),
}));

jest.mock('./Leaderboard.css', () => ({}));

import Leaderboard from './Leaderboard';
import { api, getAuthToken } from '../services/api-client';

const mockApi = api as unknown as {
  getLeaderboard: jest.Mock;
  issueLeaderboardStreamCookie: jest.Mock;
};
const mockGetAuthToken = getAuthToken as unknown as jest.Mock;

const ROW = {
  id: 'u-1',
  email: 'valkyrie@styx.protocol',
  integrity_score: 93,
  created_at: '2026-01-02T00:00:00Z',
};

describe('Leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockEventSource.instances = [];
    (global as any).EventSource = MockEventSource;
    mockApi.getLeaderboard.mockResolvedValue([]);
    mockApi.issueLeaderboardStreamCookie.mockResolvedValue({ expiresInSeconds: 60 });
    mockGetAuthToken.mockReturnValue('session-token');
  });

  afterEach(() => {
    delete (global as any).EventSource;
  });

  it('renders the header and the period filters', async () => {
    render(<Leaderboard />);

    expect(screen.getByText(/Tavern Board/)).toBeDefined();
    expect(screen.getByText('weekly')).toBeDefined();
    expect(screen.getByText('monthly')).toBeDefined();
    expect(screen.getByText('All Time')).toBeDefined();

    await waitFor(() => expect(mockApi.getLeaderboard).toHaveBeenCalled());
  });

  it('opens an SSE subscription after issuing the stream cookie', async () => {
    render(<Leaderboard />);

    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    expect(mockApi.issueLeaderboardStreamCookie).toHaveBeenCalled();
    const source = MockEventSource.instances[0];
    expect(source.url).toBe('/api/dashboard/leaderboard/stream?limit=10');
    expect(source.withCredentials).toBe(true);
  });

  it('renders rows pushed over the stream', async () => {
    render(<Leaderboard />);

    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    await act(async () => {
      MockEventSource.instances[0].simulateMessage([ROW]);
    });

    // The name appears twice: the ranked row and the Fury of the Week spotlight.
    expect(screen.getAllByText('valkyrie')).toHaveLength(2);
    expect(screen.getByText('Fury of the Week')).toBeDefined();
  });

  it('ignores a malformed stream message instead of blanking the board', async () => {
    render(<Leaderboard />);

    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    await act(async () => {
      MockEventSource.instances[0].simulateMessage([ROW]);
    });
    await act(async () => {
      MockEventSource.instances[0].onmessage?.({ data: 'not-json' });
      MockEventSource.instances[0].simulateMessage({ notAnArray: true });
    });

    expect(screen.getAllByText('valkyrie').length).toBeGreaterThan(0);
  });

  it('falls back to polling when the stream errors', async () => {
    jest.useFakeTimers();
    try {
      render(<Leaderboard />);

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const source = MockEventSource.instances[0];
      expect(source).toBeDefined();

      mockApi.getLeaderboard.mockResolvedValue([ROW]);
      const callsBeforeError = mockApi.getLeaderboard.mock.calls.length;

      await act(async () => {
        source.simulateError();
      });
      expect(source.closed).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockApi.getLeaderboard.mock.calls.length).toBeGreaterThan(callsBeforeError);
    } finally {
      jest.useRealTimers();
    }
  });

  it('polls without opening a stream when there is no session token', async () => {
    mockGetAuthToken.mockReturnValue('');

    render(<Leaderboard />);

    await waitFor(() => expect(mockApi.getLeaderboard).toHaveBeenCalled());
    expect(MockEventSource.instances).toHaveLength(0);
    expect(mockApi.issueLeaderboardStreamCookie).not.toHaveBeenCalled();
  });

  it('polls without opening a stream when EventSource is unavailable', async () => {
    delete (global as any).EventSource;

    render(<Leaderboard />);

    await waitFor(() => expect(mockApi.getLeaderboard).toHaveBeenCalled());
    expect(mockApi.issueLeaderboardStreamCookie).not.toHaveBeenCalled();
  });

  it('closes the stream on unmount', async () => {
    const { unmount } = render(<Leaderboard />);

    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const source = MockEventSource.instances[0];

    unmount();

    expect(source.closed).toBe(true);
  });
});
