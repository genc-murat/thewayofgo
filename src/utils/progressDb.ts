import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;
let dbInitialized = false;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  if (!dbInitialized) {
    await initDB(db);
    dbInitialized = true;
  }
  return db;
}

async function initDB(database: Database): Promise<void> {
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS exercise_type_stats (
        exercise_id TEXT NOT NULL,
        exercise_type TEXT NOT NULL,
        correct BOOLEAN NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 1,
        last_attempt TEXT,
        UNIQUE(exercise_id, last_attempt)
      )`
    );
  } catch (err) {
    console.warn('[progressDb] initDB failed:', err);
  }
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

  // Store exercise type info for weak area analysis
  try {
    await database.execute(
      `INSERT INTO exercise_type_stats (exercise_id, exercise_type, correct, attempts, last_attempt)
       VALUES ($1, $2, $3, 1, datetime('now'))`,
      [exerciseId, exerciseType, correct]
    );
  } catch (err) {
    console.warn('[progressDb] exercise_type_stats insert failed:', err);
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
  } catch (err) {
    console.warn('[progressDb] daily_goals update failed:', err);
  }

  // Sync to SRS (awaited)
  try {
    const { syncExerciseToSRS, recordSRSCardResult } = await import('./srs');
    await syncExerciseToSRS(exerciseId, exerciseType);
    await recordSRSCardResult(exerciseId, correct);
  } catch (err) {
    console.warn('[progressDb] SRS sync failed:', err);
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
  } catch (err) {
    console.warn('[progressDb] daily_goals update for lesson failed:', err);
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
      existing.total += 1;
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
  } catch (err) {
    console.warn('[progressDb] getWeakAreas failed:', err);
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

export async function getDailyActivityHeatmap(days: number = 365): Promise<{ date: string; count: number }[]> {
  const database = await getDb();
  try {
    const results = await database.select<{ date: string; count: number }[]>(
      `SELECT date, COALESCE(exercises_completed, 0) + COALESCE(lessons_completed, 0) as count FROM daily_goals ORDER BY date DESC LIMIT $1`,
      [days]
    );
    return results as { date: string; count: number }[];
  } catch (err) {
    console.warn('[progressDb] getDailyActivityHeatmap failed:', err);
    return [];
  }
}

export interface MistakeExercise {
  exercise_id: string;
  exercise_type: string;
  attempts: number;
  last_attempt: string;
}

export async function getMistakeExercises(limit: number = 20): Promise<MistakeExercise[]> {
  const database = await getDb();
  try {
    return await database.select<MistakeExercise[]>(
      `SELECT exercise_id, exercise_type, COUNT(*) as attempts, MAX(last_attempt) as last_attempt
       FROM exercise_type_stats
       WHERE correct = 0
       GROUP BY exercise_id
       ORDER BY attempts DESC, last_attempt DESC
       LIMIT $1`,
      [limit]
    );
  } catch (err) {
    console.warn('[progressDb] getMistakeExercises failed:', err);
    return [];
  }
}

export interface ExerciseAttempt {
  exercise_id: string;
  exercise_type: string;
  correct: boolean;
  attempts: number;
  last_attempt: string;
}

export async function getExerciseHistory(exerciseId: string, limit: number = 5): Promise<ExerciseAttempt[]> {
  const database = await getDb();
  try {
    return await database.select<ExerciseAttempt[]>(
      `SELECT exercise_id, exercise_type, correct, attempts, last_attempt
       FROM exercise_type_stats
       WHERE exercise_id = $1
       ORDER BY last_attempt DESC
       LIMIT $2`,
      [exerciseId, limit]
    );
  } catch (err) {
    console.warn('[progressDb] getExerciseHistory failed:', err);
    return [];
  }
}

export async function getAccuracyOverTime(days: number = 30): Promise<{ date: string; accuracy: number }[]> {
  const database = await getDb();
  try {
    const results = await database.select<{ date: string; total: number; correct: number }[]>(
      `SELECT DATE(last_attempt) as date,
              COUNT(*) as total,
              SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct
       FROM exercise_type_stats
       WHERE last_attempt >= DATE('now', '-' || $1 || ' days')
       GROUP BY DATE(last_attempt)
       ORDER BY date ASC`,
      [days]
    );
    return results.map(r => ({
      date: r.date,
      accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
    }));
  } catch (err) {
    console.warn('[progressDb] getAccuracyOverTime failed:', err);
    return [];
  }
}

export interface Bookmark {
  item_id: string;
  item_type: string;
  created_at: string;
  note: string | null;
}

export async function addBookmark(itemId: string, itemType: 'exercise' | 'lesson', note?: string): Promise<void> {
  const database = await getDb();
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS bookmarks (
        item_id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        note TEXT
      )`
    );
    await database.execute(
      `INSERT OR REPLACE INTO bookmarks (item_id, item_type, note) VALUES ($1, $2, $3)`,
      [itemId, itemType, note ?? null]
    );
  } catch (err) {
    console.warn('[progressDb] addBookmark failed:', err);
  }
}

export async function removeBookmark(itemId: string): Promise<void> {
  const database = await getDb();
  try {
    await database.execute(`DELETE FROM bookmarks WHERE item_id = $1`, [itemId]);
  } catch (err) {
    console.warn('[progressDb] removeBookmark failed:', err);
  }
}

