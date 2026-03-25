import { Progress } from './types.js';
/**
 * Service to manage student progress in the learning platform.
 */
export declare const getStudentProgress: (studentId: string) => Promise<Progress>;
export declare const updateProgress: (studentId: string, lessonId: string) => Promise<Progress>;
//# sourceMappingURL=learning.service.d.ts.map