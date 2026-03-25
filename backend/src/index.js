"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_js_1 = __importDefault(require("./routes/auth/auth.routes.js"));
const learning_routes_js_1 = __importDefault(require("./routes/learning/learning.routes.js"));
const requestLogger_js_1 = require("./middleware/requestLogger.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const index_js_2 = __importDefault(require("./db/index.js"));
dotenv_1.default.config();
exports.app = (0, express_1.default)();
const port = process.env.PORT || 8080;
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use(requestLogger_js_1.requestLogger);
// Health check endpoint
exports.app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Web3 Student Lab Backend is running' });
});
// API Routes
exports.app.use('/api/auth', auth_routes_js_1.default);
exports.app.use('/api/learning', learning_routes_js_1.default);
exports.app.use('/api', index_js_1.default);
// Start server only if not in test environment
let server = null;
if (process.env.NODE_ENV !== 'test') {
    server = exports.app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down gracefully...');
        await index_js_2.default.$disconnect();
        server?.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
    process.on('SIGTERM', async () => {
        console.log('\nShutting down gracefully...');
        await index_js_2.default.$disconnect();
        server?.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}
//# sourceMappingURL=index.js.map