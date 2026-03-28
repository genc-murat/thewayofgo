import { getCompletedLessons, getCompletedExercises, getWeakAreas } from './progressDb';
import { getAllLessonIds, LESSONS_PER_LEVEL } from '../data/curriculum';

export interface LessonNode {
  id: string;
  title: string;
  level: number;
  module: number;
  lesson: number;
  completed: boolean;
  locked: boolean;
  nextLessons: string[];
  requiredExercise: string | null;
}

/**
 * Level advancement requirements.
 * To advance from level N to N+1:
 * - Complete at least `min_lessons_pct` % of lessons in the level
 * - Complete at least `min_exercises` exercises (any correctness)
 * - Average accuracy >= `min_accuracy_pct` %
 */
export const LEVEL_REQUIREMENTS: Record<number, {
  name: string;
  min_lessons_pct: number;
  min_exercises: number;
  min_accuracy_pct: number;
}> = {
  1: { name: 'Başlangıç', min_lessons_pct: 70, min_exercises: 5, min_accuracy_pct: 50 },
  2: { name: 'Temel Teknikler', min_lessons_pct: 70, min_exercises: 8, min_accuracy_pct: 55 },
  3: { name: 'Orta Seviye', min_lessons_pct: 70, min_exercises: 10, min_accuracy_pct: 60 },
  4: { name: 'İleri Seviye', min_lessons_pct: 75, min_exercises: 12, min_accuracy_pct: 65 },
  5: { name: 'Uzman', min_lessons_pct: 80, min_exercises: 15, min_accuracy_pct: 70 },
  6: { name: 'Usta', min_lessons_pct: 80, min_exercises: 20, min_accuracy_pct: 75 },
};

/**
 * Get the next recommended lesson for the user.
 * Follows the actual curriculum order from curriculum.ts.
 */
export async function getNextRecommendedLesson(): Promise<{
  lessonId: string;
  title: string;
  level: number;
  isNextLesson: boolean;
} | null> {
  const completedLessons = await getCompletedLessons();
  const allLessons = getAllLessonIds();

  // Find the first uncompleted lesson
  for (const id of allLessons) {
    if (!completedLessons.has(id)) {
      return {
        lessonId: id,
        title: `${id}`,
        level: parseInt(id.split('-')[0].replace('l', '')),
        isNextLesson: true,
      };
    }
  }

  // All lessons completed
  return null;
}

/**
 * Check if a lesson is unlocked based on prerequisites.
 */
export async function isLessonUnlocked(
  _lessonId: string,
  prerequisites: string[]
): Promise<boolean> {
  if (prerequisites.length === 0) return true;

  const completedLessons = await getCompletedLessons();
  return prerequisites.every(prereq => completedLessons.has(prereq));
}

/**
 * Get level progress as a percentage.
 */
export async function getLevelProgress(level: number): Promise<number> {
  const completedLessons = await getCompletedLessons();
  const totalLessons = LESSONS_PER_LEVEL[level] ?? 30;

  let completed = 0;
  for (const lessonId of completedLessons) {
    const lvl = parseInt(lessonId.split('-')[0].replace('l', ''));
    if (lvl === level) completed++;
  }

  return Math.min(100, Math.round((completed / totalLessons) * 100));
}

/**
 * Get overall progress data for display.
 */
export async function getOverallProgress(): Promise<{
  lessonsCompleted: number;
  exercisesCorrect: number;
  currentLevel: number;
  levelProgress: Record<number, number>;
}> {
  const completedLessons = await getCompletedLessons();
  const completedExercises = await getCompletedExercises();

  // Determine current level
  let currentLevel = 1;
  for (let lvl = 2; lvl <= 6; lvl++) {
    const req = LEVEL_REQUIREMENTS[lvl - 1];
    const prevLevelLessons = LESSONS_PER_LEVEL[lvl - 1] ?? 30;
    let completedInPrev = 0;
    for (const lessonId of completedLessons) {
      const l = parseInt(lessonId.split('-')[0].replace('l', ''));
      if (l === lvl - 1) completedInPrev++;
    }
    const pct = prevLevelLessons > 0 ? (completedInPrev / prevLevelLessons) * 100 : 0;
    if (pct >= req.min_lessons_pct) {
      currentLevel = lvl;
    } else {
      break;
    }
  }

  // Level progress
  const levelProgress: Record<number, number> = {};
  for (let lvl = 1; lvl <= 6; lvl++) {
    levelProgress[lvl] = await getLevelProgress(lvl);
  }

  return {
    lessonsCompleted: completedLessons.size,
    exercisesCorrect: completedExercises.size,
    currentLevel,
    levelProgress,
  };
}

/**
 * Get adaptive next lesson based on weak areas.
 * Prioritizes lessons related to weak exercise types.
 */
export async function getAdaptiveNextLesson(): Promise<{
  lessonId: string;
  title: string;
  level: number;
  isNextLesson: boolean;
  reason?: string;
} | null> {
  const weakAreas = await getWeakAreas();
  const focusTypes = weakAreas
    .filter(w => w.accuracy < 60 && w.total_attempts >= 2)
    .slice(0, 3)
    .map(w => w.exercise_type);

  if (focusTypes.length > 0) {
    const completed = await getCompletedLessons();
    const allLessons = getAllLessonIds();

    // Prioritize lessons in the current level that relate to weak types
    for (const id of allLessons) {
      if (!completed.has(id)) {
        return {
          lessonId: id,
          title: `${id}`,
          level: parseInt(id.split('-')[0].replace('l', '')),
          isNextLesson: true,
          reason: `Zayıf alan: ${focusTypes[0]}`,
        };
      }
    }
  }

  // Fallback to normal ordering
  return getNextRecommendedLesson();
}
