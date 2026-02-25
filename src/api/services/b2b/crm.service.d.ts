export interface CrmUser {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
}
export declare class CrmService {
    private readonly logger;
    syncUser(user: CrmUser): Promise<void>;
    logInteraction(email: string, type: string, metadata: Record<string, any>): Promise<void>;
}
