import { getWeakAreas } from './progressDb';
import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  return db;
}

export interface WeaknessDimension {
  exercise_type: string;
  level: number;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  trend: 'improving' | 'declining' | 'stable';
  avg_difficulty: number;
}

export interface DetailedWeakness {
  exercise_type: string;
  overall_accuracy: number;
  total_attempts: number;
  by_level: Map<number, { attempts: number; correct: number }>;
  trend: 'improving' | 'declining' | 'stable';
  recent_accuracy: number;
  recommended_count: number;
}

export interface ExerciseRecommendation {
  exercise_id: string;
  exercise_type: string;
  level: number;
  title: string;
  reason: string;
  priority: number;
}

function getTypeDisplayName(type: string): string {
  const names: Record<string, string> = {
    place_correct: 'Doğru Hamle',
    capture_stones: 'Taş Yakalama',
    defend_group: 'Grup Savunma',
    life_and_death: 'Yaşam ve Ölüm',
    connect_groups: 'Grup Bağlama',
    cut_groups: 'Grup Kesme',
    territorial_control: 'Alan Kontrolü',
    endgame: 'Bitiriş',
    opening: 'Açılış',
    tesuji: 'Tesuji',
    reading_comprehension: 'Okuma',
    multi_step: 'Çok Adımlı',
  };
  return names[type] ?? type;
}

export async function getDetailedWeaknessProfile(): Promise<DetailedWeakness[]> {
  const database = await getDb();

  try {
    const results = await database.select<{
      exercise_id: string;
      exercise_type: string;
      correct: boolean;
      attempts: number;
      last_attempt: string;
    }[]>(
      `SELECT exercise_id, exercise_type, correct, attempts, last_attempt FROM exercise_type_stats ORDER BY last_attempt DESC`
    );

    if (results.length === 0) return [];

    const RECENT_WINDOW = 20;
    const typeMap = new Map<string, {
      total: number;
      correct: number;
      levelStats: Map<number, { attempts: number; correct: number }>;
      recent: { correct: number; total: number };
      recentCount: number;
    }>();

    for (const row of results) {
      const existing = typeMap.get(row.exercise_type) ?? {
        total: 0,
        correct: 0,
        levelStats: new Map(),
        recent: { correct: 0, total: 0 },
        recentCount: 0,
      };

      existing.total += 1;
      if (row.correct) existing.correct += 1;

      const levelMatch = row.exercise_id.match(/e(\d+)-/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 1;
      const lvl = existing.levelStats.get(level) ?? { attempts: 0, correct: 0 };
      lvl.attempts += 1;
      if (row.correct) lvl.correct += 1;
      existing.levelStats.set(level, lvl);

      if (existing.recentCount < RECENT_WINDOW) {
        existing.recent.total += 1;
        if (row.correct) existing.recent.correct += 1;
        existing.recentCount += 1;
      }

      typeMap.set(row.exercise_type, existing);
    }

    const detailed: DetailedWeakness[] = [];
    for (const [type, stats] of typeMap) {
      const overall_accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const recent_accuracy = stats.recent.total > 0
        ? (stats.recent.correct / stats.recent.total) * 100
        : overall_accuracy;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recent_accuracy > overall_accuracy + 10) trend = 'improving';
      else if (recent_accuracy < overall_accuracy - 10) trend = 'declining';

      detailed.push({
        exercise_type: type,
        overall_accuracy,
        total_attempts: stats.total,
        by_level: stats.levelStats,
        trend,
        recent_accuracy,
        recommended_count: Math.max(1, Math.ceil((100 - overall_accuracy) / 25)),
      });
    }

    detailed.sort((a, b) => a.overall_accuracy - b.overall_accuracy);
    return detailed;
  } catch (err) {
    console.warn('[weaknessEngine] getDetailedWeaknessProfile failed:', err);
    return [];
  }
}

export async function getRecommendedExercises(count: number = 5): Promise<ExerciseRecommendation[]> {
  const weakAreas = await getWeakAreas();
  if (weakAreas.length === 0) return [];

  const focusTypes = weakAreas
    .filter(w => w.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map(w => w.exercise_type);

  if (focusTypes.length === 0) return [];

  const recommendations: ExerciseRecommendation[] = [];
  let priority = 1;

  for (const type of focusTypes) {
    const accuracy = weakAreas.find(w => w.exercise_type === type)?.accuracy ?? 0;
    const typeLabel = getTypeDisplayName(type);
    const levels = accuracy < 40 ? [1, 2] : accuracy < 60 ? [2, 3] : [3, 4];

    for (let i = 0; i < Math.ceil(count / focusTypes.length); i++) {
      const level = levels[i % levels.length];
      const exerciseId = `e${level}-${Math.floor(i / 2) + 1}-${(i % 6) + 1}`;
      recommendations.push({
        exercise_id: exerciseId,
        exercise_type: type,
        level,
        title: `${typeLabel} Alıştırması`,
        reason: `${typeLabel} alanında gelişim (%${Math.round(accuracy)} başarı)`,
        priority: priority++,
      });
    }
  }

  return recommendations.slice(0, count);
}

export async function getImprovementTrend(exerciseType: string): Promise<{
  trend: 'improving' | 'declining' | 'stable';
  recent_accuracy: number;
  overall_accuracy: number;
  data_points: number;
}> {
  const areas = await getWeakAreas();
  const area = areas.find(a => a.exercise_type === exerciseType);

  if (!area) {
    return { trend: 'stable', recent_accuracy: 0, overall_accuracy: 0, data_points: 0 };
  }

  return {
    trend: area.accuracy >= 70 ? 'improving' : area.accuracy < 40 ? 'declining' : 'stable',
    recent_accuracy: area.accuracy,
    overall_accuracy: area.accuracy,
    data_points: area.total_attempts,
  };
}
