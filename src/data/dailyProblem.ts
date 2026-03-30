import { getExerciseCatalog } from './exerciseCatalog';

interface DailyProblemEntry {
  id: string;
  level: number;
  module: number;
  title: string;
  type: string;
  difficulty: number;
}

interface DailyState {
  date: string;
  exerciseId: string;
  completed: boolean;
}

interface StreakData {
  current: number;
  best: number;
}

const DAILY_STATE_KEY = 'dailyProblemState';
const DAILY_STREAK_KEY = 'dailyProblemStreak';
const DAILY_HISTORY_KEY = 'dailyProblemHistory';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getExercisesByDifficulty(targetLevel: number): DailyProblemEntry[] {
  const lower = Math.max(1, targetLevel - 1);
  const upper = Math.min(6, targetLevel + 1);

  return getExerciseCatalog().filter((e) => {
    return e.level >= lower && e.level <= upper;
  });
}

export function getDailyProblem(targetLevel: number = 1): DailyProblemEntry | null {
  const todayStr = getTodayDateString();
  const cached = getDailyState();

  if (cached && cached.date === todayStr) {
    const cachedEntry = getExerciseCatalog().find((e) => e.id === cached.exerciseId);
    if (cachedEntry) return cachedEntry;
  }

  const seed = dateToSeed(todayStr);
  const rng = seededRandom(seed);

  const candidates = getExercisesByDifficulty(targetLevel);
  if (candidates.length === 0) {
    const fallback = getExerciseCatalog().length > 0
      ? getExerciseCatalog()[Math.floor(rng() * getExerciseCatalog().length)]
      : null;
    return fallback ?? null;
  }

  const dayOfWeek = new Date(todayStr).getDay();
  let filtered = candidates;

  const preferredTypes: string[][] = [
    ['place_correct', 'capture_stones'],
    ['capture_stones', 'defend_group'],
    ['life_and_death', 'defend_group'],
    ['connect_groups', 'cut_groups'],
    ['life_and_death', 'tesuji'],
    ['territorial_control', 'endgame'],
    ['life_and_death', 'reading_comprehension'],
  ];

  const preferred = preferredTypes[dayOfWeek] ?? [];
  const typeMatched = candidates.filter((e) => preferred.includes(e.type));
  if (typeMatched.length > 0) {
    filtered = typeMatched;
  }

  const difficultyTarget = targetLevel;
  const sorted = [...filtered].sort((a, b) => {
    const diffA = Math.abs(a.difficulty - difficultyTarget);
    const diffB = Math.abs(b.difficulty - difficultyTarget);
    return diffA - diffB;
  });

  const topCandidates = sorted.slice(0, Math.max(5, Math.ceil(sorted.length * 0.3)));
  const idx = Math.floor(rng() * topCandidates.length);
  const selected = topCandidates[idx] ?? topCandidates[0] ?? sorted[0];

  if (selected) {
    setDailyState({ date: todayStr, exerciseId: selected.id, completed: false });
  }

  return selected ?? null;
}

export function getDailyProblemForDate(dateStr: string, targetLevel: number = 1): DailyProblemEntry | null {
  const seed = dateToSeed(dateStr);
  const rng = seededRandom(seed);

  const candidates = getExercisesByDifficulty(targetLevel);
  if (candidates.length === 0) return getExerciseCatalog()[0] ?? null;

  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx] ?? null;
}

