import { useFuryStore } from '../useFuryStore';
import * as apiClient from '../../services/api-client';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
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
    this.readyState = 2;
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.();
  }
}

// Mock the API client
jest.mock('../../services/api-client', () => ({
  api: {
    getFuryAssignments: jest.fn(),
    issueFuryStreamCookie: jest.fn(),
  },
}));

(global as any).EventSource = MockEventSource;

describe('useFuryStore Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    MockEventSource.instances = [];
    useFuryStore.getState().disconnectStream();
    useFuryStore.setState({
      assignments: [],
      isConnected: false,
      error: null,
    });
  });

  afterEach(() => {
    useFuryStore.getState().disconnectStream();
    jest.useRealTimers();
  });

  it('polls fury queue and sets assignments on success', async () => {
    ((apiClient as any).api.getFuryAssignments as jest.Mock).mockResolvedValue({
      assignments: [
        { assignmentId: 'a1', proofId: 'p1', assignedAt: '', contractId: '', submittedAt: '', contentType: null, description: null, viewUrl: null },
      ],
    });
    ((apiClient as any).api.issueFuryStreamCookie as jest.Mock).mockResolvedValue({ expiresInSeconds: 60 });

    await useFuryStore.getState().connectStream();

    expect((apiClient as any).api.getFuryAssignments).toHaveBeenCalled();
    expect(useFuryStore.getState().isConnected).toBe(true);
    expect(useFuryStore.getState().assignments).toHaveLength(1);
    expect(useFuryStore.getState().assignments[0].assignmentId).toBe('a1');
  });

  it('sets error state when polling fails', async () => {
    ((apiClient as any).api.getFuryAssignments as jest.Mock).mockRejectedValue(new Error('Network error'));
    ((apiClient as any).api.issueFuryStreamCookie as jest.Mock).mockRejectedValue(new Error('fail'));

    await useFuryStore.getState().connectStream();

    expect(useFuryStore.getState().isConnected).toBe(false);
    expect(useFuryStore.getState().error).toBe('Connection to Panopticon stream lost.');
  });

  it('falls back to polling when SSE errors', async () => {
    ((apiClient as any).api.getFuryAssignments as jest.Mock).mockResolvedValue({ assignments: [] });
    ((apiClient as any).api.issueFuryStreamCookie as jest.Mock).mockResolvedValue({ expiresInSeconds: 60 });

    await useFuryStore.getState().connectStream();

    // Simulate SSE error
    const source = MockEventSource.instances[0];
    expect(source).toBeDefined();
    source.simulateError();

    // Should start polling — advance timer
    ((apiClient as any).api.getFuryAssignments as jest.Mock).mockResolvedValue({
      assignments: [{ assignmentId: 'poll-a1', proofId: 'p1', assignedAt: '', contractId: '', submittedAt: '', contentType: null, description: null, viewUrl: null }],
    });

    jest.advanceTimersByTime(5000);
    // Allow async poll to run
    await Promise.resolve();

    expect(source.closed).toBe(true);
  });

  it('can remove assignments from the queue immediately upon judgment', () => {
    useFuryStore.setState({
      assignments: [
        {
          assignmentId: '1',
          proofId: 'a',
          assignedAt: '',
          contractId: '',
          submittedAt: '',
          contentType: null,
          description: null,
          viewUrl: null,
        },
        {
          assignmentId: '2',
          proofId: 'b',
          assignedAt: '',
          contractId: '',
          submittedAt: '',
          contentType: null,
          description: null,
          viewUrl: null,
        },
      ],
    });

    expect(useFuryStore.getState().assignments.length).toBe(2);

    useFuryStore.getState().removeAssignment('1');

    expect(useFuryStore.getState().assignments.length).toBe(1);
    expect(useFuryStore.getState().assignments[0].assignmentId).toBe('2');
  });

  it('receives assignments via SSE onmessage', async () => {
    ((apiClient as any).api.getFuryAssignments as jest.Mock).mockResolvedValue({ assignments: [] });
    ((apiClient as any).api.issueFuryStreamCookie as jest.Mock).mockResolvedValue({ expiresInSeconds: 60 });

    await useFuryStore.getState().connectStream();

    const source = MockEventSource.instances[0];
    source.simulateOpen();
    source.simulateMessage({
      assignmentId: 'sse-1',
      proofId: 'p2',
      assignedAt: '',
      contractId: 'c1',
      submittedAt: '',
      contentType: null,
      description: null,
      viewUrl: null,
    });

    expect(useFuryStore.getState().assignments).toHaveLength(1);
    expect(useFuryStore.getState().assignments[0].assignmentId).toBe('sse-1');
  });
});
