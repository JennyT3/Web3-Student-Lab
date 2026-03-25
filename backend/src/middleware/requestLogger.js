"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
/**
 * Request Logger Middleware
 * Logs HTTP method, URL, and timestamp for each incoming request
 */
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    console.log(`[${timestamp}] ${method} ${url}`);
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map