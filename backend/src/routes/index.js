"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_routes_js_1 = __importDefault(require("../dashboard/dashboard.routes.js"));
const feedback_routes_js_1 = __importDefault(require("../feedback/feedback.routes.js"));
const certificates_js_1 = __importDefault(require("./certificates.js"));
const courses_js_1 = __importDefault(require("./courses.js"));
const enrollments_js_1 = __importDefault(require("./enrollments.js"));
const students_js_1 = __importDefault(require("./students.js"));
const router = (0, express_1.Router)();
// Mount all feature routers
router.use('/students', students_js_1.default);
router.use('/courses', courses_js_1.default);
router.use('/certificates', certificates_js_1.default);
router.use('/enrollments', enrollments_js_1.default);
router.use('/feedback', feedback_routes_js_1.default);
router.use('/dashboard', dashboard_routes_js_1.default);
// Placeholder routes for future features
// These can be replaced with actual routers as features are developed
router.use('/blockchain', (req, res) => {
    res.json({ message: 'Blockchain feature - Full integration in progress' });
});
router.use('/generator', (req, res) => {
    res.json({ message: 'Generator feature - Coming soon' });
});
exports.default = router;
//# sourceMappingURL=index.js.map