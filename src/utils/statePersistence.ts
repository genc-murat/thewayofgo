const STORAGE_KEY = 'thewayofgo_session_state';

export interface PersistedState {
  currentView: string;
  currentLessonId: string | null;
  lessonStep: number;
  currentExerciseId: string | null;
  currentStepIndex: number;
  exerciseAttempts: number;
  userLevel: number;
  dailyGoal: number;
  lastSaved: number;
}

export function saveState(state: Partial<PersistedState>): void {
  try {
    const existing = loadState();
    const merged = { ...existing, ...state, lastSaved: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage not available
  }
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    // Expire after 24 hours
    if (parsed.lastSaved && Date.now() - parsed.lastSaved > 24 * 60 * 60 * 1000) {
      clearState();
      return getDefaultState();
    }
    return { ...getDefaultState(), ...parsed };
  } catch {
    return getDefaultState();
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getDefaultState(): PersistedState {
  return {
    currentView: 'home',
    currentLessonId: null,
    lessonStep: 0,
    currentExerciseId: null,
    currentStepIndex: 0,
    exerciseAttempts: 0,
    userLevel: 1,
    dailyGoal: 10,
    lastSaved: 0,
  };
}
