import { SettlementWorker } from "./settlement.worker";
import { Pool } from "pg";
import { LedgerService } from "../../../services/ledger/ledger.service";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { EscrowProvider } from "../../common/interfaces/payout-provider.interface";
import { Job } from "bullmq";

jest.mock("bullmq");

describe("SettlementWorker", () => {
  let worker: SettlementWorker;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };
  let mockEscrow: jest.Mocked<
    Pick<
      EscrowProvider,
      "rail" | "movesRealMoney" | "cancelHold" | "captureStake"
    >
  >;
  let mockLedger: jest.Mocked<Pick<LedgerService, "recordTransaction">>;
  let mockTruthLog: jest.Mocked<Pick<TruthLogService, "appendEvent">>;

  const makeJob = (data: Record<string, any>): Job => ({ data }) as Job;

  const successHold = {
    id: "tx_provider_001",
    status: "CAPTURED",
    amountCents: 0,
    currency: "usd",
    rail: "LEDGER",
  };

  const makeContractRow = () => ({
    rows: [
      {
        user_id: "user-1",
        account_id: "acct-user-1",
        escrow_account_id: "acct-escrow",
        revenue_account_id: "acct-revenue",
        bounty_pool_account_id: "acct-bounty",
      },
    ],
  });

  // Helper to drive the client.query mock by SQL keyword, since the worker now runs two
  // separate short transactions (claim + finalize) on a pooled client.
  //
  // entryExists() now keys on the deterministic idempotency_key (styx_settle_<runId>_<type>),
  // matching the DB UNIQUE index. `existingKeys` lets a test declare which idempotency keys
  // already exist so we can assert per-(run, type) idempotency.
  const setupClientQueries = (opts: {
    existingRun?: { id: string; status: string } | null;
    existingKeys?: string[];
  }) => {
    const insertedRunId = "run-claimed";
    mockClient.query.mockImplementation(async (sql: string, params?: any[]) => {
      const text = String(sql);
      if (
        text.startsWith("BEGIN") ||
        text.startsWith("COMMIT") ||
        text.startsWith("ROLLBACK")
      ) {
        return { rows: [] };
      }
      if (
        text.includes("FROM contracts WHERE id") &&
        text.includes("FOR UPDATE")
      ) {
        return { rows: [{ id: "c-x" }] };
      }
      if (
        text.includes("FROM settlement_runs") &&
        text.includes("ORDER BY started_at DESC")
      ) {
        return { rows: opts.existingRun ? [opts.existingRun] : [] };
      }
      if (text.includes("INSERT INTO settlement_runs")) {
        return { rows: [{ id: insertedRunId }] };
      }
      if (
        text.includes("UPDATE settlement_runs") &&
        text.includes("'PROCESSING'")
      ) {
        return { rows: [] };
      }
      // finalizeLedger: contract + system accounts lookup
      if (text.includes("a_escrow") && text.includes("FROM contracts c")) {
        return makeContractRow();
      }
      // entryExists: dedupe by the deterministic idempotency key.
      if (text.includes("FROM entries WHERE idempotency_key")) {
        const [key] = params || [];
        const match = (opts.existingKeys || []).includes(key);
        return { rows: match ? [{ id: "existing-entry" }] : [] };
      }
      if (
        text.includes("UPDATE settlement_runs") &&
        text.includes("'SUCCESS'")
      ) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    return insertedRunId;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      connect: jest.fn().mockResolvedValue(mockClient),
    };
    mockEscrow = {
      rail: "LEDGER",
      movesRealMoney: false,
      cancelHold: jest.fn(),
      captureStake: jest.fn(),
    };
    mockLedger = {
      recordTransaction: jest.fn().mockResolvedValue("entry-id-1"),
    };
    mockTruthLog = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    };

    worker = new SettlementWorker(
      mockPool as unknown as Pool,
      mockEscrow as unknown as EscrowProvider,
      mockLedger as unknown as LedgerService,
      mockTruthLog as unknown as TruthLogService,
    );

    jest.clearAllMocks();
  });

  const callProcess = (w: SettlementWorker, job: Job) =>
    (w as any).process(job);

  it("should calculate a deterministic quote and post the whole stake to revenue on capture", async () => {
    setupClientQueries({ existingRun: null });
    mockEscrow.captureStake.mockResolvedValue(successHold as any);

    const job = makeJob({
      contractId: "c-1",
      outcome: "FAIL",
      escrowHoldId: "hold_1",
      amountCents: 10000,
    });

    await callProcess(worker, job);

    // captureStake receives the settlement amount (partial-capture support).
    expect(mockEscrow.captureStake).toHaveBeenCalledWith("hold_1", 10000);

    // Ledger capture entry to revenue. A deterministic per-(run, type) idempotency key is
    // passed so the DB UNIQUE index collapses concurrent/retry double-posts (PM4/PM5).
    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      "acct-escrow",
      "acct-revenue",
      10000,
      "c-1",
      expect.objectContaining({ type: "REAL_MONEY_SETTLEMENT_CAPTURE" }),
      mockClient,
      "styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE",
    );

    // DR-002: no bounty pool, so no top-up entry at all. Asserting its absence is the
    // regression guard — a reintroduced pool would silently move money out of revenue
    // on every capture.
    expect(mockLedger.recordTransaction).not.toHaveBeenCalledWith(
      "acct-revenue",
      "acct-bounty",
      expect.anything(),
      "c-1",
      expect.objectContaining({ type: "BOUNTY_POOL_TOPUP" }),
      mockClient,
      "styx_settle_run-claimed_BOUNTY_POOL_TOPUP",
    );
  });

  it("should override actual action to RELEASE if dispositionMode is REFUND", async () => {
    setupClientQueries({ existingRun: null });
    mockEscrow.cancelHold.mockResolvedValue(successHold as any);

    const job = makeJob({
      contractId: "c-2",
      outcome: "FAIL",
      escrowHoldId: "hold_2",
      amountCents: 5000,
      dispositionMode: "REFUND",
    });

    await callProcess(worker, job);

    expect(mockEscrow.cancelHold).toHaveBeenCalledWith("hold_2");
    expect(mockEscrow.captureStake).not.toHaveBeenCalled();

    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      "acct-escrow",
      "acct-user-1",
      5000,
      "c-2",
      expect.objectContaining({
        type: "REAL_MONEY_SETTLEMENT_RELEASE",
        reason: "REFUND_ONLY_JURISDICTION",
      }),
      mockClient,
      "styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_RELEASE",
    );
  });

  it("should skip when a SUCCESS run already exists for the (contract, outcome)", async () => {
    setupClientQueries({ existingRun: { id: "run-done", status: "SUCCESS" } });

    const job = makeJob({
      contractId: "c-3",
      outcome: "FAIL",
      paymentIntentId: "pi_3",
      amountCents: 5000,
    });

    await callProcess(worker, job);

    expect(mockEscrow.captureStake).not.toHaveBeenCalled();
    expect(mockEscrow.cancelHold).not.toHaveBeenCalled();
    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });

  // PM4/PM5: ledger idempotency keys on the per-(run, type) idempotency_key (matching the DB
  // UNIQUE index), NOT (contract, type, amount).

  it("should skip re-posting a capture entry whose idempotency key already exists (true retry dedupe)", async () => {
    // The capture posting for THIS run already exists → must NOT be re-posted.
    // (This test used to also assert that the bounty top-up, being a distinct type and
    // therefore a distinct key, still posted. DR-002 removed the bounty pool, so a capture
    // is now the only posting on this path; the distinct-key-still-posts property is
    // covered by the PM5 test below.)
    setupClientQueries({
      existingRun: null,
      existingKeys: ["styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE"],
    });
    mockEscrow.captureStake.mockResolvedValue(successHold as any);

    const job = makeJob({
      contractId: "c-dup",
      outcome: "FAIL",
      paymentIntentId: "pi_dup",
      amountCents: 10000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).not.toHaveBeenCalledWith(
      "acct-escrow",
      "acct-revenue",
      10000,
      "c-dup",
      expect.objectContaining({ type: "REAL_MONEY_SETTLEMENT_CAPTURE" }),
      mockClient,
      "styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE",
    );
    expect(mockLedger.recordTransaction).not.toHaveBeenCalledWith(
      "acct-revenue",
      "acct-bounty",
      expect.anything(),
      "c-dup",
      expect.objectContaining({ type: "BOUNTY_POOL_TOPUP" }),
      mockClient,
      "styx_settle_run-claimed_BOUNTY_POOL_TOPUP",
    );
  });

  it("should post a capture under a NEW run even if a same-amount entry exists under another run (PM5)", async () => {
    // No entry exists for THIS run's key, so the (legitimately distinct) re-settlement posts.
    setupClientQueries({
      existingRun: null,
      existingKeys: [], // nothing for this run's key
    });
    mockEscrow.captureStake.mockResolvedValue(successHold as any);

    const job = makeJob({
      contractId: "c-dd",
      outcome: "FAIL",
      escrowHoldId: "hold_dd",
      amountCents: 12000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).toHaveBeenCalledWith(
      "acct-escrow",
      "acct-revenue",
      12000,
      "c-dd",
      expect.objectContaining({ type: "REAL_MONEY_SETTLEMENT_CAPTURE" }),
      mockClient,
      "styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_CAPTURE",
    );
  });

  it("should skip a release posting whose idempotency key already exists (true retry)", async () => {
    setupClientQueries({
      existingRun: null,
      existingKeys: ["styx_settle_run-claimed_REAL_MONEY_SETTLEMENT_RELEASE"],
    });
    mockEscrow.cancelHold.mockResolvedValue(successHold as any);

    const job = makeJob({
      contractId: "c-rel",
      outcome: "PASS",
      escrowHoldId: "hold_rel",
      amountCents: 5000,
    });

    await callProcess(worker, job);

    expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
  });

  // PM26: the worker must re-derive the amount from the contract and reject a mismatch.
  it("should reject a settlement whose job amount disagrees with the contract stake (PM26)", async () => {
    setupClientQueries({ existingRun: null });
    // Contract stake resolves to 5000¢ ($50) but the job claims 9999¢.
    mockPool.query.mockImplementation(async (sql: string) => {
      if (String(sql).includes("SELECT stake_amount FROM contracts")) {
        return { rows: [{ stake_amount: 50 }] };
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: "c-mismatch",
      outcome: "FAIL",
      escrowHoldId: "hold_mismatch",
      amountCents: 9999,
    });

    await expect(callProcess(worker, job)).rejects.toThrow(
      "Settlement amount mismatch",
    );
    expect(mockEscrow.captureStake).not.toHaveBeenCalled();
    expect(mockEscrow.cancelHold).not.toHaveBeenCalled();
  });

  it("should accept a settlement whose job amount matches the contract stake (PM26)", async () => {
    setupClientQueries({ existingRun: null });
    mockEscrow.captureStake.mockResolvedValue(successHold as any);
    mockPool.query.mockImplementation(async (sql: string) => {
      if (String(sql).includes("SELECT stake_amount FROM contracts")) {
        return { rows: [{ stake_amount: 100 }] }; // $100 → 10000¢
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: "c-ok",
      outcome: "FAIL",
      escrowHoldId: "hold_ok",
      amountCents: 10000,
    });

    await callProcess(worker, job);
    expect(mockEscrow.captureStake).toHaveBeenCalledWith("hold_ok", 10000);
  });

  // PM31: a failure must only flip the run to FAILED while it is still PROCESSING (guarded UPDATE).
  it("should guard the FAILED status update with status = PROCESSING (PM31)", async () => {
    setupClientQueries({ existingRun: null });
    mockEscrow.captureStake.mockRejectedValue(new Error("provider boom"));

    const failedUpdates: string[] = [];
    mockPool.query.mockImplementation(async (sql: string) => {
      const text = String(sql);
      if (
        text.includes("UPDATE settlement_runs") &&
        text.includes("'FAILED'")
      ) {
        failedUpdates.push(text);
      }
      return { rows: [] };
    });

    const job = makeJob({
      contractId: "c-fail",
      outcome: "FAIL",
      escrowHoldId: "hold_fail",
      amountCents: 5000,
    });

    await expect(callProcess(worker, job)).rejects.toThrow("provider boom");
    expect(failedUpdates.length).toBeGreaterThan(0);
    expect(
      failedUpdates.every((sql) => sql.includes("status = 'PROCESSING'")),
    ).toBe(true);
  });
});
