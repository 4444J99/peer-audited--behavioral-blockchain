import { TruthLogService } from './truth-log.service';
import { Pool } from 'pg';
import { createHash } from 'crypto';
import { GENESIS_HASH } from '../../../shared/libs/behavioral-logic';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
} as unknown as Pool;

describe('TruthLogService', () => {
  let service: TruthLogService;

  beforeEach(() => {
    service = new TruthLogService(mockPool);
    jest.clearAllMocks();
  });

  it('should append event using GENESIS_HASH if table is empty', async () => {
    const fixedDate = new Date('2026-03-09T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedDate);

    // Mock the query sequence. The append now serializes with a
    // transaction-scoped advisory lock, so an extra query runs between BEGIN
    // and the latest-hash SELECT.
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT pg_advisory_xact_lock
      .mockResolvedValueOnce({ rows: [] }) // SELECT latest hash (empty log)
      .mockResolvedValueOnce({ rows: [{ id: 'new-log-1' }] }) // INSERT
      .mockResolvedValueOnce({ rows: [{ setval: '1' }] }) // SELECT setval (LC4 sequence advance)
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const payload = { action: 'start_habit' };
    const resultId = await service.appendEvent('TEST_EVENT', payload);

    expect(resultId).toBe('new-log-1');

    // Calculate expected hash (Theorem 2 Preimage):
    // index | event_type | timestamp | previous_hash | payload
    const expectedHash = createHash('sha256')
      .update(`1|TEST_EVENT|${fixedDate.toISOString()}|${GENESIS_HASH}|${JSON.stringify(payload)}`)
      .digest('hex');

    // Verify INSERT statement arguments. The INSERT is now the 4th query
    // (BEGIN, advisory lock, SELECT, INSERT) and stores an explicit
    // sequence_index, so params are
    // [sequence_index, event_type, payload, previous_hash, current_hash, timestamp].
    const insertCallArgs = (mockClient.query as jest.Mock).mock.calls[3];
    expect(insertCallArgs[0]).toContain('INSERT INTO event_log');
    expect(insertCallArgs[1][0]).toBe(1); // sequence_index
    expect(insertCallArgs[1][1]).toBe('TEST_EVENT'); // event_type
    expect(insertCallArgs[1][3]).toBe(GENESIS_HASH); // previous hash
    expect(insertCallArgs[1][4]).toBe(expectedHash); // current hash

    // LC4: the explicit sequence_index insert must advance the BIGSERIAL sequence
    // (setval) so any DEFAULT-relying writer can't collide on the unique index.
    const setvalCallArgs = (mockClient.query as jest.Mock).mock.calls[4];
    expect(setvalCallArgs[0]).toContain('setval');
    expect(setvalCallArgs[1]).toEqual([1]);

    jest.useRealTimers();
  });

  it('should append event chaining the previous hash correctly', async () => {
    const fixedDate = new Date('2026-03-09T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedDate);

    // Mock the query sequence with an existing head hash. The advisory lock
    // query runs between BEGIN and the latest-hash SELECT.
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT pg_advisory_xact_lock
      .mockResolvedValueOnce({ rows: [{ sequence_index: '10', current_hash: 'abc123oldhash' }] }) // SELECT latest
      .mockResolvedValueOnce({ rows: [{ id: 'new-log-2' }] }) // INSERT
      .mockResolvedValueOnce({ rows: [{ setval: '11' }] }) // SELECT setval (LC4 sequence advance)
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const payload = { action: 'complete_habit' };
    await service.appendEvent('TEST_EVENT', payload);

    // Preimage: index | event_type | timestamp | previous_hash | payload
    const expectedHash = createHash('sha256')
      .update(`11|TEST_EVENT|${fixedDate.toISOString()}|abc123oldhash|${JSON.stringify(payload)}`)
      .digest('hex');

    const insertCallArgs = (mockClient.query as jest.Mock).mock.calls[3];
    expect(insertCallArgs[1][0]).toBe(11); // sequence_index
    expect(insertCallArgs[1][3]).toBe('abc123oldhash'); // previous hash
    expect(insertCallArgs[1][4]).toBe(expectedHash); // current hash

    jest.useRealTimers();
  });

  describe('verifyChain', () => {
    it('should return valid if chain is consistent', async () => {
      const fixedDate = new Date('2026-03-09T00:00:00.000Z');
      // Preimage now includes event_type:
      // index | event_type | timestamp | previous_hash | payload
      const payload1 = { a: 1 };
      const hash1 = createHash('sha256')
        .update(`1|E1|${fixedDate.toISOString()}|${GENESIS_HASH}|${JSON.stringify(payload1)}`)
        .digest('hex');

      const payload2 = { b: 2 };
      const hash2 = createHash('sha256')
        .update(`2|E2|${fixedDate.toISOString()}|${hash1}|${JSON.stringify(payload2)}`)
        .digest('hex');

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: '1', sequence_index: 1, event_type: 'E1', payload: payload1, previous_hash: GENESIS_HASH, current_hash: hash1, created_at: fixedDate },
          { id: '2', sequence_index: 2, event_type: 'E2', payload: payload2, previous_hash: hash1, current_hash: hash2, created_at: fixedDate },
        ]
      });

      const result = await service.verifyChain();
      expect(result.valid).toBe(true);
      expect(result.checked).toBe(2);
      expect(result.corrupted).toHaveLength(0);
    });

    it('should report corruption if a hash is tampered', async () => {
      const fixedDate = new Date('2026-03-09T00:00:00.000Z');
      const payload1 = { a: 1 };
      const hash1 = 'TAMPERED_HASH';

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: '1', sequence_index: 1, event_type: 'E1', payload: payload1, previous_hash: GENESIS_HASH, current_hash: hash1, created_at: fixedDate },
        ]
      });

      const result = await service.verifyChain();
      expect(result.valid).toBe(false);
      expect(result.corrupted).toContain('1');
    });

    it('should report corruption if sequence is broken', async () => {
      const fixedDate = new Date('2026-03-09T00:00:00.000Z');
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: '1', sequence_index: 1, event_type: 'E1', payload: {}, previous_hash: 'wrong', current_hash: 'any', created_at: fixedDate },
        ]
      });

      const result = await service.verifyChain();
      expect(result.valid).toBe(false);
      expect(result.corrupted).toContain('1');
    });

    it('LC3: should detect a consistently re-forged chain (links agree internally but diverge from genesis)', async () => {
      const fixedDate = new Date('2026-03-09T00:00:00.000Z');
      // An attacker rewrites event #1's payload and recomputes BOTH its current_hash
      // and the forged previous_hash so the row is internally self-consistent against
      // the STORED previous_hash. Event #2 is then re-linked to the forged hash. Each
      // link matches its neighbour, so a check that trusts row.previous_hash would pass.
      const forgedPayload1 = { a: 'TAMPERED' };
      // Forged event #1 deliberately uses a fake previous_hash that is NOT genesis but
      // is consistent with its own current_hash.
      const forgedPrev1 = 'f0f0f0forgedprevhash';
      const forgedHash1 = createHash('sha256')
        .update(`1|E1|${fixedDate.toISOString()}|${forgedPrev1}|${JSON.stringify(forgedPayload1)}`)
        .digest('hex');
      const payload2 = { b: 2 };
      const forgedHash2 = createHash('sha256')
        .update(`2|E2|${fixedDate.toISOString()}|${forgedHash1}|${JSON.stringify(payload2)}`)
        .digest('hex');

      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: '1', sequence_index: 1, event_type: 'E1', payload: forgedPayload1, previous_hash: forgedPrev1, current_hash: forgedHash1, created_at: fixedDate },
          { id: '2', sequence_index: 2, event_type: 'E2', payload: payload2, previous_hash: forgedHash1, current_hash: forgedHash2, created_at: fixedDate },
        ]
      });

      const result = await service.verifyChain();
      // Recomputing from the running head (genesis) instead of the stored
      // previous_hash exposes the fork: event #1's previous_hash != genesis.
      expect(result.valid).toBe(false);
      expect(result.corrupted).toContain('1');
    });
  });
});
