import { Injectable, Logger } from '@nestjs/common';

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'NONE' | 'HIGH' | 'CRITICAL';
  matchedKeywords: string[];
}

@Injectable()
export class CrisisDetectionService {
  private readonly logger = new Logger(CrisisDetectionService.name);

  // Hardcoded behavioral physics / crisis patterns
  private readonly CRITICAL_PATTERNS = [
    /\b(kill\s+myself|suicide|end\s+it\s+all|want\s+to\s+die|take\s+my\s+own\s+life)\b/i,
  ];

  private readonly HIGH_PATTERNS = [
    /\b(starve|purge|anorexia|bulimia|cutting\s+myself|self\s*harm)\b/i,
    /\b(relapse|using\s+again|drunk|high\s+right\s+now|drinking\s+again)\b/i,
  ];

  /**
   * Analyzes text content for crisis patterns.
   * Part of the Aegis Protocol.
   */
  public analyzeContent(content: string): CrisisDetectionResult {
    if (!content) {
      return { isCrisis: false, severity: 'NONE', matchedKeywords: [] };
    }

    const matchedKeywords: string[] = [];
    let severity: 'NONE' | 'HIGH' | 'CRITICAL' = 'NONE';

    for (const pattern of this.CRITICAL_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        severity = 'CRITICAL';
        matchedKeywords.push(match[0].toLowerCase());
      }
    }

    if (severity === 'NONE') {
      for (const pattern of this.HIGH_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          severity = 'HIGH';
          matchedKeywords.push(match[0].toLowerCase());
        }
      }
    }

    const isCrisis = severity !== 'NONE';

    if (isCrisis) {
      this.logger.warn(`Crisis detected in content analysis: Severity ${severity}`);
    }

    return {
      isCrisis,
      severity,
      matchedKeywords,
    };
  }
}
