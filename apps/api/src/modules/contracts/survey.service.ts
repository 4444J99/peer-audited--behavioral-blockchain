import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Pool } from "pg";

export interface SurveyResponse {
  id: string;
  userId: string;
  contractId: string;
  surveyType: "BASELINE" | "FINAL";
  responses: Record<string, unknown>;
  submittedAt: Date;
}

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(private readonly pool: Pool) {}

  async submitSurvey(
    userId: string,
    contractId: string,
    surveyType: "BASELINE" | "FINAL",
    responses: Record<string, unknown>,
  ): Promise<SurveyResponse> {
    const client = await this.pool.connect();
    try {
      const {
        rows: [contract],
      } = await client.query(
        "SELECT id, user_id FROM contracts WHERE id = $1",
        [contractId],
      );
      if (!contract) throw new NotFoundException("Contract not found");
      if (contract.user_id !== userId)
        throw new NotFoundException("Contract not found");

      const {
        rows: [existing],
      } = await client.query(
        "SELECT id FROM survey_responses WHERE contract_id = $1 AND survey_type = $2",
        [contractId, surveyType],
      );
      if (existing)
        throw new ConflictException(
          `A ${surveyType} survey has already been submitted for this contract`,
        );

      const {
        rows: [survey],
      } = await client.query(
        `INSERT INTO survey_responses (user_id, contract_id, survey_type, responses)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (contract_id, survey_type) DO NOTHING
         RETURNING id, user_id, contract_id, survey_type, responses, submitted_at`,
        [userId, contractId, surveyType, JSON.stringify(responses)],
      );

      this.logger.log(
        `Survey submitted: userId=${userId} contractId=${contractId} type=${surveyType}`,
      );
      return {
        id: survey.id,
        userId: survey.user_id,
        contractId: survey.contract_id,
        surveyType: survey.survey_type,
        responses: survey.responses,
        submittedAt: survey.submitted_at,
      };
    } finally {
      client.release();
    }
  }

  async getSurvey(
    contractId: string,
    userId: string,
    surveyType?: string,
  ): Promise<SurveyResponse[]> {
    const { rows } = await this.pool.query(
      `SELECT id, user_id, contract_id, survey_type, responses, submitted_at
       FROM survey_responses
       WHERE contract_id = $1 AND user_id = $2
       ${surveyType ? "AND survey_type = $3" : ""}
       ORDER BY submitted_at DESC`,
      surveyType ? [contractId, userId, surveyType] : [contractId, userId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      contractId: r.contract_id,
      surveyType: r.survey_type,
      responses: r.responses,
      submittedAt: r.submitted_at,
    }));
  }
}
