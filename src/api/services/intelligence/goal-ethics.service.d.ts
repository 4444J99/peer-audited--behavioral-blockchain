export interface GoalEthicsResult {
    ethical: boolean;
    reason?: string;
}
export declare class GoalEthicsService {
    isGoalEthical(goalDescription: string): Promise<boolean>;
}
