import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  GameState,
  MoveResult,
  GameStateResponse,
  MoveRecord,
  Lesson,
  Exercise,
  UserStats,
  StepResult,
  StoneColor,
  AIStyle,
} from '../types';
import { recordExerciseAttempt } from '../utils/progressDb';

interface AppState {
  // Navigation
  currentView: 'home' | 'learn' | 'play' | 'exercise' | 'progress' | 'settings';
  currentLevel: number;
  currentModule: number;

  // Game state
  game: GameState | null;
  gameResult: MoveResult | null;
  isAiGame: boolean;
  aiDifficulty: number;
  aiStyle: AIStyle;

  // Lesson state
  currentLesson: Lesson | null;
  lessonStep: number;

  // Exercise state
  currentExercise: Exercise | null;
  exerciseAttempts: number;
  showHint: boolean;
  hintIndex: number;
  exerciseResult: { correct: boolean; explanation: string; best_move: [number, number] | null } | null;
  // Multi-step exercise state
  currentStepIndex: number;
  stepBoard: (StoneColor | null)[][] | null;
  stepResults: StepResult[];
  allStepsCompleted: boolean;

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
  setAiStyle: (style: AIStyle) => Promise<void>;
  startAiGame: (size: number, difficulty: number, style?: AIStyle) => Promise<void>;
  undoMove: () => Promise<void>;
  getMoveHistory: () => Promise<MoveRecord[]>;

  // Lesson actions
  loadLesson: (lessonId: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;

  // Exercise actions
  loadExercise: (exerciseId: string) => Promise<void>;
  closeExercise: () => void;
  submitExerciseMove: (x: number, y: number) => Promise<void>;
  submitMultiStepMove: (x: number, y: number) => Promise<void>;
  advanceToNextStep: () => void;
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
  aiStyle: 'balanced',

  // Lesson state
  currentLesson: null,
  lessonStep: 0,

  // Exercise state
  currentExercise: null,
  exerciseAttempts: 0,
  showHint: false,
  hintIndex: 0,
  exerciseResult: null,

  // Multi-step exercise state
  currentStepIndex: 0,
  stepBoard: null,
  stepResults: [],
  allStepsCompleted: false,

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

  setAiStyle: async (style) => {
    try {
      await invoke('set_ai_style', { style });
      set({ aiStyle: style });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  startAiGame: async (size, difficulty, style) => {
    const aiStyle = style || useAppStore.getState().aiStyle;
    set({ isLoading: true, error: null, isAiGame: true });
    try {
      await invoke('set_ai_difficulty', { level: difficulty });
      await invoke('set_ai_style', { style: aiStyle });
      const response = await invoke<GameStateResponse>('create_game', { size });
      set({
        game: response.state,
        gameResult: null,
        aiDifficulty: difficulty,
        aiStyle: aiStyle,
        isLoading: false,
        currentView: 'play',
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  undoMove: async () => {
    try {
      const response = await invoke<GameStateResponse>('undo');
      set({ game: response.state, gameResult: null, error: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  getMoveHistory: async () => {
    try {
      return await invoke<MoveRecord[]>('get_move_history');
    } catch (e) {
      set({ error: String(e) });
      return [];
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
      const exercise: Exercise = exerciseData.default || exerciseData;

      const isMultiStep = exercise.steps && exercise.steps.length > 0;
      let stepBoard = null;
      if (isMultiStep && exercise.steps) {
        const firstStep = exercise.steps[0];
        const stones = firstStep.initial_stones.length > 0
          ? firstStep.initial_stones
          : exercise.initial_stones;
        stepBoard = createBoardFromStones(stones, exercise.board_size);
      }

      set({
        currentExercise: exercise,
        isLoading: false,
        currentView: 'exercise',
        currentStepIndex: 0,
        stepBoard,
        stepResults: [],
        allStepsCompleted: false,
      });
    } catch (e) {
      set({ error: `Failed to load exercise: ${e}`, isLoading: false });
    }
  },

  closeExercise: () => {
    set({
      currentExercise: null,
      exerciseResult: null,
      exerciseAttempts: 0,
      showHint: false,
      hintIndex: 0,
      currentStepIndex: 0,
      stepBoard: null,
      stepResults: [],
      allStepsCompleted: false,
      currentView: 'exercise',
    });
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

      // Record progress (fire-and-forget)
      recordExerciseAttempt(
        currentExercise.id,
        currentExercise.type,
        result.correct,
        0
      ).catch(() => {});
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

  submitMultiStepMove: async (x, y) => {
    const { currentExercise, currentStepIndex, stepResults, exerciseAttempts } = get();
    if (!currentExercise || !currentExercise.steps) return;

    set({ isLoading: true });
    try {
      const exerciseJson = JSON.stringify(currentExercise);
      const result = await invoke<StepResult>(
        'validate_multi_step_move',
        { exerciseJson, stepIndex: currentStepIndex, x, y }
      );

      const newResults = [...stepResults, result];

      if (result.correct) {
        if (result.all_steps_completed) {
          // All steps done
          set({
            exerciseResult: {
              correct: true,
              explanation: result.explanation,
              best_move: null,
            },
            stepResults: newResults,
            allStepsCompleted: true,
            exerciseAttempts: exerciseAttempts + 1,
            isLoading: false,
          });

          // Record progress (fire-and-forget)
          recordExerciseAttempt(
            currentExercise.id,
            currentExercise.type,
            true,
            0
          ).catch(() => {});
        } else {
          // Move to next step
          set({
            stepResults: newResults,
            exerciseAttempts: exerciseAttempts + 1,
            isLoading: false,
          });
        }
      } else {
        set({
          stepResults: newResults,
          exerciseAttempts: exerciseAttempts + 1,
          isLoading: false,
        });

        // Record failed attempt for this step
        recordExerciseAttempt(
          currentExercise.id,
          currentExercise.type,
          false,
          0
        ).catch(() => {});
      }
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  advanceToNextStep: () => {
    const { currentExercise, currentStepIndex } = get();
    if (!currentExercise?.steps) return;

    const nextIndex = currentStepIndex + 1;
    const steps = currentExercise.steps;
    if (nextIndex >= steps.length) return;

    const nextStep = steps[nextIndex];

    // Determine board state: start from opponent_response of previous step or current step's initial_stones
    let stones = nextStep.initial_stones;
    if (nextStep.opponent_response) {
      // Merge: keep previous stones, add opponent response
      stones = [...nextStep.initial_stones, ...nextStep.opponent_response];
    }

    const board = createBoardFromStones(stones, currentExercise.board_size);

    set({
      currentStepIndex: nextIndex,
      stepBoard: board,
      showHint: false,
      hintIndex: 0,
      exerciseResult: null,
    });
  },

  // Error handling
  setError: (error) => set({ error }),
}));

function createBoardFromStones(
  stones: { x: number; y: number; color: string }[],
  size: number
): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }
  return board;
}
