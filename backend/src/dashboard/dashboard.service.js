"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDashboard = void 0;
const blockchain_service_js_1 = require("../blockchain/blockchain.service.js");
const index_js_1 = __importDefault(require("../db/index.js"));
const learning_service_js_1 = require("../routes/learning/learning.service.js");
const token_service_js_1 = require("../token/token.service.js");
/**
 * Service to aggregate student profile data from multiple modules.
 * This service provides a centralized dashboard of achievements and rewards.
 */
const getStudentDashboard = async (studentId) => {
    // Fetch primary student info and some database records for baseline verification
    const student = await index_js_1.default.student.findUnique({
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
        (0, learning_service_js_1.getStudentProgress)(studentId),
        (0, blockchain_service_js_1.getStudentAchievements)(studentId),
        (0, token_service_js_1.getTokenBalance)(studentId),
    ]);
    // Transform data for the Unified 'Student Profile' view
    const certificates = blockchainAchievements.map(achievement => ({
        id: achievement.id,
        title: `Student Achievement: Certified Level ${achievement.status === 'verified' ? 'verified' : 'pending'}`,
        description: achievement.status === 'verified'
            ? `On-chain verified: ${achievement.txHash.substring(0, 10)}...`
            : 'Awaiting blockchain verification',
        date: achievement.timestamp,
        type: 'certificate',
        hash: achievement.txHash,
    }));
    const tokenBalance = {
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
exports.getStudentDashboard = getStudentDashboard;
//# sourceMappingURL=dashboard.service.js.map