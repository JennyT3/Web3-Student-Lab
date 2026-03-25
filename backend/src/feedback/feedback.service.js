"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseRatingSummary = exports.deleteFeedback = exports.updateFeedback = exports.getFeedbackByStudentAndCourse = exports.getFeedbackByCourse = exports.createFeedback = exports.formatFeedbackResponse = void 0;
const index_js_1 = __importDefault(require("../db/index.js"));
const MIN_RATING = 1;
const MAX_RATING = 5;
/**
 * Validate rating value
 */
const validateRating = (rating) => {
    if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
        throw new Error(`Rating must be an integer between ${MIN_RATING} and ${MAX_RATING}`);
    }
};
/**
 * Format a feedback database record into a response object
 */
const formatFeedbackResponse = (feedback) => {
    const response = {
        id: feedback.id,
        studentId: feedback.studentId,
        courseId: feedback.courseId,
        rating: feedback.rating,
        review: feedback.review,
        createdAt: feedback.createdAt.toISOString(),
        updatedAt: feedback.updatedAt.toISOString(),
    };
    // Include student info if available
    if ('student' in feedback && feedback.student) {
        response.student = {
            id: feedback.student.id,
            name: `${feedback.student.firstName} ${feedback.student.lastName}`,
            email: feedback.student.email,
        };
    }
    return response;
};
exports.formatFeedbackResponse = formatFeedbackResponse;
/**
 * Create new feedback for a course
 */
const createFeedback = async (studentId, data) => {
    const { courseId, rating, review } = data;
    // Validate rating
    validateRating(rating);
    // Validate review length if provided
    if (review && review.length > 1000) {
        throw new Error('Review must be less than 1000 characters');
    }
    // Check if course exists
    const course = await index_js_1.default.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    // Check if student is enrolled in the course
    const enrollment = await index_js_1.default.enrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });
    if (!enrollment) {
        throw new Error('Student must be enrolled in the course to submit feedback');
    }
    // Create or update feedback (upsert)
    const feedback = await index_js_1.default.feedback.upsert({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
        update: {
            rating,
            review: review || null,
        },
        create: {
            studentId,
            courseId,
            rating,
            review: review || null,
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    return (0, exports.formatFeedbackResponse)(feedback);
};
exports.createFeedback = createFeedback;
/**
 * Get all feedback for a specific course
 */
const getFeedbackByCourse = async (courseId) => {
    // Check if course exists
    const course = await index_js_1.default.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    const feedback = await index_js_1.default.feedback.findMany({
        where: { courseId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return feedback.map(exports.formatFeedbackResponse);
};
exports.getFeedbackByCourse = getFeedbackByCourse;
/**
 * Get feedback by a specific student for a specific course
 */
const getFeedbackByStudentAndCourse = async (studentId, courseId) => {
    const feedback = await index_js_1.default.feedback.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    if (!feedback) {
        return null;
    }
    return (0, exports.formatFeedbackResponse)(feedback);
};
exports.getFeedbackByStudentAndCourse = getFeedbackByStudentAndCourse;
/**
 * Update existing feedback
 */
const updateFeedback = async (studentId, courseId, data) => {
    const { rating, review } = data;
    // Validate rating if provided
    if (rating !== undefined) {
        validateRating(rating);
    }
    // Validate review length if provided
    if (review && review.length > 1000) {
        throw new Error('Review must be less than 1000 characters');
    }
    // Check if feedback exists
    const existingFeedback = await index_js_1.default.feedback.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });
    if (!existingFeedback) {
        throw new Error('Feedback not found');
    }
    const feedback = await index_js_1.default.feedback.update({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
        data: {
            ...(rating !== undefined && { rating }),
            ...(review !== undefined && { review: review || null }),
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    return (0, exports.formatFeedbackResponse)(feedback);
};
exports.updateFeedback = updateFeedback;
/**
 * Delete feedback
 */
const deleteFeedback = async (studentId, courseId) => {
    // Check if feedback exists
    const existingFeedback = await index_js_1.default.feedback.findUnique({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });
    if (!existingFeedback) {
        throw new Error('Feedback not found');
    }
    await index_js_1.default.feedback.delete({
        where: {
            studentId_courseId: {
                studentId,
                courseId,
            },
        },
    });
};
exports.deleteFeedback = deleteFeedback;
/**
 * Get rating summary for a course
 */
const getCourseRatingSummary = async (courseId) => {
    // Check if course exists
    const course = await index_js_1.default.course.findUnique({
        where: { id: courseId },
    });
    if (!course) {
        throw new Error('Course not found');
    }
    const feedback = await index_js_1.default.feedback.findMany({
        where: { courseId },
        select: { rating: true },
    });
    const totalReviews = feedback.length;
    if (totalReviews === 0) {
        return {
            courseId,
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    const averageRating = sum / totalReviews;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((f) => {
        distribution[f.rating]++;
    });
    return {
        courseId,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution: distribution,
    };
};
exports.getCourseRatingSummary = getCourseRatingSummary;
//# sourceMappingURL=feedback.service.js.map