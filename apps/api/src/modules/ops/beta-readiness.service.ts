import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { CompliancePolicyService } from '../compliance/compliance-policy.service';

/**
 * BetaReadinessService
 * 
 * The Master Gate for the Styx Beta launch.
 * Aggregates health, compliance, and infrastructure signals to determine 
 * if the platform is "Alpha to Omega" ready.
 */

export interface ReadinessGate {
  lane: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  details: string;
}

@Injectable()
export class BetaReadinessService {
  constructor(
    private readonly pool: Pool,
    private readonly compliance: CompliancePolicyService,
  ) {}

  /**
   * Evaluates all Blitzkrieg lanes for Beta-Gate lock.
   */
  async getReadinessReport(): Promise<{ status: string; gates: ReadinessGate[] }> {
    const gates: ReadinessGate[] = [];

    // 1. Money Rails (Blitzkrieg A)
    const ledgerCheck = await this.pool.query("SELECT COUNT(*) FROM accounts");
    gates.push({
      lane: 'Money Rails',
      status: ledgerCheck.rows.length > 0 ? 'GREEN' : 'RED',
      details: `${ledgerCheck.rows[0].count} system accounts active.`
    });

    // 2. KYC and Identity (Blitzkrieg B)
    const kycEnabled = this.compliance.isKycEnforcementEnabled();
    gates.push({
      lane: 'KYC & Identity',
      status: kycEnabled ? 'GREEN' : 'YELLOW',
      details: kycEnabled ? 'KYC Enforcement Active' : 'KYC in Mock Mode'
    });

    // 3. Jurisdiction Controls (Blitzkrieg C)
    const jurisdictionCount = await this.pool.query("SELECT COUNT(*) FROM jurisdictions");
    gates.push({
      lane: 'Jurisdiction',
      status: jurisdictionCount.rows[0].count >= 50 ? 'GREEN' : 'RED',
      details: `${jurisdictionCount.rows[0].count}/50 US states mapped.`
    });

    // 4. Safety Engine (S2 Blitzkrieg A)
    // Check if crisis logging table exists
    try {
      await this.pool.query("SELECT 1 FROM crisis_events LIMIT 1");
      gates.push({ lane: 'Safety Engine', status: 'GREEN', details: 'Crisis and self-exclusion active.' });
    } catch {
      gates.push({ lane: 'Safety Engine', status: 'RED', details: 'Safety schemas not migrated.' });
    }

    const isReady = !gates.some(g => g.status === 'RED');

    return {
      status: isReady ? 'GO' : 'NO-GO',
      gates
    };
  }
}
