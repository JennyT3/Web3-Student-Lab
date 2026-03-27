import { Router, Request, Response } from 'express';
import { authenticate } from '../../auth/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../utils/validation.js';
import {
  getCourseCurriculum,
  getStudentProgress,
  listCourses,
  updateStudentProgress,
} from './learning.service.js';
import {
  courseParamsSchema,
  coursesQuerySchema,
  progressUpdateSchema,
} from './validation.schemas.js';

const router = Router();

router.get(
  '/courses',
  validateQuery(coursesQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;
      const courses = await listCourses(difficulty);
      res.json({ courses });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

router.get(
  '/courses/:courseId',
  validateParams(courseParamsSchema),
  validateQuery(coursesQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;
      const course = await getCourseCurriculum(courseId, difficulty);

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json({ course });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

router.get(
  '/courses/:courseId/progress',
  authenticate,
  validateParams(courseParamsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const course = await getCourseCurriculum(courseId);

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const progress = await getStudentProgress(req.user!.id, courseId);

      if (!progress) {
        res.json({
          progress: {
            studentId: req.user!.id,
            courseId,
            completedLessons: [],
            currentModuleId: course.modules[0]?.id ?? null,
            percentage: 0,
            status: 'not_started',
            lastAccessedAt: null,
            completedAt: null,
          },
        });
        return;
      }

      res.json({ progress });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

router.patch(
  '/courses/:courseId/progress',
  authenticate,
  validateParams(courseParamsSchema),
  validateBody(progressUpdateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.courseId as string;
      const course = await getCourseCurriculum(courseId);

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const progress = await updateStudentProgress(req.user!.id, courseId, req.body);
      res.json({ progress });
    } catch (error) {
      if (error instanceof Error && error.message === 'LESSON_NOT_FOUND') {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
