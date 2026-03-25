"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = __importDefault(require("../db/index.js"));
const router = (0, express_1.Router)();
// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await index_js_1.default.course.findMany({
            include: {
                enrollments: true,
                certificates: true,
            },
        });
        res.json(courses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});
// GET /api/courses/:id - Get course by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await index_js_1.default.course.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        student: true,
                    },
                },
                certificates: {
                    include: {
                        student: true,
                    },
                },
            },
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});
// POST /api/courses - Create a new course
router.post('/', async (req, res) => {
    try {
        const { title, description, instructor, credits } = req.body;
        if (!title || !instructor) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const course = await index_js_1.default.course.create({
            data: {
                title,
                description,
                instructor,
                credits: credits || 3,
            },
        });
        res.status(201).json(course);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
});
// PUT /api/courses/:id - Update a course
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, instructor, credits } = req.body;
        const course = await index_js_1.default.course.update({
            where: { id },
            data: {
                title,
                description,
                instructor,
                credits,
            },
        });
        res.json(course);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update course' });
    }
});
// DELETE /api/courses/:id - Delete a course
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await index_js_1.default.course.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete course' });
    }
});
exports.default = router;
//# sourceMappingURL=courses.js.map