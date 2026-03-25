export interface TokenWallet {
    symbol: string;
    balance: number;
    lastUpdated: Date;
    network: 'stellar-testnet' | 'mock-native';
}
/**
 * Service to manage student reward tokens (SLAB/STUD tokens).
 */
export declare const getTokenBalance: (studentId: string) => Promise<TokenWallet>;
export declare const grantTokens: (studentId: string, amount: number) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=token.service.d.ts.map