export async function getBookmarks(itemType?: string): Promise<Bookmark[]> {
  const database = await getDb();
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS bookmarks (
        item_id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        note TEXT
      )`
    );
    if (itemType) {
      return await database.select<Bookmark[]>(
        `SELECT item_id, item_type, created_at, note FROM bookmarks WHERE item_type = $1 ORDER BY created_at DESC`,
        [itemType]
      );
    }
    return await database.select<Bookmark[]>(
      `SELECT item_id, item_type, created_at, note FROM bookmarks ORDER BY created_at DESC`
    );
  } catch (err) {
    console.warn('[progressDb] getBookmarks failed:', err);
    return [];
  }
}

export async function isBookmarked(itemId: string): Promise<boolean> {
  const database = await getDb();
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS bookmarks (
        item_id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        note TEXT
      )`
    );
    const result = await database.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM bookmarks WHERE item_id = $1`,
      [itemId]
    );
    return (result[0]?.count ?? 0) > 0;
  } catch (err) {
    console.warn('[progressDb] isBookmarked failed:', err);
    return false;
  }
}

export interface Achievement {
  achievement_id: string;
  unlocked_at: string;
  progress: number;
}

const ACHIEVEMENT_DEFS: { id: string; name: string; description: string; icon: string; check: (stats: UserStatsData, streak: { current: number; best: number }, srs: { total_cards: number; learned: number }) => boolean }[] = [
  { id: 'first_lesson', name: 'İlk Adım', description: 'İlk dersi tamamla', icon: '🎓', check: (s) => s.total_lessons_completed >= 1 },
  { id: 'first_exercise', name: 'İlk Alıştırma', description: 'İlk alıştırmayı çöz', icon: '✏️', check: (s) => s.total_exercises_completed >= 1 },
  { id: 'streak_3', name: '3 Günlük Seri', description: '3 gün üst üste çalış', icon: '🔥', check: (_, streak) => streak.best >= 3 },
  { id: 'streak_7', name: 'Haftalık Seri', description: '7 gün üst üste çalış', icon: '⚡', check: (_, streak) => streak.best >= 7 },
  { id: 'streak_30', name: 'Aylık Seri', description: '30 gün üst üste çalış', icon: '🏆', check: (_, streak) => streak.best >= 30 },
  { id: 'lessons_10', name: 'Öğrenci', description: '10 ders tamamla', icon: '📚', check: (s) => s.total_lessons_completed >= 10 },
  { id: 'lessons_50', name: 'Bilgin', description: '50 ders tamamla', icon: '🧠', check: (s) => s.total_lessons_completed >= 50 },
  { id: 'exercises_10', name: 'Çalışkan', description: '10 alıştırma çöz', icon: '💪', check: (s) => s.total_exercises_completed >= 10 },
  { id: 'exercises_50', name: 'Pratik Ustası', description: '50 alıştırma çöz', icon: '🎯', check: (s) => s.total_exercises_completed >= 50 },
  { id: 'exercises_100', name: 'Yüzde Usta', description: '100 alıştırma çöz', icon: '💯', check: (s) => s.total_exercises_completed >= 100 },
  { id: 'stars_50', name: 'Yıldız Toplayıcı', description: '50 yıldız kazan', icon: '⭐', check: (s) => s.total_stars >= 50 },
  { id: 'srs_10', name: 'SRS Başlangıç', description: '10 SRS kart öğren', icon: '🔄', check: (_, __, srs) => srs.learned >= 10 },
  { id: 'srs_100', name: 'SRS Ustası', description: '100 SRS kart öğren', icon: '🎖️', check: (_, __, srs) => srs.learned >= 100 },
];

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const database = await getDb();
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS achievements (
        achievement_id TEXT PRIMARY KEY,
        unlocked_at TEXT DEFAULT (datetime('now')),
        progress INTEGER DEFAULT 0
      )`
    );
    return await database.select<Achievement[]>(
      `SELECT achievement_id, unlocked_at, progress FROM achievements ORDER BY unlocked_at DESC`
    );
  } catch (err) {
    console.warn('[progressDb] getUnlockedAchievements failed:', err);
    return [];
  }
}

export async function checkAndUnlockAchievements(): Promise<string[]> {
  const database = await getDb();
  const newlyUnlocked: string[] = [];
  try {
    await database.execute(
      `CREATE TABLE IF NOT EXISTS achievements (
        achievement_id TEXT PRIMARY KEY,
        unlocked_at TEXT DEFAULT (datetime('now')),
        progress INTEGER DEFAULT 0
      )`
    );
    const existing = await database.select<Achievement[]>(
      `SELECT achievement_id FROM achievements`
    );
    const existingIds = new Set(existing.map(a => a.achievement_id));

    const stats = await getUserStats();
    const streak = await getStreak();
    const srsStats = await import('./srs').then(m => m.getSRSStats()).catch(() => ({ total_cards: 0, learned: 0, learning: 0, due_today: 0, lapsed: 0 }));

    for (const def of ACHIEVEMENT_DEFS) {
      if (!existingIds.has(def.id) && def.check(stats, streak, srsStats)) {
        await database.execute(
          `INSERT OR IGNORE INTO achievements (achievement_id) VALUES ($1)`,
          [def.id]
        );
        newlyUnlocked.push(def.id);
      }
    }
  } catch (err) {
    console.warn('[progressDb] checkAndUnlockAchievements failed:', err);
  }
  return newlyUnlocked;
}

export { ACHIEVEMENT_DEFS };
