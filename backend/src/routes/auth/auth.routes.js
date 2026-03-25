"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_js_1 = require("../../auth/auth.service.js");
const auth_middleware_js_1 = require("../../auth/auth.middleware.js");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        // Validation
        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        // Register the student
        const authResponse = await (0, auth_service_js_1.register)({ email, password, firstName, lastName });
        res.status(201).json(authResponse);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Student with this email already exists') {
            res.status(409).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * @route   POST /api/auth/login
 * @desc    Login student
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Login the student
        const authResponse = await (0, auth_service_js_1.login)({ email, password });
        res.json(authResponse);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Invalid credentials') {
            res.status(401).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated student
 * @access  Private
 */
router.get('/me', auth_middleware_js_1.authenticate, (req, res) => {
    // User is attached to request by authenticate middleware
    res.json({ user: req.user });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map