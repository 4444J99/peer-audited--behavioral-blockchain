/**
 * Fury Violation Code Taxonomy
 *
 * Structured rejection reasons for Fury auditors when rejecting proof submissions.
 * Maps to the motivation-validation synthesis requirement for auditor-citable
 * violation codes instead of free-text reasons.
 */

export enum FuryViolationCode {
  MEDIA_TAMPERED = "V-MEDIA-001",
  MEDIA_IRRELEVANT = "V-MEDIA-002",
  MEDIA_UNREADABLE = "V-MEDIA-003",
  MEDIA_DUPLICATE = "V-MEDIA-004",

  METADATA_MISMATCH_TIMESTAMP = "V-META-001",
  METADATA_MISMATCH_LOCATION = "V-META-002",
  METADATA_MISMATCH_DEVICE = "V-META-003",

  OATH_CATEGORY_MISMATCH = "V-OATH-001",
  OATH_TARGET_AMBIGUOUS = "V-OATH-002",
  OATH_BOUNDS_EXCEEDED = "V-OATH-003",

  FRAUD_PREVIOUS_SUBMISSION = "V-FRAUD-001",
  FRAUD_SYNTHETIC_CONTENT = "V-FRAUD-002",
  FRAUD_STAGED_SCENE = "V-FRAUD-003",

  SCOPE_INSUFFICIENT_EVIDENCE = "V-SCOPE-001",
  SCOPE_WRONG_PROOF_TYPE = "V-SCOPE-002",

  OTHER_UNCATEGORIZED = "V-OTHER-001",
}

export interface ViolationCodeInfo {
  code: FuryViolationCode;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const VIOLATION_CODE_CATALOG: Record<
  FuryViolationCode,
  ViolationCodeInfo
> = {
  [FuryViolationCode.MEDIA_TAMPERED]: {
    code: FuryViolationCode.MEDIA_TAMPERED,
    label: "Media Tampered",
    description: "Proof media shows signs of editing or manipulation",
    severity: "HIGH",
  },
  [FuryViolationCode.MEDIA_IRRELEVANT]: {
    code: FuryViolationCode.MEDIA_IRRELEVANT,
    label: "Media Irrelevant",
    description: "Proof media does not relate to the contract oath",
    severity: "MEDIUM",
  },
  [FuryViolationCode.MEDIA_UNREADABLE]: {
    code: FuryViolationCode.MEDIA_UNREADABLE,
    label: "Media Unreadable",
    description: "Proof media is too blurry, dark, or corrupted to evaluate",
    severity: "LOW",
  },
  [FuryViolationCode.MEDIA_DUPLICATE]: {
    code: FuryViolationCode.MEDIA_DUPLICATE,
    label: "Media Duplicate",
    description: "Proof media is a duplicate of a previous submission",
    severity: "HIGH",
  },
  [FuryViolationCode.METADATA_MISMATCH_TIMESTAMP]: {
    code: FuryViolationCode.METADATA_MISMATCH_TIMESTAMP,
    label: "Timestamp Mismatch",
    description: "Proof timestamp does not match contract timeline",
    severity: "MEDIUM",
  },
  [FuryViolationCode.METADATA_MISMATCH_LOCATION]: {
    code: FuryViolationCode.METADATA_MISMATCH_LOCATION,
    label: "Location Mismatch",
    description: "Proof location data does not match expected contract context",
    severity: "LOW",
  },
  [FuryViolationCode.METADATA_MISMATCH_DEVICE]: {
    code: FuryViolationCode.METADATA_MISMATCH_DEVICE,
    label: "Device Mismatch",
    description: "Proof device fingerprint does not match known user devices",
    severity: "MEDIUM",
  },
  [FuryViolationCode.OATH_CATEGORY_MISMATCH]: {
    code: FuryViolationCode.OATH_CATEGORY_MISMATCH,
    label: "Oath Category Mismatch",
    description: "Proof content does not match the contract's oath category",
    severity: "MEDIUM",
  },
  [FuryViolationCode.OATH_TARGET_AMBIGUOUS]: {
    code: FuryViolationCode.OATH_TARGET_AMBIGUOUS,
    label: "Target Ambiguous",
    description: "Cannot determine if proof satisfies the specific oath target",
    severity: "LOW",
  },
  [FuryViolationCode.OATH_BOUNDS_EXCEEDED]: {
    code: FuryViolationCode.OATH_BOUNDS_EXCEEDED,
    label: "Bounds Exceeded",
    description: "Proof exceeds contract-defined scope or frequency limits",
    severity: "LOW",
  },
  [FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION]: {
    code: FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION,
    label: "Previous Submission Reused",
    description: "Proof matches a previous submission from any user",
    severity: "CRITICAL",
  },
  [FuryViolationCode.FRAUD_SYNTHETIC_CONTENT]: {
    code: FuryViolationCode.FRAUD_SYNTHETIC_CONTENT,
    label: "Synthetic Content",
    description: "Proof appears AI-generated or synthetic",
    severity: "CRITICAL",
  },
  [FuryViolationCode.FRAUD_STAGED_SCENE]: {
    code: FuryViolationCode.FRAUD_STAGED_SCENE,
    label: "Staged Scene",
    description: "Proof appears staged rather than authentic",
    severity: "HIGH",
  },
  [FuryViolationCode.SCOPE_INSUFFICIENT_EVIDENCE]: {
    code: FuryViolationCode.SCOPE_INSUFFICIENT_EVIDENCE,
    label: "Insufficient Evidence",
    description: "Proof does not provide enough evidence to verify the oath",
    severity: "MEDIUM",
  },
  [FuryViolationCode.SCOPE_WRONG_PROOF_TYPE]: {
    code: FuryViolationCode.SCOPE_WRONG_PROOF_TYPE,
    label: "Wrong Proof Type",
    description: "Proof format does not match the required verification method",
    severity: "MEDIUM",
  },
  [FuryViolationCode.OTHER_UNCATEGORIZED]: {
    code: FuryViolationCode.OTHER_UNCATEGORIZED,
    label: "Uncategorized",
    description: "Rejection reason does not fit existing categories",
    severity: "LOW",
  },
};

export function getViolationLabel(code: FuryViolationCode): string {
  return VIOLATION_CODE_CATALOG[code]?.label ?? "Unknown";
}

export function getViolationSeverity(
  code: FuryViolationCode,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  return VIOLATION_CODE_CATALOG[code]?.severity ?? "LOW";
}

export function isFraudViolation(code: FuryViolationCode): boolean {
  return code.startsWith("V-FRAUD-");
}

export function isMediaViolation(code: FuryViolationCode): boolean {
  return code.startsWith("V-MEDIA-");
}
