import { Progress } from './types.js';

// Mock user progress storage (keeping consistency with existing routes)
const userProgress: Map<string, Progress> = new Map();

/**
 * Service to manage student progress in the learning platform.
 */
export const getStudentProgress = async (studentId: string): Promise<Progress> => {
  const progress = userProgress.get(studentId);

  if (!progress) {
    // Return default progress if user has no progress yet
    return {
      userId: studentId,
      completedLessons: [],
      currentModule: 'mod-1',
      percentage: 0,
    };
  }

  return progress;
};

// In real app, this logic would move from learning.routes.ts to here
export const updateProgress = async (studentId: string, lessonId: string): Promise<Progress> => {
  // Logic from routes/learning/learning.routes.ts
  let progress = userProgress.get(studentId) || {
    userId: studentId,
    completedLessons: [],
    currentModule: 'mod-1',
    percentage: 0,
  };

  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    // Calculation simplified here
    progress.percentage = Math.min(100, Math.round((progress.completedLessons.length / 10) * 100));
  }

  userProgress.set(studentId, progress);
  return progress;
};
