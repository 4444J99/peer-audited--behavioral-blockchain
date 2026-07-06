import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { Pool, PoolClient } from "pg";
import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { getDisplayTier } from "../../../../shared/libs/integrity";

const BCRYPT_ROUNDS = 10;
// SH12 — INVARIANT: these MUST stay byte-for-byte identical to
// TruthLogService.GENESIS_HASH and TruthLogService.APPEND_LOCK_KEY, and the preimage
// built in appendTruthLogEvent() below MUST stay byte-for-byte identical to
// TruthLogService.appendEvent()'s preimage
//   `${sequence_index}|${event_type}|${timestamp}|${previous_hash}|${JSON.stringify(payload)}`.
// Any drift (a changed delimiter, field order, hash algorithm, lock key, or genesis
// value) silently FORKS the tamper-evident hash chain: verifyChain() would then flag
// every event appended by the diverged writer as tampered. This logic is duplicated
// (not delegated to TruthLogService) only because UsersModule does not provide
// TruthLogService for injection and wiring it in requires editing users.module.ts
// (out of scope here). See report note on the SH12 coupling.
const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";
const TRUTH_LOG_APPEND_LOCK_KEY = 0x57_54_4c_47; // 'WTLG'

@Injectable()
export class UsersService {
  constructor(private readonly pool: Pool) {}

