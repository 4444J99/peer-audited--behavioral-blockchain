import { GUARDS_METADATA } from "@nestjs/common/constants";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AuthGuard } from "../../../guards/auth.guard";
import { IDENTITY_ARCHETYPES } from "../../../../shared/libs/identity-oath";
import { OnboardingController } from "./onboarding.controller";
import { IdentityOathService } from "./identity-oath.service";
import { DeclareIdentityOathDto } from "./dto";

const mockIdentityOaths = {
  getOnboardingState: jest.fn(),
  declare: jest.fn(),
} as unknown as IdentityOathService;

describe("OnboardingController", () => {
  let controller: OnboardingController;
  const testUser = { id: "user-1" };
  const archetype = IDENTITY_ARCHETYPES[0];

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OnboardingController(mockIdentityOaths);
  });

  it("requires authentication for the whole onboarding surface", () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, OnboardingController) ?? [];

    expect(guards).toContain(AuthGuard);
  });

  describe("GET /onboarding/identity-oath", () => {
    it("returns resumable state for the authenticated user", async () => {
      const state = { oathCategory: "RECOVERY_NOCONTACT", completed: false };
      (mockIdentityOaths.getOnboardingState as jest.Mock).mockResolvedValue(
        state,
      );

      const result = await controller.getIdentityOath(testUser);

      expect(mockIdentityOaths.getOnboardingState).toHaveBeenCalledWith(
        "user-1",
        undefined,
      );
      expect(result).toBe(state);
    });

    it("passes an explicit oath category through", async () => {
      (mockIdentityOaths.getOnboardingState as jest.Mock).mockResolvedValue({});

      await controller.getIdentityOath(testUser, "RECOVERY_NOCONTACT");

      expect(mockIdentityOaths.getOnboardingState).toHaveBeenCalledWith(
        "user-1",
        "RECOVERY_NOCONTACT",
      );
    });
  });

  describe("POST /onboarding/identity-oath", () => {
    it("declares the identity for the authenticated user", async () => {
      const oath = { id: "oath-1", archetypeId: archetype.id };
      (mockIdentityOaths.declare as jest.Mock).mockResolvedValue(oath);

      const dto = plainToInstance(DeclareIdentityOathDto, {
        archetypeId: archetype.id,
      });
      const result = await controller.declareIdentityOath(testUser, dto);

      expect(mockIdentityOaths.declare).toHaveBeenCalledWith("user-1", dto);
      expect(result).toBe(oath);
    });

    it("propagates service rejections", async () => {
      (mockIdentityOaths.declare as jest.Mock).mockRejectedValue(
        new Error("Unknown identity archetype: NOPE"),
      );

      await expect(
        controller.declareIdentityOath(testUser, {
          archetypeId: "NOPE",
        } as DeclareIdentityOathDto),
      ).rejects.toThrow("Unknown identity archetype: NOPE");
    });
  });

  describe("DeclareIdentityOathDto", () => {
    it("accepts a declared archetype", async () => {
      const dto = plainToInstance(DeclareIdentityOathDto, {
        archetypeId: archetype.id,
        oathCategory: "RECOVERY_NOCONTACT",
      });

      expect(await validate(dto)).toHaveLength(0);
    });

    it("rejects an archetype outside the catalogue", async () => {
      const dto = plainToInstance(DeclareIdentityOathDto, {
        archetypeId: "MADE_UP",
      });

      expect(await validate(dto)).not.toHaveLength(0);
    });

    it("rejects a category outside the phase-1 scope lock", async () => {
      const dto = plainToInstance(DeclareIdentityOathDto, {
        archetypeId: archetype.id,
        oathCategory: "BIOLOGICAL_WEIGHT",
      });

      expect(await validate(dto)).not.toHaveLength(0);
    });
  });
});
