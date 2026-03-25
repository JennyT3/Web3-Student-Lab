"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const auth_service_js_1 = require("./auth.service.js");
/**
 * Middleware to authenticate requests using JWT token
 * Expects Authorization header with format: "Bearer <token>"
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authorization token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }
        // Verify the token
        const decoded = (0, auth_service_js_1.verifyToken)(token);
        // Get the user from database
        const user = await (0, auth_service_js_1.getStudentById)(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        // Verify the token
        const decoded = (0, auth_service_js_1.verifyToken)(token);
        // Get the user from database
        const user = await (0, auth_service_js_1.getStudentById)(decoded.userId);
        if (user) {
            req.user = user;
        }
        next();
    }
    catch {
        // Continue without user if token is invalid
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map