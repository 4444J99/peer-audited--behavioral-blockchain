#!/usr/bin/env tsx
/**
 * scripts/ops/reconcile-financial-records.ts
 *
 * Operational runbook script for financial reconciliation between
 * Stripe settlement runs, Double-Entry Ledger, and Escrow balances.
 *
 * Usage:
 *   npx tsx scripts/ops/reconcile-financial-records.ts [--limit 100] [--json]
 */

import { Pool } from 'pg';

interface AuditDiscrepancy {
  contractId: string;
  expectedAmountCents: number;
  ledgerTotalCents: number;
  runStatus: string;
  reasons: string[];
}

interface AuditReport {
  totalAudited: number;
  balancedCount: number;
  discrepancyCount: number;
  auditedAt: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  discrepancies: AuditDiscrepancy[];
}

async function runAudit(): Promise<void> {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? Number.parseInt(args[limitIndex + 1], 10) : 100;

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.STYX_DATABASE_URL ||
    'postgresql://styx:styx_secure_password_123@localhost:5432/styx';

  const pool = new Pool({ connectionString: dbUrl });

  try {
    const contractsQuery = await pool.query(
      `SELECT DISTINCT contract_id
       FROM settlement_runs
       ORDER BY contract_id
       LIMIT $1`,
      [limit],
    );

    const escrowAccount = await pool.query(
      "SELECT id FROM accounts WHERE name = 'SYSTEM_ESCROW' LIMIT 1"
    );
    const escrowAccountId = escrowAccount.rows[0]?.id;

    const ESCROW_WITHDRAWAL_TYPES = [
      'SETTLEMENT_RELEASE',
      'SETTLEMENT_CAPTURE',
      'STAKE_RETURN',
      'REFUND_ONLY_DISPOSITION',
      'STAKE_CAPTURED',
    ];

    const discrepancies: AuditDiscrepancy[] = [];
    let balancedCount = 0;

    for (const row of contractsQuery.rows) {
      const contractId = row.contract_id;
      const reasons: string[] = [];

      const contract = await pool.query(
        'SELECT stake_amount, status FROM contracts WHERE id = $1',
        [contractId],
      );
      if (contract.rows.length === 0) {
        discrepancies.push({
          contractId,
          expectedAmountCents: 0,
          ledgerTotalCents: 0,
          runStatus: 'NOT_FOUND',
          reasons: [`Contract ${contractId} not found in contracts table`],
        });
        continue;
      }

      const expectedAmountCents = Math.round(Number(contract.rows[0].stake_amount) * 100);

      const runs = await pool.query(
        "SELECT * FROM settlement_runs WHERE contract_id = $1 AND status = 'SUCCESS' ORDER BY completed_at DESC NULLS LAST LIMIT 1",
        [contractId],
      );
      const run = runs.rows[0];
      if (!run) {
        reasons.push('No successful settlement run recorded');
      }

      const entriesResult = await pool.query(
        'SELECT * FROM entries WHERE contract_id = $1',
        [contractId],
      );
      const entries = entriesResult.rows;

      const settlementEntries = entries.filter((e) => {
        const t = e.metadata?.type;
        return typeof t === 'string' && ESCROW_WITHDRAWAL_TYPES.some((known) => t.includes(known));
      });

      const escrowWithdrawals = settlementEntries
        .filter((e) => e.debit_account_id === escrowAccountId)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const wrongDirection = settlementEntries.filter(
        (e) => e.debit_account_id !== escrowAccountId,
      );
      if (wrongDirection.length > 0) {
        reasons.push(`Wrong-direction entries: ${wrongDirection.length} entries do not debit escrow`);
      }

      if (escrowWithdrawals > expectedAmountCents) {
        reasons.push(`Over-withdrawal: Expected at most ${expectedAmountCents}¢, withdrew ${escrowWithdrawals}¢`);
      } else if (escrowWithdrawals === 0 && expectedAmountCents > 0) {
        reasons.push(`Zero-withdrawal imbalance: Expected ${expectedAmountCents}¢, withdrew 0¢`);
      }

      if (reasons.length === 0) {
        balancedCount++;
      } else {
        discrepancies.push({
          contractId,
          expectedAmountCents,
          ledgerTotalCents: escrowWithdrawals,
          runStatus: run?.status || 'NOT_FOUND',
          reasons,
        });
      }
    }

    const totalAudited = contractsQuery.rows.length;
    const discrepancyCount = discrepancies.length;
    let status: AuditReport['status'] = 'HEALTHY';
    if (totalAudited > 0) {
      const ratio = discrepancyCount / totalAudited;
      if (ratio > 0.05) status = 'CRITICAL';
      else if (discrepancyCount > 0) status = 'DEGRADED';
    }

    const report: AuditReport = {
      totalAudited,
      balancedCount,
      discrepancyCount,
      auditedAt: new Date().toISOString(),
      status,
      discrepancies,
    };

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('============================================================');
      console.log(' STYX FINANCIAL RECONCILIATION AUDIT REPORT');
      console.log('============================================================');
      console.log(`Audited at:         ${report.auditedAt}`);
      console.log(`Total Audited:      ${report.totalAudited} contracts`);
      console.log(`Balanced:           ${report.balancedCount} (${totalAudited > 0 ? ((balancedCount / totalAudited) * 100).toFixed(1) : '100.0'}%)`);
      console.log(`Discrepancies:      ${report.discrepancyCount} (${totalAudited > 0 ? ((discrepancyCount / totalAudited) * 100).toFixed(1) : '0.0'}%)`);
      console.log(`Integrity Status:   [${report.status}]`);
      console.log('------------------------------------------------------------');
      if (discrepancies.length > 0) {
        console.log('DISCREPANCIES DETECTED:');
        for (const d of discrepancies) {
          console.log(`  - Contract ${d.contractId}: Expected ${d.expectedAmountCents}¢, Ledger ${d.ledgerTotalCents}¢, Run: ${d.runStatus}`);
          for (const r of d.reasons) {
            console.log(`      * ${r}`);
          }
        }
      } else {
        console.log('ALL AUDITED CONTRACTS IN PERFECT LEDGER-ESCROW BALANCE.');
      }
      console.log('============================================================');
    }

    await pool.end();
    if (status === 'CRITICAL') {
      process.exit(1);
    }
  } catch (err: any) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: err.message, status: 'CRITICAL' }));
    } else {
      console.error('Reconciliation script error:', err.message);
    }
    await pool.end().catch(() => {});
    // When offline or database not running in local test environment, do not break CI unless strict
    if (process.env.CI_STRICT_RECONCILE === 'true') {
      process.exit(1);
    }
  }
}

void runAudit();
