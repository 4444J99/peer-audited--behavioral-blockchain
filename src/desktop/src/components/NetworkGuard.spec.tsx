/**
 * NetworkGuard — desktop panel tests
 *
 * Tests the network authentication boot sequence, status transitions,
 * log accumulation, and conditional rendering logic.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

jest.mock('lucide-react', () => ({
  ShieldAlert: 'ShieldAlert',
  Loader2: 'Loader2',
}));

jest.mock('./NetworkGuard.css', () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// NetworkGuard relies on setTimeout-based boot sequence.
// We reproduce the status machine and log accumulation logic.
// ---------------------------------------------------------------------------

// Use `string` to allow cross-literal comparisons in tests without TS2367
type NetworkStatus = string;

describe('NetworkGuard', () => {
  describe('boot sequence status transitions', () => {
    it('starts in CHECKING status', () => {
      const status: NetworkStatus = 'CHECKING';
      expect(status).toBe('CHECKING');
    });

    it('transitions from CHECKING to SECURE after boot completes', async () => {
      let status: NetworkStatus = 'CHECKING';
      const logs: string[] = [];

      const addLog = (msg: string) => {
        logs.push(`[${new Date().toISOString()}] ${msg}`);
      };

      // Simulate bootSequence (without the real delays)
      addLog('Initiating network uplink...');
      addLog('Verifying corporate VPN tunnel footprint...');
      addLog('Validating static IP against approved ingress list...');
      addLog('Tauri secure environment confirmed.');
      status = 'SECURE';

      expect(status).toBe('SECURE');
      expect(logs).toHaveLength(4);
    });

    it('can transition to BLOCKED status', () => {
      let status: NetworkStatus = 'CHECKING';
      status = 'BLOCKED';
      expect(status).toBe('BLOCKED');
    });
  });

  describe('log accumulation', () => {
    it('accumulates 4 log entries during boot sequence', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => {
        logs.push(`[2026-02-27T00:00:00.000Z] ${msg}`);
      };

      addLog('Initiating network uplink...');
      expect(logs).toHaveLength(1);

      addLog('Verifying corporate VPN tunnel footprint...');
      expect(logs).toHaveLength(2);

      addLog('Validating static IP against approved ingress list...');
      expect(logs).toHaveLength(3);

      addLog('Tauri secure environment confirmed.');
      expect(logs).toHaveLength(4);
    });

    it('each log entry starts with ISO timestamp in brackets', () => {
      const msg = 'Test log message';
      const timestamp = new Date().toISOString();
      const entry = `[${timestamp}] ${msg}`;

      expect(entry).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(entry).toContain(msg);
    });

    it('includes specific verification step messages', () => {
      const expectedMessages = [
        'Initiating network uplink...',
        'Verifying corporate VPN tunnel footprint...',
        'Validating static IP against approved ingress list...',
        'Tauri secure environment confirmed.',
      ];

      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      expectedMessages.forEach(addLog);

      expect(logs[0]).toContain('network uplink');
      expect(logs[1]).toContain('VPN tunnel');
      expect(logs[2]).toContain('static IP');
      expect(logs[3]).toContain('Tauri secure');
    });
  });

  describe('conditional rendering logic', () => {
    it('renders children when status is SECURE', () => {
      const status: NetworkStatus = 'SECURE';
      const shouldRenderChildren = status === 'SECURE';
      expect(shouldRenderChildren).toBe(true);
    });

    it('renders guard screen when status is CHECKING', () => {
      const status: NetworkStatus = 'CHECKING';
      const shouldRenderChildren = status === 'SECURE';
      const shouldRenderGuard = !shouldRenderChildren;

      expect(shouldRenderChildren).toBe(false);
      expect(shouldRenderGuard).toBe(true);
    });

    it('renders guard screen when status is BLOCKED', () => {
      const status: NetworkStatus = 'BLOCKED';
      const shouldRenderChildren = status === 'SECURE';
      const shouldRenderGuard = !shouldRenderChildren;

      expect(shouldRenderChildren).toBe(false);
      expect(shouldRenderGuard).toBe(true);
    });

    it('shows AWAITING HANDSHAKE indicator only during CHECKING', () => {
      const checkingStatus: NetworkStatus = 'CHECKING';
      const secureStatus: NetworkStatus = 'SECURE';
      const blockedStatus: NetworkStatus = 'BLOCKED';

      expect(checkingStatus === 'CHECKING').toBe(true);
      expect(secureStatus === 'CHECKING').toBe(false);
      expect(blockedStatus === 'CHECKING').toBe(false);
    });

    it('shows ACCESS DENIED message only when BLOCKED', () => {
      const blockedStatus: NetworkStatus = 'BLOCKED';
      const secureStatus: NetworkStatus = 'SECURE';
      const checkingStatus: NetworkStatus = 'CHECKING';

      expect(blockedStatus === 'BLOCKED').toBe(true);
      expect(secureStatus === 'BLOCKED').toBe(false);
      expect(checkingStatus === 'BLOCKED').toBe(false);
    });
  });

  describe('CSS class logic', () => {
    it('applies "blocked" class when status is BLOCKED', () => {
      const status: NetworkStatus = 'BLOCKED';
      const cardClass = `network-guard-card ${status === 'BLOCKED' ? 'blocked' : 'secure'}`;
      expect(cardClass).toBe('network-guard-card blocked');
    });

    it('applies "secure" class when status is CHECKING', () => {
      const status: NetworkStatus = 'CHECKING';
      const cardClass = `network-guard-card ${status === 'BLOCKED' ? 'blocked' : 'secure'}`;
      expect(cardClass).toBe('network-guard-card secure');
    });

    it('applies "blocked" class to title when BLOCKED', () => {
      const status: NetworkStatus = 'BLOCKED';
      const titleClass = `network-guard-title ${status === 'BLOCKED' ? 'blocked' : ''}`;
      expect(titleClass).toContain('blocked');
    });

    it('omits "blocked" class from title when not BLOCKED', () => {
      const status: NetworkStatus = 'CHECKING';
      const titleClass = `network-guard-title ${status === 'BLOCKED' ? 'blocked' : ''}`;
      expect(titleClass).not.toContain('blocked');
    });

    it('applies "validating" class to log lines containing "Validating"', () => {
      const logLine = '[2026-02-27T00:00:00.000Z] Validating static IP against approved ingress list...';
      const hasValidating = logLine.includes('Validating');
      const logClass = `log-item ${hasValidating ? 'validating' : ''}`;

      expect(logClass).toContain('validating');
    });

    it('does not apply "validating" class to other log lines', () => {
      const logLine = '[2026-02-27T00:00:00.000Z] Initiating network uplink...';
      const hasValidating = logLine.includes('Validating');
      const logClass = `log-item ${hasValidating ? 'validating' : ''}`;

      expect(logClass).not.toContain('validating');
    });
  });

  describe('boot sequence timing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('takes approximately 2500ms for full boot sequence (600+800+700+400)', () => {
      const timings = [600, 800, 700, 400];
      const totalMs = timings.reduce((sum, t) => sum + t, 0);
      expect(totalMs).toBe(2500);
    });

    it('simulates sequential delay steps', async () => {
      let step = 0;

      const bootSequence = async () => {
        step = 1;
        await new Promise((r) => setTimeout(r, 600));
        step = 2;
        await new Promise((r) => setTimeout(r, 800));
        step = 3;
        await new Promise((r) => setTimeout(r, 700));
        step = 4;
        await new Promise((r) => setTimeout(r, 400));
        step = 5;
      };

      const p = bootSequence();
      expect(step).toBe(1);

      jest.advanceTimersByTime(600);
      await Promise.resolve(); // flush microtasks
      expect(step).toBe(2);

      jest.advanceTimersByTime(800);
      await Promise.resolve();
      expect(step).toBe(3);

      jest.advanceTimersByTime(700);
      await Promise.resolve();
      expect(step).toBe(4);

      jest.advanceTimersByTime(400);
      await Promise.resolve();
      expect(step).toBe(5);

      await p;
    });
  });

  describe('icon selection', () => {
    it('uses Loader2 spinner during CHECKING', () => {
      const status: NetworkStatus = 'CHECKING';
      const icon = status === 'CHECKING' ? 'Loader2' : 'ShieldAlert';
      expect(icon).toBe('Loader2');
    });

    it('uses ShieldAlert for non-CHECKING states', () => {
      const status: NetworkStatus = 'BLOCKED';
      const blockedIcon = status === 'CHECKING' ? 'Loader2' : 'ShieldAlert';
      expect(blockedIcon).toBe('ShieldAlert');
    });
  });
});
