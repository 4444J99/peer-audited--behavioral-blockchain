import { create } from 'zustand';
import { api } from '../services/api-client';

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
  connectStream: () => Promise<void>;
  disconnectStream: () => void;
  removeAssignment: (assignmentId: string) => void;
}

const POLL_INTERVAL_MS = 5_000;
const SSE_RECONNECT_MS = 5_000;
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
  : 'http://localhost:3000';

// Closure refs — kept outside Zustand state to avoid unnecessary re-renders
let pollTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

function startPolling(poll: () => Promise<void>) {
  if (pollTimer) return;
  pollTimer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

function cleanup() {
  stopped = true;
  eventSource?.close();
  eventSource = null;
  stopPolling();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

export const useFuryStore = create<FuryState>((set, get) => ({
  assignments: [],
  isConnected: false,
  error: null,

  connectStream: async () => {
    get().disconnectStream();
    stopped = false;

    const poll = async () => {
      try {
        const data = await api.getFuryAssignments();
        if (data && Array.isArray(data.assignments)) {
          set({ assignments: data.assignments, isConnected: true, error: null });
        }
      } catch {
        set({ isConnected: false, error: 'Connection to Panopticon stream lost.' });
      }
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connectSSE();
      }, SSE_RECONNECT_MS);
    };

    const connectSSE = async () => {
      if (stopped) return;

      try {
        await api.issueFuryStreamCookie();
        if (stopped) return;

        const source = new EventSource(`${API_BASE}/fury/stream`, { withCredentials: true });
        eventSource = source;

        source.onopen = () => {
          stopPolling();
          set({ isConnected: true, error: null });
        };

        source.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data.assignments)) {
              set({ assignments: data.assignments });
            } else if (data.assignmentId) {
              set((state) => {
                const exists = state.assignments.some((a) => a.assignmentId === data.assignmentId);
                if (exists) return state;
                return { assignments: [...state.assignments, data] };
              });
            }
          } catch {
            // Invalid message — ignore
          }
        };

        source.onerror = () => {
          source.close();
          if (eventSource === source) eventSource = null;
          startPolling(poll);
          scheduleReconnect();
        };
      } catch {
        // SSE not available — use polling
        startPolling(poll);
      }
    };

    // Fetch immediately, then try SSE
    await poll();
    void connectSSE();
  },

  disconnectStream: () => {
    cleanup();
    set({ isConnected: false });
  },

  removeAssignment: (assignmentId: string) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.assignmentId !== assignmentId),
    }));
  },
}));
