"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_service_js_1 = require("./dashboard.service.js");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/dashboard/:studentId
 * @desc    Get accurate student profile and achievements aggregated from all modules
 * @access  Public (should apply auth globally later)
 */
router.get('/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        if (!studentId) {
            res.status(400).json({ error: 'Student ID is required' });
            return;
        }
        // Unified student profile view across Learning, Blockchain, Token
        const dashboard = await (0, dashboard_service_js_1.getStudentDashboard)(studentId);
        res.json(dashboard);
    }
    catch (error) {
        if (error.message === 'Student not found') {
            res.status(404).json({ error: 'Student Profile not found' });
        }
        else {
            res.status(500).json({ error: 'Internal server error while fetching dashboard' });
        }
    }
});
// Modular route export
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map