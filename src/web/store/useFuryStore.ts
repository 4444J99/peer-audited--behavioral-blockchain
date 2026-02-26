import { create } from 'zustand';
import { api, getAuthToken } from '../services/api-client';

export interface Assignment {
  assignmentId: string;
  proofId: string;
  assignedAt: string;
  contractId: string;
  submittedAt: string;
  contentType: string | null;
  description: string | null;
  viewUrl: string | null;
}

interface FuryState {
  assignments: Assignment[];
  isConnected: boolean;
  error: string | null;
  eventSource: EventSource | null;
  connectStream: () => Promise<void>;
  disconnectStream: () => void;
  removeAssignment: (assignmentId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useFuryStore = create<FuryState>((set, get) => ({
  assignments: [],
  isConnected: false,
  error: null,
  eventSource: null,

  connectStream: async () => {
    // Disconnect existing before reconnecting
    get().disconnectStream();

    const token = getAuthToken();
    if (!token) {
      set({ error: 'No authentication token available for SSE stream' });
      return;
    }

    let ticket: string;
    try {
      const ticketResponse = await api.requestFuryStreamTicket();
      ticket = ticketResponse.ticket;
    } catch {
      set({ error: 'Unable to authorize Panopticon stream.', isConnected: false });
      return;
    }

    const url = new URL(`${API_BASE}/fury/stream`);
    url.searchParams.append('ticket', ticket);

    let eventSource: EventSource;
    try {
      eventSource = new EventSource(url.toString());
    } catch {
      set({ error: 'Unable to open Panopticon stream.', isConnected: false });
      return;
    }

    eventSource.onopen = () => {
      set({ isConnected: true, error: null });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data.assignments)) {
          set({ assignments: data.assignments });
        }
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      set({ isConnected: false, error: 'Connection to Panopticon stream lost.' });
      eventSource.close();
      
      // Attempt reconnect after 5s
      setTimeout(() => {
        void get().connectStream();
      }, 5000);
    };

    set({ eventSource });
  },

  disconnectStream: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      set({ eventSource: null, isConnected: false });
    }
  },

  removeAssignment: (assignmentId: string) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.assignmentId !== assignmentId),
    }));
  },
}));
