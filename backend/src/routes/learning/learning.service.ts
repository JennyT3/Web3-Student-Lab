import prisma from '../../db/index.js';
import { getCurriculumForCourse } from './curriculum.data.js';
import { CurriculumCourse, Module, Progress, ProgressStatus, ProgressUpdateInput } from './types.js';

// Robust In-Memory Mock Store for Learning Progress (Demo Mode)
const mockProgress: Record<string, Progress> = {};
const mockCourses = [
  { id: 'course-1', title: 'Soroban Foundations', description: 'Build a mental model for Soroban contracts.', instructor: 'Satoshi N.', credits: 3 },
  { id: 'course-2', title: 'Stellar Network Basics', description: 'Learn how accounts and trustlines work.', instructor: 'Jed M.', credits: 4 },
  { id: 'course-3', title: 'Frontend Foundations', description: 'Build a Next.js app for Web3.', instructor: 'Denelle D.', credits: 5 },
];

const toProgress = (progress: any): Progress => ({
  ...progress,
  status: progress.status as ProgressStatus,
});

const filterModulesByDifficulty = (modules: Module[], difficulty?: string): Module[] => {
  if (!difficulty) {
    return modules;
  }

  return modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.difficulty === difficulty),
    }))
    .filter((module) => module.lessons.length > 0);
};

const countLessons = (modules: Module[]): number => {
  return modules.reduce((total, module) => total + module.lessons.length, 0);
};

const buildCourseStatus = (completedLessonCount: number, totalLessons: number): ProgressStatus => {
  if (completedLessonCount === 0) {
    return 'not_started';
  }

  if (totalLessons > 0 && completedLessonCount >= totalLessons) {
    return 'completed';
  }

  return 'in_progress';
};

const buildPercentage = (
  completedLessonCount: number,
  totalLessons: number,
  explicitPercentage?: number,
): number => {
  if (typeof explicitPercentage === 'number') {
    return explicitPercentage;
  }

  if (totalLessons === 0) {
    return 0;
  }

  return Math.round((completedLessonCount / totalLessons) * 100);
};

export const listCourses = async (difficulty?: string): Promise<CurriculumCourse[]> => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return courses.map((course) => ({
      ...course,
      modules: filterModulesByDifficulty(getCurriculumForCourse(course.id), difficulty),
    }));
  } catch (error) {
    console.warn('Prisma failed in listCourses, falling back to mock.');
    return mockCourses.map(course => ({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
      modules: filterModulesByDifficulty(getCurriculumForCourse(course.id), difficulty),
    }));
  }
};

export const getCourseCurriculum = async (
  courseId: string,
  difficulty?: string,
): Promise<CurriculumCourse | null> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      // Check mock
      const mockCourse = mockCourses.find(c => c.id === courseId);
      if (!mockCourse) return null;
      return {
        ...mockCourse,
        createdAt: new Date(),
        updatedAt: new Date(),
        modules: filterModulesByDifficulty(getCurriculumForCourse(mockCourse.id), difficulty),
      };
    }

    return {
      ...course,
      modules: filterModulesByDifficulty(getCurriculumForCourse(course.id), difficulty),
    };
  } catch (error) {
    const mockCourse = mockCourses.find(c => c.id === courseId);
    if (!mockCourse) return null;
    return {
      ...mockCourse,
      createdAt: new Date(),
      updatedAt: new Date(),
      modules: filterModulesByDifficulty(getCurriculumForCourse(mockCourse.id), difficulty),
    };
  }
};

export const getStudentProgress = async (
  studentId: string,
  courseId: string,
): Promise<Progress | null> => {
  try {
    const progress = await prisma.learningProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    return progress ? toProgress(progress) : (mockProgress[`${studentId}-${courseId}`] || null);
  } catch (error) {
    return mockProgress[`${studentId}-${courseId}`] || null;
  }
};

export const updateStudentProgress = async (
  studentId: string,
  courseId: string,
  input: ProgressUpdateInput,
): Promise<Progress> => {
  const modules = getCurriculumForCourse(courseId);
  const lesson = modules.flatMap((module) => module.lessons).find((entry) => entry.id === input.lessonId);

  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND');
  }

  const moduleForLesson = modules.find((module) =>
    module.lessons.some((entry) => entry.id === input.lessonId),
  );
  const totalLessons = countLessons(modules);
  const existingProgress = await getStudentProgress(studentId, courseId);

  const completedLessonSet = new Set(existingProgress?.completedLessons ?? []);

  if (input.status === 'completed') {
    completedLessonSet.add(input.lessonId);
  } else {
    completedLessonSet.delete(input.lessonId);
  }

  const completedLessons = Array.from(completedLessonSet);
  const percentage = buildPercentage(completedLessons.length, totalLessons, input.percentage);
  const status = buildCourseStatus(completedLessons.length, totalLessons);
  const completedAt = status === 'completed' ? new Date() : null;

  try {
    const progress = await prisma.learningProgress.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      update: {
        completedLessons,
        currentModuleId: moduleForLesson?.id ?? existingProgress?.currentModuleId ?? null,
        percentage,
        status,
        lastAccessedAt: new Date(),
        completedAt,
      },
      create: {
        studentId,
        courseId,
        completedLessons,
        currentModuleId: moduleForLesson?.id ?? null,
        percentage,
        status,
        lastAccessedAt: new Date(),
        completedAt,
      },
    });

    return toProgress(progress);
  } catch (error) {
    console.warn('Prisma failed in updateStudentProgress, falling back to mock.');
    const newProgress: Progress = {
      id: existingProgress?.id || `prog-${Date.now()}`,
      studentId,
      courseId,
      completedLessons,
      currentModuleId: moduleForLesson?.id ?? existingProgress?.currentModuleId ?? null,
      percentage,
      status,
      lastAccessedAt: new Date(),
      completedAt,
      createdAt: existingProgress?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    mockProgress[`${studentId}-${courseId}`] = newProgress;
    return newProgress;
  }
};
