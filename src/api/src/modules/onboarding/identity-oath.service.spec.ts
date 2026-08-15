import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import {
  IDENTITY_ARCHETYPES,
  assignCopyVariant,
  buildPledgeCopy,
} from "../../../../shared/libs/identity-oath";
import { IdentityOathService } from "./identity-oath.service";

describe("IdentityOathService", () => {
  let service: IdentityOathService;

  const mockPool = {
    query: jest.fn(),
  };

  const archetype = IDENTITY_ARCHETYPES[0];

  const storedRow = {
    id: "oath-1",
    user_id: "user-1",
    oath_category: "RECOVERY_NOCONTACT",
    archetype_id: archetype.id,
    identity_label: archetype.label,
    pledge_copy: buildPledgeCopy(
      archetype,
      assignCopyVariant("user-1", archetype.id),
    ),
    copy_variant: assignCopyVariant("user-1", archetype.id),
    activated_at: new Date("2026-03-04T12:00:00.000Z"),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityOathService, { provide: Pool, useValue: mockPool }],
    }).compile();

    service = module.get<IdentityOathService>(IdentityOathService);
  });

  describe("getOnboardingState", () => {
    it("reports an untouched identity step as resumable and incomplete", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const state = await service.getOnboardingState("user-1");

      expect(state.oathCategory).toBe("RECOVERY_NOCONTACT");
      expect(state.oath).toBeNull();
      expect(state.completed).toBe(false);
      // The catalogue always ships with the state so a resumed wizard can
      // re-render the same choices without a second call.
      expect(state.archetypes).toEqual(IDENTITY_ARCHETYPES);
    });

    it("returns the declaration on file so onboarding resumes past it", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [storedRow] });

      const state = await service.getOnboardingState("user-1");

      expect(state.completed).toBe(true);
      expect(state.oath).toEqual({
        id: "oath-1",
        userId: "user-1",
        oathCategory: "RECOVERY_NOCONTACT",
        archetypeId: archetype.id,
        identityLabel: archetype.label,
        pledgeCopy: storedRow.pledge_copy,
        copyVariant: storedRow.copy_variant,
        activatedAt: storedRow.activated_at,
      });
    });

    it("reads a declared-but-unactivated row as incomplete", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...storedRow, activated_at: null }],
      });

      const state = await service.getOnboardingState("user-1");

      expect(state.oath?.activatedAt).toBeNull();
      expect(state.completed).toBe(false);
    });

    it("rejects a category outside the phase-1 scope lock", async () => {
      await expect(
        service.getOnboardingState("user-1", "BIOLOGICAL_WEIGHT"),
      ).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe("declare", () => {
    it("composes the pledge server-side and stamps activation", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [storedRow] });

      const oath = await service.declare("user-1", {
        archetypeId: archetype.id,
      });

      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO user_identity_oaths");
      expect(sql).toContain("ON CONFLICT (user_id, oath_category) DO UPDATE");
      expect(params).toEqual([
        "user-1",
        "RECOVERY_NOCONTACT",
        archetype.id,
        archetype.label,
        buildPledgeCopy(archetype, assignCopyVariant("user-1", archetype.id)),
        assignCopyVariant("user-1", archetype.id),
      ]);
      expect(oath.id).toBe("oath-1");
    });

    it("preserves the first activation timestamp when re-declaring", () => {
      // The row keeps its original activated_at; only the identity fields move.
      mockPool.query.mockResolvedValueOnce({ rows: [storedRow] });

      return service.declare("user-1", { archetypeId: archetype.id }).then(() => {
        const [sql] = mockPool.query.mock.calls[0];
        expect(sql).toContain(
          "activated_at = COALESCE(user_identity_oaths.activated_at, EXCLUDED.activated_at)",
        );
      });
    });

    it("rejects an unknown archetype without touching the database", async () => {
      await expect(
        service.declare("user-1", { archetypeId: "NOT_AN_ARCHETYPE" }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("rejects a category outside the phase-1 scope lock", async () => {
      await expect(
        service.declare("user-1", {
          archetypeId: archetype.id,
          oathCategory: "COGNITIVE_FOCUS",
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe("getActivatedOath", () => {
    it("returns the oath a contract can bind to", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [storedRow] });

      const oath = await service.getActivatedOath(
        "user-1",
        "RECOVERY_NOCONTACT",
      );

      expect(oath?.id).toBe("oath-1");
    });

    it("returns null while the declaration is not activated", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...storedRow, activated_at: null }],
      });

      expect(
        await service.getActivatedOath("user-1", "RECOVERY_NOCONTACT"),
      ).toBeNull();
    });

    it("returns null for a category with no identity journey", async () => {
      expect(
        await service.getActivatedOath("user-1", "BIOLOGICAL_WEIGHT"),
      ).toBeNull();
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
});
