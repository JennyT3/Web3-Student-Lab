import { Contract, rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import prisma from '../db/index.js';

interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  issuedAt: Date;
  certificateHash: string | null;
  status: string;
}

export interface BlockchainRecord {
  id: string;
  txHash: string;
  timestamp: Date;
  status: 'verified' | 'pending';
}

export interface CertificateData {
  symbol: string;
  student: string;
  course_name: string;
  issue_date: bigint;
}

// Configuration from environment variables
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const CERTIFICATE_CONTRACT_ID = process.env.CERTIFICATE_CONTRACT_ID || '';

/**
 * Initialize Soroban server connection
 */
const getSorobanServer = () => {
  return new rpc.Server(SOROBAN_RPC_URL);
};

/**
 * Verify a certificate on the Soroban blockchain
 */
export const verifyCertificateOnChain = async (
  symbol: string
): Promise<CertificateData | null> => {
  try {
    if (!CERTIFICATE_CONTRACT_ID) {
      console.warn('Certificate contract ID not configured');
      return null;
    }

    const server = getSorobanServer();

    // Check server health
    const health = await server.getHealth();
    if (health.status !== 'healthy') {
      throw new Error('Soroban RPC server is not healthy');
    }

    // Create contract instance
    const contract = new Contract(CERTIFICATE_CONTRACT_ID);

    // Prepare the arguments for 'get_certificate'
    const args = [xdr.ScVal.scvString(symbol)];

    // Create the contract call operation
    const contractCall = contract.call('get_certificate', ...args);

    // Simulate the transaction
    const result = await server.simulateTransaction(contractCall as any);

    if (rpc.Api.isSimulationSuccess(result)) {
      const entry = result.result?.retval;
      if (entry) {
        const data = scValToNative(entry);
        return {
          symbol: data.symbol,
          student: data.student,
          course_name: data.course_name,
          issue_date: data.issue_date,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error verifying certificate on-chain:', error);
    return null;
  }
};

/**
 * Service to interact with Stellar/Soroban or simulate blockchain records.
 */
export const getStudentAchievements = async (studentId: string): Promise<BlockchainRecord[]> => {
  // Simulating fetching verified achievements from on-chain transactions meta
  const certificates = await prisma.certificate.findMany({
    where: {
      studentId,
      status: 'issued',
    },
  });

  return certificates.map((cert: Certificate) => ({
    id: cert.id,
    txHash: cert.certificateHash || `0x${Math.random().toString(16).substring(2, 40)}`,
    timestamp: cert.issuedAt,
    status: cert.certificateHash ? 'verified' : 'pending',
  }));
};
