export declare const BASE_INTEGRITY = 50;
export declare const FRAUD_PENALTY = 15;
export declare const STRIKE_PENALTY = 20;
export declare const COMPLETION_BONUS = 5;
export declare const AUDITOR_STAKE_AMOUNT = 2;
export declare const AUDITOR_HARASSMENT_THRESHOLD = 3;
export interface UserHistory {
    userId: string;
    completedOaths: number;
    fraudStrikes: number;
    failedOaths: number;
    monthsInactive: number;
}
export interface FuryHistory {
    furyId: string;
    successfulAudits: number;
    falseAccusations: number;
    totalAudits: number;
}
export declare function calculateIntegrity(history: UserHistory): number;
export declare function getAllowedTiers(score: number): string[];
export declare const FALSE_ACCUSATION_WEIGHT = 3;
export declare function calculateAccuracy(history: FuryHistory): number;
export declare function shouldDemoteFury(history: FuryHistory): boolean;
export declare function getTierMaxStake(tiers: string[]): number;
