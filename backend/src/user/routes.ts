import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile (placeholder)
 * @access  Public (TODO: Add authentication)
 */
router.get('/profile', (_req: Request, res: Response) => {
  // Placeholder response - will be replaced with actual user data from auth
  res.json({
    id: 'placeholder-id',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
    createdAt: new Date().toISOString(),
  });
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update current user profile (placeholder)
 * @access  Public (TODO: Add authentication)
 */
router.put('/profile', (req: Request, res: Response) => {
  // Placeholder response - will be replaced with actual update logic
  const { email, firstName, lastName } = req.body;

  res.json({
    id: 'placeholder-id',
    email: email || 'user@example.com',
    firstName: firstName || 'John',
    lastName: lastName || 'Doe',
    role: 'student',
    updatedAt: new Date().toISOString(),
  });
});

export default router;
