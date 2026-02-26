import { useFuryStore } from '../useFuryStore';
import * as apiClient from '../../services/api-client';

// Mock the API client
jest.mock('../../services/api-client', () => ({
  getAuthToken: jest.fn(),
  api: {
    requestFuryStreamTicket: jest.fn(),
  },
}));

describe('useFuryStore Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFuryStore.setState({
      assignments: [],
      isConnected: false,
      error: null,
      eventSource: null,
    });
  });

  it('fails to connect if no auth token is present', async () => {
    (apiClient.getAuthToken as jest.Mock).mockReturnValue(null);

    await useFuryStore.getState().connectStream();

    expect(useFuryStore.getState().error).toBe('No authentication token available for SSE stream');
    expect(useFuryStore.getState().isConnected).toBe(false);
  });

  it('requests an SSE ticket before opening the stream', async () => {
    (apiClient.getAuthToken as jest.Mock).mockReturnValue('mock-jwt-token');
    ((apiClient as any).api.requestFuryStreamTicket as jest.Mock).mockResolvedValue({
      ticket: 'sse-ticket',
      expiresInSeconds: 60,
    });

    // Mute console.error for this test (EventSource isn't fully mocked)
    const originalError = console.error;
    console.error = jest.fn();

    // In a Node/Jest environment without jsdom full-mock, EventSource might throw, 
    // but ticket issuance should still happen before constructor failure.
    await useFuryStore.getState().connectStream();

    expect((apiClient as any).api.requestFuryStreamTicket).toHaveBeenCalled();
    
    console.error = originalError;
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
});
