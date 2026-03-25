"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = __importDefault(require("../db/index.js"));
const router = (0, express_1.Router)();
// GET /api/certificates - Get all certificates
router.get('/', async (req, res) => {
    try {
        const certificates = await index_js_1.default.certificate.findMany({
            include: {
                student: true,
                course: true,
            },
        });
        res.json(certificates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});
// GET /api/certificates/:id - Get certificate by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await index_js_1.default.certificate.findUnique({
            where: { id },
            include: {
                student: true,
                course: true,
            },
        });
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }
        res.json(certificate);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch certificate' });
    }
});
// GET /api/certificates/student/:studentId - Get certificates by student
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const certificates = await index_js_1.default.certificate.findMany({
            where: { studentId },
            include: {
                course: true,
            },
        });
        res.json(certificates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch student certificates' });
    }
});
// POST /api/certificates - Issue a new certificate
router.post('/', async (req, res) => {
    try {
        const { studentId, courseId, certificateHash } = req.body;
        if (!studentId || !courseId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Verify student and course exist
        const [student, course] = await Promise.all([
            index_js_1.default.student.findUnique({ where: { id: studentId } }),
            index_js_1.default.course.findUnique({ where: { id: courseId } }),
        ]);
        if (!student || !course) {
            return res.status(404).json({ error: 'Student or course not found' });
        }
        const certificate = await index_js_1.default.certificate.create({
            data: {
                studentId,
                courseId,
                certificateHash,
                status: 'issued',
            },
            include: {
                student: true,
                course: true,
            },
        });
        res.status(201).json(certificate);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
});
// PUT /api/certificates/:id - Update certificate status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, certificateHash } = req.body;
        const certificate = await index_js_1.default.certificate.update({
            where: { id },
            data: {
                status,
                certificateHash,
            },
            include: {
                student: true,
                course: true,
            },
        });
        res.json(certificate);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update certificate' });
    }
});
// DELETE /api/certificates/:id - Revoke a certificate
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await index_js_1.default.certificate.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to revoke certificate' });
    }
});
exports.default = router;
//# sourceMappingURL=certificates.js.map