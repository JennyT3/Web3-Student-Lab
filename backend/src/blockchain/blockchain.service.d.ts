export interface BlockchainRecord {
    id: string;
    txHash: string;
    timestamp: Date;
    status: 'verified' | 'pending';
}
/**
 * Service to interact with Stellar/Soroban or simulate blockchain records.
 */
export declare const getStudentAchievements: (studentId: string) => Promise<BlockchainRecord[]>;
//# sourceMappingURL=blockchain.service.d.ts.map