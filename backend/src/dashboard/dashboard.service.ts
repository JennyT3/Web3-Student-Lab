import { getStudentAchievements } from '../blockchain/blockchain.service.js';
import prisma from '../db/index.js';
import { getStudentProgress } from '../routes/learning/learning.service.js';
import { getTokenBalance } from '../token/token.service.js';
import { Achievement, StudentDashboard, TokenBalance } from './types.js';

/**
 * Service to aggregate student profile data from multiple modules.
 * This service provides a centralized dashboard of achievements and rewards.
 */
export const getStudentDashboard = async (studentId: string): Promise<StudentDashboard> => {
  // Fetch primary student info and some database records for baseline verification
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      certificates: true,
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Unified Student Profile View across modules
  const [learningProgress, blockchainAchievements, tokenWallet] = await Promise.all([
    getStudentProgress(studentId),
    getStudentAchievements(studentId),
    getTokenBalance(studentId),
  ]);

  // Transform data for the Unified 'Student Profile' view
  const certificates: Achievement[] = blockchainAchievements.map(achievement => ({
    id: achievement.id,
    title: `Student Achievement: Certified Level ${achievement.status === 'verified' ? 'verified' : 'pending'}`,
    description: achievement.status === 'verified'
      ? `On-chain verified: ${achievement.txHash.substring(0, 10)}...`
      : 'Awaiting blockchain verification',
    date: achievement.timestamp,
    type: 'certificate',
    hash: achievement.txHash,
  }));

  const tokenBalance: TokenBalance = {
    symbol: tokenWallet.symbol,
    balance: tokenWallet.balance,
    lastUpdated: tokenWallet.lastUpdated,
  };

  // Aggregated Activity Logging
  const recentActivity = [
    `Joined Web3 Student Lab on ${student.createdAt.toLocaleDateString()}`,
  ];

  if (learningProgress.completedLessons.length > 0) {
    recentActivity.push(`Completed ${learningProgress.completedLessons.length} lessons`);
  }

  if (blockchainAchievements.length > 0) {
    recentActivity.push(`Earned ${blockchainAchievements.length} verified certificates`);
  }

  return {
    userId: studentId,
    progress: learningProgress,
    certificates,
    tokenBalance,
    recentActivity,
  };
};
