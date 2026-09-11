import { GUARDS_METADATA } from "@nestjs/common/constants";
import { AuthGuard } from "../../../guards/auth.guard";
import { ROLES_KEY, RoleGuard } from "../../common/guards/role.guard";
import { AgentActionEvidenceController } from "./agent-action-evidence.controller";
import { AgentActionEvidenceService } from "./agent-action-evidence.service";

describe("AgentActionEvidenceController authorization boundary", () => {
  const evidence = {
    propose: jest.fn(),
    recordApproval: jest.fn(),
    recordMutation: jest.fn(),
    recordVerification: jest.fn(),
    recordRollback: jest.fn(),
    openDispute: jest.fn(),
    recordPeerReview: jest.fn(),
    getExecution: jest.fn(),
  };
  const controller = new AgentActionEvidenceController(
    evidence as unknown as AgentActionEvidenceService,
  );

  beforeEach(() => jest.clearAllMocks());

  it("requires authenticated ADMIN access for the entire controller", () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AgentActionEvidenceController),
    ).toEqual([AuthGuard, RoleGuard]);
    expect(
      Reflect.getMetadata(ROLES_KEY, AgentActionEvidenceController),
    ).toEqual(["ADMIN"]);
  });

  it("binds approval identity to the authenticated principal", async () => {
    const dto = {
      decision: "APPROVED" as const,
      reason: "Reviewed by operator",
      evidence: [],
    };
    await controller.recordApproval(
      "execution-1",
      { id: "admin:verified" },
      dto,
    );

    expect(evidence.recordApproval).toHaveBeenCalledWith(
      "execution-1",
      dto,
      "admin:verified",
    );
  });

  it("records a mutation receipt through the evidence service only", async () => {
    const dto = {
      outcome: "SUCCEEDED" as const,
      receipt: "receipt:1",
      evidence: [],
    };
    await controller.recordMutation(
      "execution-1",
      { id: "admin:verified" },
      dto,
    );

    expect(evidence.recordMutation).toHaveBeenCalledWith(
      "execution-1",
      dto,
      "admin:verified",
    );
  });
});
