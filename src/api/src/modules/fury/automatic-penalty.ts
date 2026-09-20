import type { Pool } from 'pg';
import type { LedgerService } from '../../../services/ledger/ledger.service';
import type { TruthLogService } from '../../../services/ledger/truth-log.service';
import { inTransaction } from '../../../services/ledger/transaction';

/** Same identity for automatic posting, manual recovery, and legacy reconciliation. */
export const honeypotPenaltyKey = (proofId: string, reviewerId: string): string =>
  `consensus:${proofId}:${reviewerId}:honeypot-penalty`;

/** A charge is not complete until its appealable record and audit are durable. */
export async function applyAutomaticHoneypotPenalty(
  pool: Pool, ledger: LedgerService, truthLog: TruthLogService,
  reviewerId: string, proofId: string, contractId: string | null, amountCents: number,
): Promise<string> {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('Automatic penalty requires a positive integer amount');
  }
  return inTransaction(pool, async (client) => {
    // Manual and automatic paths lock reviewer BEFORE case/entry, avoiding lock inversion.
    const user = await client.query('SELECT account_id FROM users WHERE id = $1 FOR UPDATE', [reviewerId]);
    const accountId = user.rows[0]?.account_id;
    const revenue = await client.query("SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1");
    if (!accountId || !revenue.rows[0]?.id) throw new Error('Automatic penalty ledger accounts are missing');
    const key = honeypotPenaltyKey(proofId, reviewerId);
    const prior = await client.query(
      'SELECT id, amount, debit_account_id, credit_account_id FROM entries WHERE idempotency_key = $1 FOR UPDATE', [key],
    );
    const existing = prior.rows[0];
    if (existing && (existing.debit_account_id !== accountId || existing.credit_account_id !== revenue.rows[0].id)) {
      throw new Error('Existing honeypot penalty has inconsistent ledger accounts');
    }
    const transactionId: string = existing?.id ?? await ledger.recordTransaction(
      accountId, revenue.rows[0].id, amountCents, contractId ?? undefined,
      { type: 'FURY_PENALTY', consensusProofId: proofId, reviewerId }, client, key,
    );
    // Preserve the actual amount of a legacy or manually recovered posting.
    const chargedAmount = existing ? Number(existing.amount) : amountCents;
    const linked = await client.query('SELECT 1 FROM fury_penalties WHERE ledger_transaction_id = $1', [transactionId]);
    if (linked.rows.length) return transactionId; // Includes an already reversed penalty.
    let record = await client.query(
      `UPDATE fury_enforcement_cases
       SET status = CASE WHEN status = 'APPEALED' THEN status ELSE 'PENALTY_APPLIED' END,
           confidence = 1.0, evidence_json = evidence_json || $3::jsonb
       WHERE id = (
         SELECT c.id FROM fury_enforcement_cases c
         WHERE c.reviewer_id = $1 AND c.case_type = 'HONEYPOT_FAILURE'
           AND c.status IN ('PENDING_REVIEW', 'PENALTY_APPLIED', 'APPEALED')
           AND c.evidence_json->>'proofId' = $2
           AND NOT EXISTS (SELECT 1 FROM fury_penalties p WHERE p.case_id = c.id)
         ORDER BY c.created_at ASC LIMIT 1
       ) RETURNING id`,
      [reviewerId, proofId, JSON.stringify({ automatic: true, reason: 'Honeypot ledger reconciliation' })],
    );
    if (!record.rows.length) {
      record = await client.query(
        `INSERT INTO fury_enforcement_cases (reviewer_id, case_type, confidence, status, evidence_json)
         VALUES ($1, 'HONEYPOT_FAILURE', 1.0, 'PENALTY_APPLIED', $2) RETURNING id`,
        [reviewerId, JSON.stringify({ proofId, automatic: true, reason: 'Automatic honeypot slash' })],
      );
    }
    await client.query(
      `INSERT INTO fury_penalties (case_id, penalty_type, amount_cents, ledger_transaction_id, ledger_debit_account_id)
       VALUES ($1, 'STAKE_SLASH', $2, $3, $4)`,
      [record.rows[0].id, chargedAmount, transactionId, accountId],
    );
    await truthLog.appendEvent('FURY_PENALTY_CHARGED', {
      furyUserId: reviewerId, proofId, amount: chargedAmount, reason: 'honeypot_failure',
      caseId: record.rows[0].id, transactionId, reconciled: Boolean(existing),
    }, client);
    return transactionId;
  });
}
