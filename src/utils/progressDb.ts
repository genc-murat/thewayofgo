import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  return db;
}

export interface ExerciseProgressRecord {
  exercise_id: string;
  completed: boolean;
  correct: boolean;
  attempts: number;
  best_time_seconds: number | null;
}

export interface LessonProgressRecord {
  lesson_id: string;
  completed: boolean;
  stars: number;
  attempts: number;
}

export interface UserStatsData {
  total_lessons_completed: number;
  total_exercises_completed: number;
  total_exercises_correct: number;
  total_stars: number;
  current_level: number;
}

export interface WeakArea {
  exercise_type: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
}

export interface ExerciseStatsByType {
  exercise_id: string;
  exercise_type: string;
  correct: boolean;
  attempts: number;
}

export async function recordExerciseAttempt(
  exerciseId: string,
  exerciseType: string,
  correct: boolean,
  timeSeconds: number
): Promise<void> {
  const database = await getDb();

  // Upsert exercise_progress
  const existing = await database.select<ExerciseProgressRecord[]>(
    'SELECT exercise_id, completed, correct, attempts, best_time_seconds FROM exercise_progress WHERE exercise_id = $1',
    [exerciseId]
  );

  if (existing.length > 0) {
    const current = existing[0];
    const newAttempts = current.attempts + 1;
    const newCompleted = correct ? true : current.completed;
    const newCorrect = correct ? true : current.correct;
    const newBestTime = correct
      ? (current.best_time_seconds
          ? Math.min(current.best_time_seconds, timeSeconds)
          : timeSeconds)
      : current.best_time_seconds;

    await database.execute(
      `UPDATE exercise_progress 
       SET completed = $1, correct = $2, attempts = $3, best_time_seconds = $4, last_attempt = datetime('now')
       WHERE exercise_id = $5`,
      [newCompleted, newCorrect, newAttempts, newBestTime, exerciseId]
    );
  } else {
    await database.execute(
      `INSERT INTO exercise_progress (exercise_id, completed, correct, attempts, best_time_seconds, last_attempt)
       VALUES ($1, $2, $3, 1, $4, datetime('now'))`,
      [exerciseId, correct, correct, correct ? timeSeconds : null]
    );
  }

  // Also store exercise type info for weak area analysis
  // We use a separate table that we create lazily
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS exercise_type_stats (
        exercise_id TEXT NOT NULL,
        exercise_type TEXT NOT NULL,
        correct BOOLEAN NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 1,
        last_attempt TEXT
      )`
    );

    await database.execute(
      `INSERT INTO exercise_type_stats (exercise_id, exercise_type, correct, attempts, last_attempt)
       VALUES ($1, $2, $3, 1, datetime('now'))`,
      [exerciseId, exerciseType, correct]
    );
  } catch {
    // Table creation or insert failed, non-critical
  }

  // Update daily goals
  const today = new Date().toISOString().split('T')[0];
  try {
    await database.execute(
      `INSERT INTO daily_goals (date, target_minutes, actual_minutes, exercises_completed, lessons_completed)
       VALUES ($1, 20, 0, 1, 0)
       ON CONFLICT(date) DO UPDATE SET exercises_completed = exercises_completed + 1`,
      [today]
    );
  } catch {
    // Non-critical
  }
}

export async function recordLessonCompletion(
  lessonId: string,
  stars: number,
  timeSeconds: number
): Promise<void> {
  const database = await getDb();

  const existing = await database.select<LessonProgressRecord[]>(
    'SELECT lesson_id, completed, stars, attempts FROM user_progress WHERE lesson_id = $1',
    [lessonId]
  );

  if (existing.length > 0) {
    const current = existing[0];
    const newAttempts = current.attempts + 1;
    const newStars = Math.max(current.stars, stars);
    await database.execute(
      `UPDATE user_progress 
       SET completed = 1, stars = $1, attempts = $2, last_attempt = datetime('now')
       WHERE lesson_id = $3`,
      [newStars, newAttempts, lessonId]
    );
  } else {
    await database.execute(
      `INSERT INTO user_progress (lesson_id, completed, stars, attempts, best_time_seconds, last_attempt)
       VALUES ($1, 1, $2, 1, $3, datetime('now'))`,
      [lessonId, stars, timeSeconds]
    );
  }

  // Update daily goals
  const today = new Date().toISOString().split('T')[0];
  try {
    await database.execute(
      `INSERT INTO daily_goals (date, target_minutes, actual_minutes, exercises_completed, lessons_completed)
       VALUES ($1, 20, 0, 0, 1)
       ON CONFLICT(date) DO UPDATE SET lessons_completed = lessons_completed + 1`,
      [today]
    );
  } catch {
    // Non-critical
  }
}

export async function getUserStats(): Promise<UserStatsData> {
  const database = await getDb();

  const lessonsResult = await database.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM user_progress WHERE completed = 1'
  );

  const exercisesResult = await database.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM exercise_progress WHERE completed = 1'
  );

  const correctResult = await database.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM exercise_progress WHERE correct = 1'
  );

  const starsResult = await database.select<{ total: number }[]>(
    'SELECT COALESCE(SUM(stars), 0) as total FROM user_progress'
  );

  return {
    total_lessons_completed: lessonsResult[0]?.count ?? 0,
    total_exercises_completed: exercisesResult[0]?.count ?? 0,
    total_exercises_correct: correctResult[0]?.count ?? 0,
    total_stars: starsResult[0]?.total ?? 0,
    current_level: 1,
  };
}

export async function getExerciseProgress(exerciseId: string): Promise<ExerciseProgressRecord | null> {
  const database = await getDb();
  const result = await database.select<ExerciseProgressRecord[]>(
    'SELECT exercise_id, completed, correct, attempts, best_time_seconds FROM exercise_progress WHERE exercise_id = $1',
    [exerciseId]
  );
  return result[0] ?? null;
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgressRecord | null> {
  const database = await getDb();
  const result = await database.select<LessonProgressRecord[]>(
    'SELECT lesson_id, completed, stars, attempts FROM user_progress WHERE lesson_id = $1',
    [lessonId]
  );
  return result[0] ?? null;
}

export async function getCompletedLessons(): Promise<Set<string>> {
  const database = await getDb();
  const results = await database.select<{ lesson_id: string }[]>(
    'SELECT lesson_id FROM user_progress WHERE completed = 1'
  );
  return new Set(results.map(r => r.lesson_id));
}

export async function getCompletedExercises(): Promise<Set<string>> {
  const database = await getDb();
  const results = await database.select<{ exercise_id: string }[]>(
    'SELECT exercise_id FROM exercise_progress WHERE correct = 1'
  );
  return new Set(results.map(r => r.exercise_id));
}

export async function getWeakAreas(): Promise<WeakArea[]> {
  const database = await getDb();

  try {
    const results = await database.select<ExerciseStatsByType[]>(
      `SELECT exercise_id, exercise_type, correct, attempts FROM exercise_type_stats`
    );

    const typeStats = new Map<string, { total: number; correct: number }>();

    for (const row of results) {
      const key = row.exercise_type;
      const existing = typeStats.get(key) ?? { total: 0, correct: 0 };
      existing.total += row.attempts;
      if (row.correct) existing.correct += 1;
      typeStats.set(key, existing);
    }

    const areas: WeakArea[] = [];
    for (const [exerciseType, stats] of typeStats) {
      areas.push({
        exercise_type: exerciseType,
        total_attempts: stats.total,
        correct_attempts: stats.correct,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      });
    }

    areas.sort((a, b) => a.accuracy - b.accuracy);
    return areas;
  } catch {
    return [];
  }
}

export async function getStreak(): Promise<{ current: number; best: number }> {
  const database = await getDb();

  const results = await database.select<{ date: string }[]>(
    'SELECT date FROM daily_goals WHERE exercises_completed > 0 OR lessons_completed > 0 ORDER BY date DESC'
  );

  if (results.length === 0) return { current: 0, best: 0 };

  let current = 1;
  let best = 1;
  let prevDate = new Date(results[0].date);

  for (let i = 1; i < results.length; i++) {
    const currentDate = new Date(results[i].date);
    const diff = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diff > 1) {
      break;
    }
    prevDate = currentDate;
  }

  return { current, best: Math.max(current, best) };
}

export async function getDailyProgress(): Promise<{ exercises: number; lessons: number }> {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];

  const result = await database.select<{ exercises_completed: number; lessons_completed: number }[]>(
    'SELECT exercises_completed, lessons_completed FROM daily_goals WHERE date = $1',
    [today]
  );

  if (result.length === 0) return { exercises: 0, lessons: 0 };
  return {
    exercises: result[0].exercises_completed,
    lessons: result[0].lessons_completed,
  };
}
