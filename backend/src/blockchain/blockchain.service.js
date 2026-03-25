"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentAchievements = void 0;
const index_js_1 = __importDefault(require("../db/index.js"));
/**
 * Service to interact with Stellar/Soroban or simulate blockchain records.
 */
const getStudentAchievements = async (studentId) => {
    // Simulating fetching verified achievements from on-chain transactions meta
    const certificates = await index_js_1.default.certificate.findMany({
        where: {
            studentId,
            status: 'issued'
        },
    });
    return certificates.map((cert) => ({
        id: cert.id,
        txHash: cert.certificateHash || `0x${Math.random().toString(16).substring(2, 40)}`,
        timestamp: cert.issuedAt,
        status: cert.certificateHash ? 'verified' : 'pending',
    }));
};
exports.getStudentAchievements = getStudentAchievements;
//# sourceMappingURL=blockchain.service.js.map