  /**
   * Appends an audit event to the tamper-evident event_log, keeping it linked to
   * the hash chain. Replicates TruthLogService.appendEvent here because the
   * UsersModule does not provide TruthLogService for injection. Uses the same
   * advisory lock and SHA256(index|event_type|timestamp|prev|payload) preimage so
   * the chain stays consistent regardless of which writer appends.
   */
  private async appendTruthLogEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [
        TRUTH_LOG_APPEND_LOCK_KEY,
      ]);

      const latestRes = await client.query(
        `SELECT sequence_index, current_hash FROM event_log ORDER BY sequence_index DESC LIMIT 1 FOR UPDATE`,
      );
      const previousHash =
        latestRes.rows.length > 0
          ? latestRes.rows[0].current_hash
          : GENESIS_HASH;
      const nextIndex =
        latestRes.rows.length > 0
          ? parseInt(latestRes.rows[0].sequence_index, 10) + 1
          : 1;
      const timestamp = new Date().toISOString();

      const payloadString = JSON.stringify(payload);
      const hashInput = `${nextIndex}|${eventType}|${timestamp}|${previousHash}|${payloadString}`;
      const currentHash = createHash("sha256").update(hashInput).digest("hex");

      await client.query(
        `INSERT INTO event_log (sequence_index, event_type, payload, previous_hash, current_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nextIndex, eventType, payload, previousHash, currentHash, timestamp],
      );

      // LC4: advance the BIGSERIAL sequence to the explicitly-inserted index, mirroring
      // TruthLogService.appendEvent. Without this, any DEFAULT-relying writer would
      // reuse an index and collide with idx_event_log_sequence. (This duplicate writer
      // MUST stay in lockstep with TruthLogService — see file-top invariant comment.)
      await client.query(
        `SELECT setval(pg_get_serial_sequence('event_log', 'sequence_index'), $1::bigint, true)`,
        [nextIndex],
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async getProfile(userId: string) {
    const result = await this.pool.query(
      `SELECT id, email, integrity_score, role, status, created_at,
              kyc_status, age_verification_status, identity_provider,
              identity_verification_id, identity_verified_at,
              terms_accepted_at, terms_version, is_premium
       FROM users WHERE id = $1`,
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const row = result.rows[0];

    // Fetch active contract stats
    const statsResult = await this.pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(stake_amount), 0) as total 
       FROM contracts 
       WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId],
    );
    const contractCount = parseInt(statsResult.rows[0].count, 10);
    const totalStaked = parseFloat(statsResult.rows[0].total);

    return {
      id: row.id,
      email: row.email,
      integrity_score: row.integrity_score,
      tier: getDisplayTier(row.integrity_score),
      contract_count: contractCount,
      total_staked: totalStaked,
      role: row.role,
      status: row.status,
      created_at: row.created_at,
      compliance: {
        kyc_status: row.kyc_status ?? "NOT_STARTED",
        age_verification_status: row.age_verification_status ?? "NOT_STARTED",
        identity_provider: row.identity_provider ?? null,
        identity_verification_id: row.identity_verification_id ?? null,
        identity_verified_at: row.identity_verified_at ?? null,
        is_kyc_verified:
          String(row.kyc_status || "").toUpperCase() === "VERIFIED",
        is_age_verified: ["VERIFIED", "SELF_DECLARED"].includes(
          String(row.age_verification_status || "").toUpperCase(),
        ),
        terms_accepted_at: row.terms_accepted_at ?? null,
        terms_version: row.terms_version ?? null,
      },
      is_premium: row.is_premium || false,
    };
  }

  async getUserHistory(userId: string, limit = 50) {
    const result = await this.pool.query(
      `SELECT event_type, payload, created_at FROM truth_log
       WHERE payload->>'userId' = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // allow-secret
    if (!currentPassword || !newPassword) {
      throw new BadRequestException("Current and new passwords are required");
    }
    if (newPassword.length < 8) {
      throw new BadRequestException(
        "New password must be at least 8 characters",
      );
    }

    const result = await this.pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      throw new BadRequestException("Account does not have a password set");
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newHash,
      userId,
    ]);

    // AU12: revoke all existing refresh tokens on password change. Otherwise the
    // 7-day refresh tokens issued before the change stay valid and an attacker who
    // captured the old credentials/session can keep minting access tokens, defeating
    // the point of changing the password. This mirrors
    // AuthService.revokeRefreshTokensForUser; it is duplicated here (rather than
    // imported) because UsersModule does not provide AuthService and wiring it in
    // would require editing users.module.ts (out of scope). The SQL MUST stay in
    // sync with AuthService.revokeRefreshTokensForUser.
    await this.revokeRefreshTokensForUser(userId);

    return { status: "password_updated" };
  }

  /**
   * Revoke every outstanding (non-revoked) refresh token for a user. Kept byte-for-byte
   * consistent with AuthService.revokeRefreshTokensForUser — see AU12 note above.
   */
  private async revokeRefreshTokensForUser(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`,
      [userId],
    );
  }

  async updateSettings(
    userId: string,
    settings: { emailNotifications?: boolean; pushNotifications?: boolean },
  ) {
    // Store notification preferences as JSONB metadata on the user
    // For now, we use the existing table — in production this would be a separate user_settings table
    const result = await this.pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Log the settings change in the event log for auditability
    const payload = {
      userId,
      emailNotifications: settings.emailNotifications ?? true,
      pushNotifications: settings.pushNotifications ?? true,
    };

    // Append to the tamper-evident chain so the audit trail stays linked.
    await this.appendTruthLogEvent("SETTINGS_UPDATED", payload);

    return { status: "settings_updated" };
  }

  async requestDeletion(userId: string) {
    const result = await this.pool.query(
      "SELECT id, status FROM users WHERE id = $1",
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Mark user for deletion — actual anonymization handled by scheduled GDPR job
    await this.pool.query(
      "UPDATE users SET status = 'PENDING_DELETION', deletion_requested_at = NOW() WHERE id = $1",
      [userId],
    );

    // Log the deletion request to the tamper-evident chain.
    await this.appendTruthLogEvent("ACCOUNT_DELETION_REQUESTED", { userId });

    return { status: "deletion_requested" };
  }

  async getPublicProfile(userId: string) {
    const result = await this.pool.query(
      "SELECT id, integrity_score, created_at FROM users WHERE id = $1",
      [userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return result.rows[0];
  }

  async getLeaderboard(limit: number = 10, period?: string) {
    const maxLimit = Math.min(limit, 100);

    let intervalFilter = "";
    if (period === "weekly") {
      intervalFilter = `AND id IN (
        SELECT DISTINCT user_id FROM contracts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION
        SELECT DISTINCT c.user_id FROM attestations a
        JOIN contracts c ON c.id = a.contract_id
        WHERE a.attestation_date >= CURRENT_DATE - 7
      )`;
    } else if (period === "monthly") {
      intervalFilter = `AND id IN (
        SELECT DISTINCT user_id FROM contracts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT DISTINCT c.user_id FROM attestations a
        JOIN contracts c ON c.id = a.contract_id
        WHERE a.attestation_date >= CURRENT_DATE - 30
      )`;
    }

    const result = await this.pool.query(
      `SELECT id, email, integrity_score, created_at
       FROM users WHERE status = 'ACTIVE' ${intervalFilter}
       ORDER BY integrity_score DESC
       LIMIT $1`,
      [maxLimit],
    );
    return result.rows;
  }

  async setSelfExclusion(userId: string, durationDays: number) {
    if (durationDays < 1 || durationDays > 365) {
      throw new BadRequestException("Duration must be between 1 and 365 days");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await this.pool.query(
      "UPDATE users SET self_exclusion_expires_at = $1 WHERE id = $2",
      [expiresAt.toISOString(), userId],
    );

    // Log to the tamper-evident audit chain.
    await this.appendTruthLogEvent("SELF_EXCLUSION_ACTIVATED", {
      userId,
      durationDays,
      expiresAt: expiresAt.toISOString(),
    });

    return { status: "self_exclusion_activated", expiresAt };
  }

  /**
   * H3 (Triadic Review): pregnancy_exclusion column existed in the users
   * table (migration 039) and the createContract gate honored it, but
   * nothing ever set it. This is the self-report endpoint that wires the
   * user-facing toggle to the column. Activation / deactivation is
   * recorded in pregnancy_exclusion_events (migration 040) for compliance
   * auditability and to support a future reversion / "I clicked wrong"
   * workflow.
   */
  async setPregnancyExclusion(
    userId: string,
    active: boolean,
  ): Promise<{
    pregnancy_exclusion: boolean;
    pregnancy_exclusion_at: string | null;
  }> {
    const { rows } = await this.pool.query(
      `UPDATE users
         SET pregnancy_exclusion = $2,
             pregnancy_exclusion_at = CASE WHEN $2 THEN NOW() ELSE NULL END
       WHERE id = $1
       RETURNING pregnancy_exclusion, pregnancy_exclusion_at`,
      [userId, active],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.pool.query(
      `INSERT INTO pregnancy_exclusion_events (user_id, event_type, source)
       VALUES ($1, $2, 'SELF_REPORT')`,
      [userId, active ? "ACTIVATED" : "DEACTIVATED"],
    );

    await this.appendTruthLogEvent(
      active
        ? "PREGNANCY_EXCLUSION_ACTIVATED"
        : "PREGNANCY_EXCLUSION_DEACTIVATED",
      { userId },
    );

    return {
      pregnancy_exclusion: rows[0].pregnancy_exclusion,
      pregnancy_exclusion_at: rows[0].pregnancy_exclusion_at,
    };
  }
}
