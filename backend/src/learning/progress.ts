import prisma from '../db/index.js';

/**
 * Represents a completed stage within a learning module.
 */
export interface CompletedStage {
  stageId: string;
  completedAt: string; // ISO 8601 timestamp
  moduleId: string;
}

/**
 * Student progress record with flexible stage tracking.
 * Designed to support future modules (courses, quizzes, projects, etc.)
 */
export interface StudentProgress {
  userId: string;
  completedLessons: string[];
  completedStages: CompletedStage[];
  currentModule: string;
  percentage: number;
  lastActivityAt: string;
}

/**
 * Options for recording a stage completion.
 */
export interface RecordStageInput {
  studentId: string;
  stageId: string;
  moduleId: string;
}

/**
 * Default progress for a student with no recorded activity.
 */
function defaultProgress(studentId: string): StudentProgress {
  return {
    userId: studentId,
    completedLessons: [],
    completedStages: [],
    currentModule: 'mod-1',
    percentage: 0,
    lastActivityAt: new Date().toISOString(),
  };
}

/**
 * Retrieve a student's learning progress from the database.
 * Returns default progress if no record exists yet.
 */
export async function getProgress(studentId: string): Promise<StudentProgress> {
  const record = await prisma.learningProgress.findUnique({
    where: { userId: studentId },
  });

  if (!record) {
    return defaultProgress(studentId);
  }

  return {
    userId: record.userId,
    completedLessons: record.completedLessons,
    completedStages: parseStages(record.completedLessons),
    currentModule: record.currentModule,
    percentage: record.percentage,
    lastActivityAt: record.updatedAt.toISOString(),
  };
}

/**
 * Record a completed stage for a student.
 * Idempotent — re-completing the same stage is a no-op.
 * Recalculates percentage based on totalLessons provided.
 */
export async function recordStageCompletion(
  input: RecordStageInput,
  totalLessons: number,
): Promise<StudentProgress> {
  const { studentId, stageId, moduleId } = input;

  const existing = await prisma.learningProgress.findUnique({
    where: { userId: studentId },
  });

  let completedLessons = existing ? [...existing.completedLessons] : [];

  // Idempotent: skip if already completed
  if (completedLessons.includes(stageId)) {
    return {
      userId: studentId,
      completedLessons,
      completedStages: parseStages(completedLessons),
      currentModule: existing?.currentModule ?? moduleId,
      percentage: existing?.percentage ?? 0,
      lastActivityAt: existing?.updatedAt.toISOString() ?? new Date().toISOString(),
    };
  }

  completedLessons.push(stageId);
  const percentage =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100)) : 0;

  const record = await prisma.learningProgress.upsert({
    where: { userId: studentId },
    update: {
      completedLessons,
      currentModule: moduleId,
      percentage,
    },
    create: {
      userId: studentId,
      completedLessons,
      currentModule: moduleId,
      percentage,
    },
  });

  return {
    userId: record.userId,
    completedLessons: record.completedLessons,
    completedStages: parseStages(record.completedLessons),
    currentModule: record.currentModule,
    percentage: record.percentage,
    lastActivityAt: record.updatedAt.toISOString(),
  };
}

/**
 * Reset a student's progress entirely.
 * Returns the deleted record or null if none existed.
 */
export async function resetProgress(studentId: string): Promise<StudentProgress> {
  try {
    await prisma.learningProgress.delete({
      where: { userId: studentId },
    });
  } catch {
    // Record didn't exist — that's fine
  }
  return defaultProgress(studentId);
}

/**
 * Derive structured CompletedStage entries from flat lesson ID strings.
 * Maps lesson IDs to their parent modules using a simple convention:
 *   lesson-1, lesson-2 → mod-1 ; lesson-3, lesson-4 → mod-2 ; etc.
 * This keeps backward compatibility while enabling richer queries later.
 */
function parseStages(lessonIds: string[]): CompletedStage[] {
  return lessonIds.map((id) => ({
    stageId: id,
    completedAt: new Date().toISOString(),
    moduleId: inferModuleId(id),
  }));
}

/**
 * Infer the module ID from a lesson ID.
 * Convention: lesson-1..lesson-2 → mod-1, lesson-3..lesson-4 → mod-2, etc.
 * Falls back to 'mod-1' for unrecognised IDs.
 */
function inferModuleId(lessonId: string): string {
  const match = lessonId.match(/lesson-(\d+)/);
  if (!match) return 'mod-1';
  const num = parseInt(match[1], 10);
  return `mod-${Math.ceil(num / 2)}`;
}