export function getDailyState(): DailyState | null {
  try {
    const raw = localStorage.getItem(DAILY_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyState;
  } catch {
    return null;
  }
}

export function setDailyState(state: DailyState): void {
  try {
    localStorage.setItem(DAILY_STATE_KEY, JSON.stringify(state));
  } catch {
    // Non-critical
  }
}

export function isDailyCompleted(): boolean {
  const state = getDailyState();
  if (!state) return false;
  return state.date === getTodayDateString() && state.completed;
}

export function markDailyCompleted(): void {
  const state = getDailyState();
  const todayStr = getTodayDateString();

  setDailyState({
    date: todayStr,
    exerciseId: state?.exerciseId ?? '',
    completed: true,
  });

  addToHistory(todayStr);
  updateStreak();
}

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(DAILY_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function addToHistory(dateStr: string): void {
  const history = getHistory();
  if (!history.includes(dateStr)) {
    history.push(dateStr);
    history.sort().reverse();
    try {
      localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(history.slice(0, 365)));
    } catch {
      // Non-critical
    }
  }
}

export function getDailyStreak(): StreakData {
  const cached = getCachedStreak();
  if (cached) return cached;

  const streak = calculateStreak();
  cacheStreak(streak);
  return streak;
}

function calculateStreak(): StreakData {
  const history = getHistory();
  if (history.length === 0) return { current: 0, best: 0 };

  const todayStr = getTodayDateString();
  const sorted = [...history].sort().reverse();

  let current = 0;
  let best = 0;

  const todayCompleted = sorted.includes(todayStr);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  if (!todayCompleted && !sorted.includes(yesterdayStr)) {
    const justBest: StreakData = { current: 0, best: 0 };
    if (sorted.length > 0) {
      let tempStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const d1 = new Date(sorted[i - 1]);
        const d2 = new Date(sorted[i]);
        const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      justBest.best = tempStreak;
    }
    return justBest;
  }

  const startIdx = todayCompleted ? 0 : sorted.indexOf(yesterdayStr) >= 0 ? sorted.indexOf(yesterdayStr) : -1;
  if (startIdx < 0) {
    let tempBest = 0;
    let tempCurrent = 1;
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1]);
      const d2 = new Date(sorted[i]);
      const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempCurrent++;
      } else {
        tempBest = Math.max(tempBest, tempCurrent);
        tempCurrent = 1;
      }
    }
    tempBest = Math.max(tempBest, tempCurrent);
    return { current: 0, best: tempBest };
  }

  current = 1;
  for (let i = startIdx + 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1]);
    const d2 = new Date(sorted[i]);
    const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current++;
    } else {
      break;
    }
  }

  let tempStreak2 = 1;
  best = current;
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1]);
    const d2 = new Date(sorted[i]);
    const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      tempStreak2++;
    } else {
      best = Math.max(best, tempStreak2);
      tempStreak2 = 1;
    }
  }
  best = Math.max(best, tempStreak2);

  return { current, best };
}

function getCachedStreak(): StreakData | null {
  try {
    const raw = localStorage.getItem(DAILY_STREAK_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as StreakData & { date?: string };
    if (cached.date === getTodayDateString()) {
      return { current: cached.current, best: cached.best };
    }
    return null;
  } catch {
    return null;
  }
}

function cacheStreak(streak: StreakData): void {
  try {
    localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify({
      ...streak,
      date: getTodayDateString(),
    }));
  } catch {
    // Non-critical
  }
}

function updateStreak(): void {
  const streak = calculateStreak();
  cacheStreak(streak);
}

export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    1: 'Çok Kolay',
    2: 'Kolay',
    3: 'Orta',
    4: 'Zor',
    5: 'Çok Zor',
    6: 'Uzman',
  };
  return labels[difficulty] ?? 'Bilinmiyor';
}

export function getDifficultyDots(difficulty: number): string {
  const filled = Math.min(difficulty, 6);
  return '●'.repeat(filled) + '○'.repeat(6 - filled);
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 2) return 'bg-success';
  if (difficulty <= 3) return 'bg-amber-400';
  if (difficulty <= 4) return 'bg-orange-400';
  return 'bg-error';
}

export function getDailyProblemTitle(dateStr: string): string {
  return `Günlük Tsumego — ${dateStr}`;
}

export function getDailyProblemDescription(difficulty: number, type: string): string {
  const diffLabel = getDifficultyLabel(difficulty);
  return `Seviye ${difficulty} · ${diffLabel} · ${type}`;
}
