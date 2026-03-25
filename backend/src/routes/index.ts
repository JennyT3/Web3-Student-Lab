import { Router } from 'express';
import dashboardRouter from '../dashboard/dashboard.routes.js';
import feedbackRouter from '../feedback/feedback.routes.js';
import certificatesRouter from './certificates.js';
import coursesRouter from './courses.js';
import enrollmentsRouter from './enrollments.js';
import studentsRouter from './students.js';

const router = Router();

// Mount all feature routers
router.use('/students', studentsRouter);
router.use('/courses', coursesRouter);
router.use('/certificates', certificatesRouter);
router.use('/enrollments', enrollmentsRouter);
router.use('/feedback', feedbackRouter);
router.use('/dashboard', dashboardRouter);

// Placeholder routes for future features
// These can be replaced with actual routers as features are developed
router.use('/blockchain', (req: any, res: any) => {
  res.json({ message: 'Blockchain feature - Full integration in progress' });
});

router.use('/generator', (req: any, res: any) => {
  res.json({ message: 'Generator feature - Coming soon' });
});

export default router;
