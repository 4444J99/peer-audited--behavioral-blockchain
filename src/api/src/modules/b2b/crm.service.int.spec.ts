import { v4 as uuidv4 } from "uuid";
import { Test, TestingModule } from "@nestjs/testing";
import { CrmService } from "./crm.service";
import { SalesforceConnector } from "./connectors/salesforce.connector";
import { HubSpotConnector } from "./connectors/hubspot.connector";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Pool } from "pg";
import { execSync } from "child_process";
import { describeWithContainerRuntime } from "../../../test/container-runtime";

describeWithContainerRuntime("CrmService (Integration)", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let service: CrmService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:15-alpine").start();
    const dbUri = container.getConnectionUri();

    pool = new Pool({
      connectionString: dbUri,
    });

    // Run migrations
    execSync("npm run migrate", {
      env: { ...process.env, DATABASE_URL: dbUri },
      stdio: "inherit",
      cwd: process.cwd(), // Jest runs from src/api
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: Pool, useValue: pool },
        {
          provide: SalesforceConnector,
          useValue: { pushEmployeeEvent: jest.fn() },
        },
        {
          provide: HubSpotConnector,
          useValue: { pushEmployeeEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  }, 60000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (container) await container.stop();
  });

  describe("calculateCorporateIntegrityScore", () => {
    it("aggregates integrity metrics for an enterprise", async () => {
      const enterpriseId = uuidv4();
      const otherEnterpriseId = uuidv4();
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      const inactiveUserId = uuidv4();
      const otherEnterpriseUserId = uuidv4();
      const contractId1 = uuidv4();
      const contractId2 = uuidv4();
      const inactiveContractId = uuidv4();

      // Setup enterprise (via users table referencing it)
      // Note: enterprises table was added in previous session's migration 037b
      await pool.query(
        `INSERT INTO enterprises (id, name) VALUES ($1, $2), ($3, $4)`,
        [enterpriseId, "Test Corp", otherEnterpriseId, "Other Corp"],
      );

      // Add users
      await pool.query(
        `INSERT INTO users (id, email, integrity_score, enterprise_id, status) VALUES 
         ($1, $2, $3, $4, 'ACTIVE'),
         ($5, $6, $7, $8, 'ACTIVE'),
         ($9, $10, $11, $12, 'SUSPENDED'),
         ($13, $14, $15, $16, 'ACTIVE')`,
        [
          userId1,
          "u1@test.com",
          80,
          enterpriseId,
          userId2,
          "u2@test.com",
          60,
          enterpriseId,
          inactiveUserId,
          "inactive@test.com",
          100,
          enterpriseId,
          otherEnterpriseUserId,
          "other@test.com",
          10,
          otherEnterpriseId,
        ],
      );

      // Add active contracts for one active user and one inactive user. The duplicate
      // active-user contract must not weight averageIntegrity, and the inactive user's
      // contract must not count toward the enterprise aggregate.
      await pool.query(
        `INSERT INTO contracts (id, user_id, status, oath_category, verification_method, stake_amount, duration_days, realm_id) 
         VALUES
          ($1, $2, 'ACTIVE', 'BIOLOGICAL_WEIGHT', 'WEIGHT', 100, 30, 'BIOLOGICAL_HARDWARE'),
          ($3, $4, 'ACTIVE', 'BIOLOGICAL_WEIGHT', 'WEIGHT', 100, 30, 'BIOLOGICAL_HARDWARE'),
          ($5, $6, 'ACTIVE', 'BIOLOGICAL_WEIGHT', 'WEIGHT', 100, 30, 'BIOLOGICAL_HARDWARE')`,
        [
          contractId1,
          userId1,
          contractId2,
          userId1,
          inactiveContractId,
          inactiveUserId,
        ],
      );

      // Add velocity events. Only the first two belong to active users in this enterprise.
      await pool.query(
        `INSERT INTO event_log (event_type, payload, previous_hash, current_hash) 
         VALUES
          ('CONTRACT_RESOLVED', $1, 'genesis', 'hash1'),
          ('CONTRACT_RESOLVED', $2, 'hash1', 'hash2'),
          ('CONTRACT_RESOLVED', $3, 'hash2', 'hash3'),
          ('CONTRACT_RESOLVED', $4, 'hash3', 'hash4')`,
        [
          JSON.stringify({ userId: userId1 }),
          JSON.stringify({ contractId: contractId2 }),
          JSON.stringify({ userId: inactiveUserId }),
          JSON.stringify({ userId: otherEnterpriseUserId }),
        ],
      );

      const score =
        await service.calculateCorporateIntegrityScore(enterpriseId);

      expect(score.averageIntegrity).toBe(70); // (80 + 60) / 2
      expect(score.activeContracts).toBe(2);
      expect(score.behavioralVelocity).toBe(2);
    });

    it("returns zero stats for non-existent enterprise", async () => {
      const score = await service.calculateCorporateIntegrityScore(uuidv4());
      expect(score.averageIntegrity).toBe(0);
      expect(score.activeContracts).toBe(0);
    });
  });
});
