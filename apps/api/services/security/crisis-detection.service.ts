import { Injectable, Logger } from "@nestjs/common";

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: "NONE" | "HIGH" | "CRITICAL";
  matchedKeywords: string[];
}

@Injectable()
export class CrisisDetectionService {
  private readonly logger = new Logger(CrisisDetectionService.name);

  private readonly SEP = /[\s.,!?;:\-'"…]+/;

  private readonly CRITICAL_PATTERNS = [
    new RegExp(
      `\\b(kill${this.SEP.source}myself|suicide|end${this.SEP.source}it${this.SEP.source}all|want${this.SEP.source}to${this.SEP.source}die|(?:take|taking|took)${this.SEP.source}my${this.SEP.source}own${this.SEP.source}life)\\b`,
      "i",
    ),
  ];

  private readonly HIGH_PATTERNS = [
    new RegExp(
      `\\b(starve|purge|anorexia|bulimia|cutting${this.SEP.source}myself|self${this.SEP.source}harm)\\b`,
      "i",
    ),
    new RegExp(
      `\\b(relapse|using${this.SEP.source}again|drunk|high${this.SEP.source}right${this.SEP.source}now|drinking${this.SEP.source}again)\\b`,
      "i",
    ),
  ];

  /**
   * Analyzes text content for crisis patterns.
   * Part of the Aegis Protocol.
   */
  public analyzeContent(content: string): CrisisDetectionResult {
    if (!content) {
      return { isCrisis: false, severity: "NONE", matchedKeywords: [] };
    }

    const matchedKeywords: string[] = [];
    let severity: "NONE" | "HIGH" | "CRITICAL" = "NONE";

    for (const pattern of this.CRITICAL_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        severity = "CRITICAL";
        matchedKeywords.push(match[0].toLowerCase());
      }
    }

    if (severity === "NONE") {
      for (const pattern of this.HIGH_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          severity = "HIGH";
          matchedKeywords.push(match[0].toLowerCase());
        }
      }
    }

    const isCrisis = severity !== "NONE";

    if (isCrisis) {
      this.logger.warn(
        `Crisis detected in content analysis: Severity ${severity}`,
      );
    }

    return {
      isCrisis,
      severity,
      matchedKeywords,
    };
  }
}
