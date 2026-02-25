export interface RecoveryMetadata {
    accountabilityPartnerEmail: string;
    noContactIdentifiers?: string[];
    acknowledgments: {
        voluntary: boolean;
        noMinors: boolean;
        noDependents: boolean;
        noLegalObligations: boolean;
    };
}
export declare class RecoveryProtocolService {
    validateRecoveryContract(oathCategory: string, durationDays: number, metadata?: RecoveryMetadata): boolean;
}
