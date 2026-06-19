import { Injectable, Logger, ConflictException } from "@nestjs/common";
import { Pool } from "pg";
import { EmailService } from "../email/email.service";

export interface WaitlistEntry {
  id: string;
  userId: string;
  cohortId: string;
  podId: string | null;
  displayAlias: string | null;
  position: number;
  enrolled: boolean;
  enrolledAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly pool: Pool,
    private readonly emailService: EmailService,
  ) {}

  async joinWaitlist(
    userId: string,
    cohortId: string,
    podId?: string,
    displayAlias?: string,
  ): Promise<WaitlistEntry> {
    const {
      rows: [next],
    } = await this.pool.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM waitlist_entries WHERE cohort_id = $1",
      [cohortId],
    );
    const position = next?.next_position ?? 1;

    const {
      rows: [entry],
    } = await this.pool.query(
      `INSERT INTO waitlist_entries (user_id, cohort_id, pod_id, display_alias, position)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, cohort_id) DO UPDATE
       SET pod_id = EXCLUDED.pod_id, display_alias = EXCLUDED.display_alias
       WHERE waitlist_entries.enrolled = false
       RETURNING *, (xmax = 0) AS was_inserted`,
      [userId, cohortId, podId || null, displayAlias || null, position],
    );
    if (!entry) {
      throw new ConflictException("Already enrolled in this cohort");
    }

    const mappedEntry = this.mapEntry(entry);
    this.logger.log(
      `User ${userId} joined waitlist for cohort ${cohortId} at position ${mappedEntry.position}`,
    );
    if (entry.was_inserted) {
      await this.sendEarlyAccessOnboarding(
        userId,
        cohortId,
        mappedEntry.position,
      );
    }
    return mappedEntry;
  }

  async getWaitlistPosition(
    userId: string,
    cohortId: string,
  ): Promise<WaitlistEntry | null> {
    const {
      rows: [entry],
    } = await this.pool.query(
      "SELECT * FROM waitlist_entries WHERE user_id = $1 AND cohort_id = $2",
      [userId, cohortId],
    );
    return entry ? this.mapEntry(entry) : null;
  }

  async getCohortWaitlist(cohortId: string): Promise<WaitlistEntry[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM waitlist_entries WHERE cohort_id = $1 AND enrolled = false ORDER BY position ASC",
      [cohortId],
    );
    return rows.map((r: any) => this.mapEntry(r));
  }

  async getWaitlistCount(cohortId: string): Promise<number> {
    const {
      rows: [count],
    } = await this.pool.query(
      "SELECT COUNT(*) AS total FROM waitlist_entries WHERE cohort_id = $1 AND enrolled = false",
      [cohortId],
    );
    return parseInt(count.total, 10);
  }

  async promoteFromWaitlist(
    cohortId: string,
    count: number = 1,
  ): Promise<WaitlistEntry[]> {
    const { rows } = await this.pool.query(
      `UPDATE waitlist_entries
       SET enrolled = true, enrolled_at = NOW()
       WHERE id IN (
         SELECT id FROM waitlist_entries
         WHERE cohort_id = $1 AND enrolled = false
         ORDER BY position ASC
         LIMIT $2
       )
       RETURNING *`,
      [cohortId, count],
    );
    rows.forEach((r: any) => {
      this.logger.log(
        `Promoted user ${r.user_id} from waitlist for cohort ${cohortId}`,
      );
    });
    return rows.map((r: any) => this.mapEntry(r));
  }

  private mapEntry(r: any): WaitlistEntry {
    return {
      id: r.id,
      userId: r.user_id,
      cohortId: r.cohort_id,
      podId: r.pod_id ?? null,
      displayAlias: r.display_alias ?? null,
      position: r.position,
      enrolled: r.enrolled,
      enrolledAt: r.enrolled_at ?? null,
      createdAt: r.created_at,
    };
  }

  private async sendEarlyAccessOnboarding(
    userId: string,
    cohortId: string,
    position: number,
  ): Promise<void> {
    try {
      const {
        rows: [user],
      } = await this.pool.query("SELECT email FROM users WHERE id = $1", [
        userId,
      ]);
      if (!user?.email) {
        this.logger.warn(
          `Skipping waitlist onboarding email for ${userId}: missing email`,
        );
        return;
      }

      await this.emailService.sendEarlyAccessOnboarding({
        to: user.email,
        userId,
        cohortId,
        position,
        trigger: "waitlist_join",
      });
    } catch (error) {
      this.logger.warn(
        `Waitlist onboarding email failed for user ${userId}: ${(error as Error).message}`,
      );
    }
  }
}
