import { randomUUID } from "crypto";
import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { describeWithContainerRuntime } from "../../../test/container-runtime";
import { FuryRouterWorker } from "../../../services/fury-router/fury-router.worker";

describeWithContainerRuntime("FuryRouting (Integration)", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let worker: FuryRouterWorker;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:15-alpine").start();
    const dbUri = container.getConnectionUri();
    pool = new Pool({ connectionString: dbUri });

    execSync("npm run migrate", {
      env: { ...process.env, DATABASE_URL: dbUri },
      stdio: "inherit",
      cwd: process.cwd(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuryRouterWorker,
        { provide: Pool, useValue: pool },
      ],
    }).compile();

    worker = module.get<FuryRouterWorker>(FuryRouterWorker);
  }, 60000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (container) await container.stop();
  });

  async function seedFury(id: string, overrides: Record<string, any> = {}) {
    const state_code = overrides.last_known_state;
    const social_guild_id = overrides.social_guild_id;
    const enterprise_id = overrides.enterprise_id;
    await pool.query(
      `INSERT INTO users (id, email, password_hash, status, role, integrity_score,
        last_known_state, social_guild_id, enterprise_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        overrides.email || `fury-${id}@test.com`,
        "hash",
        overrides.status || "ACTIVE",
        overrides.role || "FURY",
        overrides.integrity_score ?? 80,
        state_code || null,
        social_guild_id || null,
        enterprise_id || null,
      ],
    );
  }

  async function seedProof(id: string, userId: string) {
    await pool.query(
      `INSERT INTO proofs (id, user_id, contract_id, status, file_hash, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, randomUUID(), "PENDING_REVIEW", "hash", "video/mp4", 1024],
    );
  }

  async function executeProcessJob(proofId: string, submitterId: string, requiredReviewers = 3) {
    const mockJob: any = {
      data: { proofId, submitterUserId: submitterId, requiredReviewers, dispatchedAt: new Date().toISOString() },
      attemptsMade: 0,
      opts: { attempts: 3 },
    };
    await (worker as any).processJob(mockJob);
  }

  it("assigns proof to 3 eligible Furies", async () => {
    const submitterId = randomUUID();
    const furyIds = Array.from({ length: 5 }, () => randomUUID());
    const proofId = randomUUID();

    await seedFury(submitterId, { role: "USER", integrity_score: 0 });
    for (const fid of furyIds) {
      await seedFury(fid);
    }
    await seedProof(proofId, submitterId);

    await executeProcessJob(proofId, submitterId, 3);

    const assignments = await pool.query(
      "SELECT * FROM fury_assignments WHERE proof_id = $1",
      [proofId],
    );
    expect(assignments.rows).toHaveLength(3);

    const assignedFuryIds = assignments.rows.map((r: any) => r.fury_user_id);
    for (const fid of assignedFuryIds) {
      expect(fid).not.toBe(submitterId);
    }

    const proof = await pool.query("SELECT status FROM proofs WHERE id = $1", [proofId]);
    expect(proof.rows[0].status).toBe("UNDER_REVIEW");
  });

  it("excludes submitter from Fury assignment", async () => {
    const submitterId = randomUUID();
    const furyId = randomUUID();
    const proofId = randomUUID();

    await seedFury(submitterId, { role: "USER", integrity_score: 0 });
    await seedFury(furyId);
    await seedProof(proofId, submitterId);

    await executeProcessJob(proofId, submitterId, 1);

    const assignments = await pool.query(
      "SELECT * FROM fury_assignments WHERE proof_id = $1",
      [proofId],
    );
    expect(assignments.rows).toHaveLength(1);
    expect(assignments.rows[0].fury_user_id).not.toBe(submitterId);
  });

  it("excludes Furies with integrity < 20", async () => {
    const submitterId = randomUUID();
    const lowIntegrityFury = randomUUID();
    const eligibleFury = randomUUID();
    const proofId = randomUUID();

    await seedFury(submitterId, { role: "USER", integrity_score: 0 });
    await seedFury(lowIntegrityFury, { integrity_score: 15 });
    await seedFury(eligibleFury, { integrity_score: 80 });
    await seedProof(proofId, submitterId);

    await executeProcessJob(proofId, submitterId, 1);

    const assignments = await pool.query(
      "SELECT * FROM fury_assignments WHERE proof_id = $1",
      [proofId],
    );
    expect(assignments.rows).toHaveLength(1);
    expect(assignments.rows[0].fury_user_id).toBe(eligibleFury);
  });

  it("dead-letters to MANUAL_REVIEW when insufficient Furies available", async () => {
    const submitterId = randomUUID();
    const proofId = randomUUID();

    await seedFury(submitterId, { role: "USER", integrity_score: 0 });
    await seedProof(proofId, submitterId);

    await expect(
      executeProcessJob(proofId, submitterId, 2),
    ).not.toReject();

    const proof = await pool.query("SELECT status FROM proofs WHERE id = $1", [proofId]);
    expect(proof.rows[0].status).toBe("MANUAL_REVIEW");
  });

  it("applies geographic isolation", async () => {
    const submitterId = randomUUID();
    const sameStateFury = randomUUID();
    const differentStateFury = randomUUID();
    const proofId = randomUUID();

    await seedFury(submitterId, { role: "USER", integrity_score: 0, last_known_state: "CA" });
    await seedFury(sameStateFury, { last_known_state: "CA" });
    await seedFury(differentStateFury, { last_known_state: "NY" });
    await seedProof(proofId, submitterId);

    await executeProcessJob(proofId, submitterId, 1);

    const assignments = await pool.query(
      "SELECT * FROM fury_assignments WHERE proof_id = $1",
      [proofId],
    );
    expect(assignments.rows).toHaveLength(1);
    expect(assignments.rows[0].fury_user_id).toBe(differentStateFury);
  });
});
