import { Test, TestingModule } from "@nestjs/testing";
import { SurveyService } from "./survey.service";
import { Pool } from "pg";

describe("SurveyService", () => {
  let service: SurveyService;
  let pool: Pool;

  const mockQuery = jest.fn();
  const mockConnect = jest.fn();

  beforeEach(async () => {
    mockQuery.mockReset();
    mockConnect.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        { provide: Pool, useValue: { query: mockQuery, connect: mockConnect } },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
    pool = module.get<Pool>(Pool);
  });

  it("submits a baseline survey", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: "c1", user_id: "u1" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "s1",
              user_id: "u1",
              contract_id: "c1",
              survey_type: "BASELINE",
              responses: { q1: "yes" },
              submitted_at: new Date(),
            },
          ],
        }),
      release: jest.fn(),
    };
    mockConnect.mockResolvedValue(client as any);

    const result = await service.submitSurvey("u1", "c1", "BASELINE", {
      q1: "yes",
    });
    expect(result.surveyType).toBe("BASELINE");
    expect(result.contractId).toBe("c1");
  });

  it("rejects duplicate survey type", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: "c1", user_id: "u1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "dup" }] }),
      release: jest.fn(),
    };
    mockConnect.mockResolvedValue(client as any);

    await expect(
      service.submitSurvey("u1", "c1", "BASELINE", {}),
    ).rejects.toThrow();
  });

  it("gets surveys for a contract", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "s1",
          user_id: "u1",
          contract_id: "c1",
          survey_type: "BASELINE",
          responses: {},
          submitted_at: new Date(),
        },
      ],
    });

    const results = await service.getSurvey("c1", "u1");
    expect(results).toHaveLength(1);
    expect(results[0].surveyType).toBe("BASELINE");
  });

  it("filters by survey type", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const results = await service.getSurvey("c1", "u1", "FINAL");
    expect(results).toHaveLength(0);
  });
});
