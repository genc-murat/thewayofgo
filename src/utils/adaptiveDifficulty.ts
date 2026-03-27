import { getWeakAreas, type WeakArea } from './progressDb';

export interface DifficultyRecommendation {
  suggestedLevel: number;
  suggestedDifficulty: number;
  reason: string;
  weakAreas: WeakArea[];
  focusTypes: string[];
}

/**
 * Calculates the adaptive difficulty level based on recent performance.
 * 
 * Algorithm:
 * - Looks at last 10 exercise attempts
 * - If accuracy > 80%: suggest one level up
 * - If accuracy 50-80%: stay at current level
 * - If accuracy < 50%: suggest one level down
 * - Also considers weak areas for type-specific recommendations
 */
export async function getAdaptiveDifficulty(
  currentLevel: number
): Promise<DifficultyRecommendation> {
  const weakAreas = await getWeakAreas();

  // If no data yet, return defaults
  if (weakAreas.length === 0) {
    return {
      suggestedLevel: currentLevel,
      suggestedDifficulty: currentLevel,
      reason: 'Henüz yeterli veri yok. Mevcut seviyede alıştırmalar çözün.',
      weakAreas: [],
      focusTypes: [],
    };
  }

  // Calculate overall accuracy
  let totalAttempts = 0;
  let totalCorrect = 0;
  for (const area of weakAreas) {
    totalAttempts += area.total_attempts;
    totalCorrect += area.correct_attempts;
  }

  const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

  // Determine suggested level
  let suggestedLevel = currentLevel;
  let reason = '';

  if (overallAccuracy >= 80) {
    suggestedLevel = Math.min(currentLevel + 1, 6);
    reason = `Başarı oranınız %${Math.round(overallAccuracy)} — bir üst seviyeye geçebilirsiniz!`;
  } else if (overallAccuracy >= 50) {
    suggestedLevel = currentLevel;
    reason = `Başarı oranınız %${Math.round(overallAccuracy)} — mevcut seviyede devam edin.`;
  } else {
    suggestedLevel = Math.max(currentLevel - 1, 1);
    reason = `Başarı oranınız %${Math.round(overallAccuracy)} — bir alt seviyeyi pekiştirmek faydalı olabilir.`;
  }

  // Identify weak types (accuracy < 60%)
  const focusTypes = weakAreas
    .filter(w => w.accuracy < 60 && w.total_attempts >= 2)
    .map(w => w.exercise_type);

  // Suggest difficulty based on weak areas
  const suggestedDifficulty = focusTypes.length > 0
    ? Math.max(1, currentLevel - 1)
    : currentLevel;

  return {
    suggestedLevel,
    suggestedDifficulty,
    reason,
    weakAreas,
    focusTypes,
  };
}

/**
 * Determines if a user is ready to advance to the next level.
 * Criteria: 80%+ accuracy on current level exercises with at least 5 attempts.
 */
export async function canAdvanceLevel(currentLevel: number): Promise<{
  canAdvance: boolean;
  progress: number;
  required: number;
  message: string;
}> {
  const weakAreas = await getWeakAreas();

  let totalAttempts = 0;
  let totalCorrect = 0;
  for (const area of weakAreas) {
    totalAttempts += area.total_attempts;
    totalCorrect += area.correct_attempts;
  }

  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  const required = 80;
  const progress = Math.min(accuracy, required);

  return {
    canAdvance: accuracy >= required && totalAttempts >= 5,
    progress: Math.round(progress),
    required,
    message: accuracy >= required
      ? `Seviye ${currentLevel + 1}'e geçmeye hazırsınız!`
      : `%${Math.round(accuracy)} başarı oranına ulaştınız. Geçmek için %${required} gerekli.`,
  };
}

/**
 * Get the type name in Turkish for display purposes.
 */
export function getTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
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
  };
  return typeNames[type] ?? type;
}
