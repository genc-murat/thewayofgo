import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  GameState,
  MoveResult,
  GameStateResponse,
  Lesson,
  Exercise,
  UserStats,
} from '../types';

interface AppState {
  // Navigation
  currentView: 'home' | 'learn' | 'play' | 'exercise' | 'progress';
  currentLevel: number;
  currentModule: number;

  // Game state
  game: GameState | null;
  gameResult: MoveResult | null;
  isAiGame: boolean;
  aiDifficulty: number;

  // Lesson state
  currentLesson: Lesson | null;
  lessonStep: number;

  // Exercise state
  currentExercise: Exercise | null;
  exerciseAttempts: number;
  showHint: boolean;
  hintIndex: number;
  exerciseResult: { correct: boolean; explanation: string; best_move: [number, number] | null } | null;

  // Progress
  stats: UserStats | null;
  streak: { current: number; best: number } | null;

  // UI
  isLoading: boolean;
  error: string | null;

  // Actions
  setView: (view: AppState['currentView']) => void;
  setLevel: (level: number, module: number) => void;

  // Game actions
  createGame: (size: number) => Promise<void>;
  placeStone: (x: number, y: number) => Promise<MoveResult | null>;
  pass: () => Promise<MoveResult | null>;
  resign: (player: string) => Promise<void>;
  aiMove: () => Promise<MoveResult | null>;
  setAiDifficulty: (level: number) => Promise<void>;
  startAiGame: (size: number, difficulty: number) => Promise<void>;

  // Lesson actions
  loadLesson: (lessonId: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;

  // Exercise actions
  loadExercise: (exerciseId: string) => Promise<void>;
  submitExerciseMove: (x: number, y: number) => Promise<void>;
  showNextHint: () => void;

  // Error handling
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'home',
  currentLevel: 1,
  currentModule: 1,

  // Game state
  game: null,
  gameResult: null,
  isAiGame: false,
  aiDifficulty: 2,

  // Lesson state
  currentLesson: null,
  lessonStep: 0,

  // Exercise state
  currentExercise: null,
  exerciseAttempts: 0,
  showHint: false,
  hintIndex: 0,
  exerciseResult: null,

  // Progress
  stats: null,
  streak: null,

  // UI
  isLoading: false,
  error: null,

  // Navigation actions
  setView: (view) => set({ currentView: view }),
  setLevel: (level, module) => set({ currentLevel: level, currentModule: module }),

  // Game actions
  createGame: async (size) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<GameStateResponse>('create_game', { size });
      set({ game: response.state, gameResult: null, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  placeStone: async (x, y) => {
    const { game } = get();
    if (!game || game.game_over) return null;

    try {
      const response = await invoke<GameStateResponse>('place_stone', { x, y });
      set({ game: response.state, gameResult: response.result });
      return response.result;
    } catch (e) {
      set({ error: String(e) });
      return null;
    }
  },

  pass: async () => {
    try {
      const response = await invoke<GameStateResponse>('pass');
      set({ game: response.state, gameResult: response.result });
      return response.result;
    } catch (e) {
      set({ error: String(e) });
      return null;
    }
  },

  resign: async (player) => {
    try {
      const response = await invoke<GameStateResponse>('resign', { player });
      set({ game: response.state, gameResult: response.result });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  aiMove: async () => {
    try {
      const response = await invoke<GameStateResponse>('ai_place_stone');
      set({ game: response.state, gameResult: response.result });
      return response.result;
    } catch (e) {
      set({ error: String(e) });
      return null;
    }
  },

  setAiDifficulty: async (level) => {
    try {
      await invoke('set_ai_difficulty', { level });
      set({ aiDifficulty: level });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  startAiGame: async (size, difficulty) => {
    set({ isLoading: true, error: null, isAiGame: true });
    try {
      await invoke('set_ai_difficulty', { level: difficulty });
      const response = await invoke<GameStateResponse>('create_game', { size });
      set({
        game: response.state,
        gameResult: null,
        aiDifficulty: difficulty,
        isLoading: false,
        currentView: 'play',
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  // Lesson actions
  loadLesson: async (lessonId) => {
    set({ isLoading: true, error: null, lessonStep: 0 });
    try {
      const lessonData = await import(`../data/lessons/${lessonId}.json`);
      set({ currentLesson: lessonData.default || lessonData, isLoading: false, currentView: 'learn' });
    } catch (e) {
      set({ error: `Failed to load lesson: ${e}`, isLoading: false });
    }
  },

  nextStep: () => {
    const { currentLesson, lessonStep } = get();
    if (currentLesson && lessonStep < currentLesson.content.length - 1) {
      set({ lessonStep: lessonStep + 1 });
    }
  },

  prevStep: () => {
    const { lessonStep } = get();
    if (lessonStep > 0) {
      set({ lessonStep: lessonStep - 1 });
    }
  },

  // Exercise actions
  loadExercise: async (exerciseId) => {
    set({ isLoading: true, error: null, exerciseAttempts: 0, showHint: false, hintIndex: 0, exerciseResult: null });
    try {
      const exerciseData = await import(`../data/exercises/${exerciseId}.json`);
      set({
        currentExercise: exerciseData.default || exerciseData,
        isLoading: false,
        currentView: 'exercise',
      });
    } catch (e) {
      set({ error: `Failed to load exercise: ${e}`, isLoading: false });
    }
  },

  submitExerciseMove: async (x, y) => {
    const { currentExercise, exerciseAttempts } = get();
    if (!currentExercise) return;

    set({ isLoading: true });
    try {
      const exerciseJson = JSON.stringify(currentExercise);
      const result = await invoke<{ correct: boolean; explanation: string; best_move: [number, number] | null }>(
        'validate_exercise_move',
        { exerciseJson, x, y }
      );
      set({
        exerciseResult: result,
        exerciseAttempts: exerciseAttempts + 1,
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  showNextHint: () => {
    const { currentExercise, hintIndex } = get();
    if (currentExercise && hintIndex < currentExercise.hints.length) {
      set({ showHint: true, hintIndex: hintIndex + 1 });
    }
  },

  // Error handling
  setError: (error) => set({ error }),
}));
