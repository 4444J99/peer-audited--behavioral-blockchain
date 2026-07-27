import { Injectable, Logger } from "@nestjs/common";

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: "NONE" | "MEDIUM" | "HIGH" | "CRITICAL";
  matchedKeywords: string[];
  category?: "SUICIDE" | "SELF_HARM" | "EATING_DISORDER" | "SUBSTANCE" | "CRISIS_UNSPECIFIED";
}

/**
 * CrisisDetectionService — Aegis Protocol safety layer.
 *
 * Scans text content for crisis-related language patterns across five severity
 * tiers. Patterns use word-boundary regex with flexible separator matching to
 * catch variations while minimizing false positives.
 *
 * Severity escalation: CRITICAL > HIGH > MEDIUM > NONE. A single CRITICAL match
 * overrides all lower severities in the same content.
 *
 * Proactive monitoring: this service is invoked on proof descriptions, chat
 * messages, and self-reports to catch crisis signals before they escalate.
 */
@Injectable()
export class CrisisDetectionService {
  private readonly logger = new Logger(CrisisDetectionService.name);

  private readonly SEP = /[\s.,!?;:\-'"…]+/;

  // ─── CRITICAL: Immediate danger — suicide, self-kill, end-of-life ───────
  private readonly CRITICAL_PATTERNS: { pattern: RegExp; category: CrisisDetectionResult["category"] }[] = [
    // Direct self-harm intent
    {
      pattern: new RegExp(
        `\\b(kill${this.SEP.source}myself|suicid(?:e|e?al)|end${this.SEP.source}it${this.SEP.source}all|want${this.SEP.source}to${this.SEP.source}die|(?:take|taking|took)${this.SEP.source}my${this.SEP.source}own${this.SEP.source}life)\\b`,
        "i",
      ),
      category: "SUICIDE",
    },
    // Expanded: "end my life", "rather be dead", "no reason to live"
    {
      pattern: new RegExp(
        `\\b(end${this.SEP.source}my${this.SEP.source}life|rather${this.SEP.source}be${this.SEP.source}dead|no${this.SEP.source}reason${this.SEP.source}to${this.SEP.source}live|can(?:'t|t|${this.SEP.source}not)${this.SEP.source}go${this.SEP.source}on|want${this.SEP.source}to${this.SEP.source}disappear)\\b`,
        "i",
      ),
      category: "SUICIDE",
    },
    // Overdose / lethal means
    {
      pattern: new RegExp(
        `\\b(overdose|took${this.SEP.source}too${this.SEP.source}many${this.SEP.source}pills|pills${this.SEP.source}to${this.SEP.source}(?:end|kill)|bridg(?:e|es)|jump${this.SEP.source}off)\\b`,
        "i",
      ),
      category: "SUICIDE",
    },
  ];

  // ─── HIGH: Serious risk — active self-harm, eating disorders, relapse ───
  private readonly HIGH_PATTERNS: { pattern: RegExp; category: CrisisDetectionResult["category"] }[] = [
    // Self-harm
    {
      pattern: new RegExp(
        `\\b(cutting${this.SEP.source}myself|self${this.SEP.source}harm|cutting${this.SEP.source}deep|burning${this.SEP.source}myself|scratching${this.SEP.source}myself)\\b`,
        "i",
      ),
      category: "SELF_HARM",
    },
    // Eating disorders
    {
      pattern: new RegExp(
        `\\b(purge|anorexia|bulimia|binge${this.SEP.source}(?:and|&amp;)${this.SEP.source}purge|laxative${this.SEP.source}abuse|fasting${this.SEP.source}too${this.SEP.source}much)\\b`,
        "i",
      ),
      category: "EATING_DISORDER",
    },
    // Active substance use
    {
      pattern: new RegExp(
        `\\b(relapse|using${this.SEP.source}again|drunk|high${this.SEP.source}right${this.SEP.source}now|drinking${this.SEP.source}again|od(?:'d|ed)|overdosed)\\b`,
        "i",
      ),
      category: "SUBSTANCE",
    },
    // Active starvation
    {
      pattern: new RegExp(
        `\\b(starve|starving${this.SEP.source}myself|not${this.SEP.source}eating${this.SEP.source}for|skipping${this.SEP.source}meals)\\b`,
        "i",
      ),
      category: "EATING_DISORDER",
    },
  ];

  // ─── MEDIUM: Concerning language — worth monitoring, not immediately dangerous ──
  private readonly MEDIUM_PATTERNS: { pattern: RegExp; category: CrisisDetectionResult["category"] }[] = [
    // Hopelessness / despair
    {
      pattern: new RegExp(
        `\\b(hopeless|worthless|nothing${this.SEP.source}matters|what(?:'s|s|${this.SEP.source}is)${this.SEP.source}the${this.SEP.source}point|give${this.SEP.source}up)\\b`,
        "i",
      ),
      category: "CRISIS_UNSPECIFIED",
    },
    // Isolation / withdrawal
    {
      pattern: new RegExp(
        `\\b(nobody${this.SEP.source}(?:cares|loves${this.SEP.source}me)|alone${this.SEP.source}forever|don(?:'t|t|${this.SEP.source}not)${this.SEP.source}belong${this.SEP.source}here)\\b`,
        "i",
      ),
      category: "CRISIS_UNSPECIFIED",
    },
    // Trauma / panic
    {
      pattern: new RegExp(
        `\\b(triggered|flashback|panic${this.SEP.source}attack|can(?:'t|t|${this.SEP.source}not)${this.SEP.source}breathe|dissociat(?:e|ing|ion))\\b`,
        "i",
      ),
      category: "CRISIS_UNSPECIFIED",
    },
  ];

  /**
   * Analyzes text content for crisis patterns.
   * Part of the Aegis Protocol.
   *
   * Returns the highest severity matched across all pattern tiers.
   * CRITICAL overrides HIGH which overrides MEDIUM.
   */
  public analyzeContent(content: string): CrisisDetectionResult {
    if (!content) {
      return { isCrisis: false, severity: "NONE", matchedKeywords: [] };
    }

    const matchedKeywords: string[] = [];
    let severity: CrisisDetectionResult["severity"] = "NONE";
    let category: CrisisDetectionResult["category"] = undefined;

    // Check CRITICAL patterns first (fastest path to escalation)
    for (const { pattern, category: cat } of this.CRITICAL_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        severity = "CRITICAL";
        category = cat;
        matchedKeywords.push(match[0].toLowerCase());
      }
    }

    // Check HIGH patterns only if no CRITICAL found
    if (severity === "NONE") {
      for (const { pattern, category: cat } of this.HIGH_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          severity = "HIGH";
          category = cat;
          matchedKeywords.push(match[0].toLowerCase());
        }
      }
    }

    // Check MEDIUM patterns only if nothing higher matched
    if (severity === "NONE") {
      for (const { pattern, category: cat } of this.MEDIUM_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          severity = "MEDIUM";
          category = cat;
          matchedKeywords.push(match[0].toLowerCase());
        }
      }
    }

    const isCrisis = severity !== "NONE";

    if (isCrisis) {
      this.logger.warn(
        `Crisis detected: severity=${severity} category=${category} keywords=[${matchedKeywords.join(",")}]`,
      );
    }

    return {
      isCrisis,
      severity,
      matchedKeywords: [...new Set(matchedKeywords)], // dedup
      category,
    };
  }
}
