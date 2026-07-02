import { randomUUID as uuidv4 } from "crypto";
import { Test, TestingModule } from "@nestjs/testing";
import { ContractsService } from "./contracts.service";
import { LedgerService } from "../../../services/ledger/ledger.service";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { StripeFboService } from "../../../services/escrow/stripe.service";
import { StripeFBOService as RealStripeFBOService } from "../payments/stripe-fbo.service";
import { DisputeService } from "../../../services/escrow/dispute.service";
import { FuryRouterService } from "../../../services/fury-router/fury-router.service";
import { AegisProtocolService } from "../../../services/health/aegis.service";
import { RecoveryProtocolService } from "../../../services/health/recovery-protocol.service";
import { DynamicPenaltyService } from "../../../services/health/dynamic-penalty.service";
import { AnomalyService } from "../../../services/anomaly/anomaly.service";
import { SettlementService } from "../payments/settlement.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CompliancePolicyService } from "../compliance/compliance-policy.service";
import { WaitlistService } from "./waitlist.service";
import { SurveyService } from "./survey.service";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Pool } from "pg";
import { execSync } from "child_process";
import path from "path";
import { describeWithContainerRuntime } from "../../../test/container-runtime";

describeWithContainerRuntime("ContractsService (Integration)", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let service: ContractsService;

  beforeAll(async () => {
    // Start Postgres container
    container = await new PostgreSqlContainer("postgres:15-alpine").start();

    const dbUri = container.getConnectionUri();

    // Initialize pool
    pool = new Pool({
      connectionString: dbUri,
    });

    // Run migrations using execSync
    execSync("npm run migrate", {
      env: { ...process.env, DATABASE_URL: dbUri },
      stdio: "inherit",
      cwd: process.cwd(), // Jest runs from src/api
    });

    // Provide mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: Pool, useValue: pool },
        { provide: LedgerService, useValue: { recordTransaction: jest.fn() } },
        { provide: TruthLogService, useValue: { appendEvent: jest.fn() } },
        {
          provide: StripeFboService,
          useValue: {
            holdStake: jest.fn(),
            captureStake: jest.fn(),
            cancelHold: jest.fn(),
            resolveDisposition: jest.fn(),
          },
        },
        {
          provide: RealStripeFBOService,
          useValue: { captureFunds: jest.fn() },
        },
        { provide: DisputeService, useValue: {} },
        { provide: FuryRouterService, useValue: {} },
        {
          provide: AegisProtocolService,
          useValue: { validateCreation: jest.fn() },
        },
        {
          provide: RecoveryProtocolService,
          useValue: { validateCreation: jest.fn() },
        },
        { provide: DynamicPenaltyService, useValue: {} },
        { provide: AnomalyService, useValue: {} },
        { provide: SettlementService, useValue: {} },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: CompliancePolicyService, useValue: {} },
        { provide: WaitlistService, useValue: {} },
        { provide: SurveyService, useValue: {} },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
    if (container) {
      await container.stop();
    }
  });

  describe("submitAttestation", () => {
    it("should insert an attestation and handle ON CONFLICT properly", async () => {
      // Setup user and contract
      const userId = uuidv4();
      const contractId = uuidv4();

      // Insert dummy user
      await pool.query(
        `INSERT INTO users (id, email, password_hash, status) VALUES ($1, $2, $3, $4)`,
        [userId, "[email redacted]", "hash", "ACTIVE"],
      );

      // Insert active contract
      await pool.query(
        `INSERT INTO contracts (id, user_id, status, oath_category, verification_method, stake_amount, duration_days, realm_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          contractId,
          userId,
          "ACTIVE",
          "RECOVERY_SUBSTANCE",
          "CAMERA",
          100,
          30,
          "RECOVERY_ABSTINENCE",
        ],
      );

      // Submit first attestation
      await service.submitAttestation(contractId, userId, {
        urgeLevel: 5,
        triggers: ["stress"],
        copingMechanisms: ["exercise"],
      });

      // Verify in DB
      let result = await pool.query(
        `SELECT * FROM attestations WHERE contract_id = $1`,
        [contractId],
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].status).toBe("ATTESTED");
      expect(result.rows[0].urge_level).toBe(5);
      expect(result.rows[0].triggers).toEqual(["stress"]);
      expect(result.rows[0].coping_mechanisms).toEqual(["exercise"]);

      // If we submit again, it should throw because existing status is ATTESTED
      await expect(
        service.submitAttestation(contractId, userId, { urgeLevel: 2 }),
      ).rejects.toThrow("Already attested today");
    });
  });
});
