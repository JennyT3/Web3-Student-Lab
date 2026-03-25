"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.getStudentById = exports.login = exports.register = exports.formatUserResponse = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = __importDefault(require("../db/index.js"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;
/**
 * Hash a password using bcrypt
 */
const hashPassword = async (password) => {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
/**
 * Compare a plain password with a hashed password
 */
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Generate a JWT token for a user
 */
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
/**
 * Verify a JWT token and return the decoded payload
 */
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
};
exports.verifyToken = verifyToken;
/**
 * Format a Student database record into a User response object
 */
const formatUserResponse = (student) => {
    return {
        id: student.id,
        email: student.email,
        name: `${student.firstName} ${student.lastName}`,
    };
};
exports.formatUserResponse = formatUserResponse;
/**
 * Register a new student
 */
const register = async (data) => {
    const { email, password, firstName, lastName } = data;
    // Check if student already exists
    const existingStudent = await index_js_1.default.student.findUnique({
        where: { email },
    });
    if (existingStudent) {
        throw new Error('Student with this email already exists');
    }
    // Hash the password
    const hashedPassword = await (0, exports.hashPassword)(password);
    // Create the student
    const student = await index_js_1.default.student.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
        },
    });
    // Generate token
    const token = (0, exports.generateToken)(student.id);
    return {
        user: (0, exports.formatUserResponse)(student),
        token,
    };
};
exports.register = register;
/**
 * Login a student
 */
const login = async (data) => {
    const { email, password } = data;
    // Find the student
    const student = await index_js_1.default.student.findUnique({
        where: { email },
    });
    if (!student) {
        throw new Error('Invalid credentials');
    }
    // Compare passwords
    const isPasswordValid = await (0, exports.comparePassword)(password, student.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }
    // Generate token
    const token = (0, exports.generateToken)(student.id);
    return {
        user: (0, exports.formatUserResponse)(student),
        token,
    };
};
exports.login = login;
/**
 * Get a student by ID
 */
const getStudentById = async (studentId) => {
    const student = await index_js_1.default.student.findUnique({
        where: { id: studentId },
    });
    if (!student) {
        return null;
    }
    return (0, exports.formatUserResponse)(student);
};
exports.getStudentById = getStudentById;
/**
 * Get the current authenticated user from a token
 */
const getCurrentUser = async (token) => {
    try {
        const decoded = (0, exports.verifyToken)(token);
        return (0, exports.getStudentById)(decoded.userId);
    }
    catch {
        return null;
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.service.js.map