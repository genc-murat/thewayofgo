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
import { createBoardFromStones } from '../utils/boardUtils';
import { getExerciseCatalog, loadExerciseCatalog } from '../data/exerciseCatalog';
import { loadAllVariations } from '../data/variations';
import { loadState, saveState } from '../utils/statePersistence';

interface AppState {
  // Navigation
  currentView: 'home' | 'learn' | 'play' | 'exercise' | 'progress' | 'settings' | 'srs-review' | 'position-editor' | 'openings' | 'glossary' | 'reading-ladder' | 'shapes' | 'variants';
  currentLevel: number;
  currentModule: number;

  // Game state
  game: GameState | null;
  gameResult: MoveResult | null;
  isAiGame: boolean;
  aiDifficulty: number;
  aiStyle: AIStyle;
  useKataGo: boolean;
  katagoMaxVisits: number;
  komi: number;
  rule_set: string;

  // Time control
  timeControl: {
    kind: string;
    mainTime: number;
    byoyomiPeriods: number;
    byoyomiTime: number;
    fischerIncrement: number;
  };
  blackTimeRemaining: number;
  whiteTimeRemaining: number;
  blackByoyomiPeriods: number;
  whiteByoyomiPeriods: number;
  blackByoyomiTime: number;
  whiteByoyomiTime: number;
  clockActive: boolean;

  // Human SL
  humanSLProfile: string | null;
  humanSLModelAvailable: boolean;

  // KataGo params
  katagoParams: Record<string, string>;

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
  planVersion: number;
  bumpPlanVersion: () => void;

  // Onboarding / User preferences
  userLevel: number;
  dailyGoal: number;
  setOnboardingData: (level: number, dailyGoal: number) => void;

  // Catalog
  catalogLoaded: boolean;
  loadCatalogs: () => Promise<void>;

  // UI
  isLoading: boolean;
  loadingMessage: string | null;
  error: string | null;

  // Actions
  setView: (view: AppState['currentView']) => void;
  setLevel: (level: number, module: number) => void;

  // Game actions
  initKataGo: () => Promise<void>;
  setUseKataGo: (use: boolean) => Promise<void>;
  createGame: (size: number, komi?: number, rule_set?: string) => Promise<void>;
  placeStone: (x: number, y: number) => Promise<MoveResult | null>;
  pass: () => Promise<MoveResult | null>;
  resign: (player: string) => Promise<void>;
  aiMove: () => Promise<MoveResult | null>;
  setAiDifficulty: (level: number) => Promise<void>;
  setAiStyle: (style: AIStyle) => Promise<void>;
  startAiGame: (size: number, difficulty: number, style?: AIStyle, komi?: number, rule_set?: string) => Promise<void>;
  undoMove: () => Promise<void>;
  getMoveHistory: () => Promise<MoveRecord[]>;
  createGameFromPosition: (
    size: number,
    stones: { x: number; y: number; color: StoneColor }[],
    currentPlayer: StoneColor,
    komi?: number,
    blackCaptures?: number,
    whiteCaptures?: number,
    ruleSet?: string,
  ) => Promise<void>;

  // Time control actions
  setTimeControl: (tc: AppState['timeControl']) => void;
  startClock: () => void;
  stopClock: () => void;
  tickClock: () => void;

  // Human SL actions
  setHumanSLProfile: (profile: string | null) => Promise<void>;
  checkHumanSLModel: () => Promise<void>;

  // KataGo param actions
  setKatagoParam: (key: string, value: string) => Promise<void>;
  loadKatagoParams: () => Promise<void>;

  // Lesson actions
  loadLesson: (lessonId: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;

  // Exercise actions
  lastAttemptedExerciseId: string | null;
  loadExercise: (exerciseId: string) => Promise<void>;
  closeExercise: () => void;
  loadNextExercise: (currentId: string) => void;
  submitExerciseMove: (x: number, y: number) => Promise<void>;
  submitMultiStepMove: (x: number, y: number) => Promise<void>;
  advanceToNextStep: () => void;
  retryCurrentStep: () => void;
  showNextHint: () => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoadingMessage: (message: string | null) => void;
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
  useKataGo: false,
  katagoMaxVisits: 400,
  komi: 6.5,
  rule_set: 'japanese',

  // Time control
  timeControl: { kind: 'none', mainTime: 0, byoyomiPeriods: 0, byoyomiTime: 0, fischerIncrement: 0 },
  blackTimeRemaining: 0,
  whiteTimeRemaining: 0,
  blackByoyomiPeriods: 0,
  whiteByoyomiPeriods: 0,
  blackByoyomiTime: 0,
  whiteByoyomiTime: 0,
  clockActive: false,

  // Human SL
  humanSLProfile: null,
  humanSLModelAvailable: false,

  // KataGo params
  katagoParams: {},

  // Lesson state
  currentLesson: null,
  lessonStep: 0,

  // Exercise state
  currentExercise: null,
  exerciseAttempts: 0,
  showHint: false,
  hintIndex: 0,
  exerciseResult: null,
  lastAttemptedExerciseId: null,

  // Multi-step exercise state
  currentStepIndex: 0,
  stepBoard: null,
  stepResults: [],
  allStepsCompleted: false,

  // Progress
  stats: null,
  streak: null,
  planVersion: 0,
  catalogLoaded: false,

  // Onboarding / User preferences
  userLevel: 1,
  dailyGoal: 10,

  // UI
  isLoading: false,
  loadingMessage: null,
  error: null,

  // Navigation actions
  setView: (view) => set({ currentView: view }),
  setLevel: (level, module) => set({ currentLevel: level, currentModule: module }),

  // Game actions
  initKataGo: async () => {
    try {
      await invoke('init_katago');
    } catch (e) {
      console.error('Failed to initialize KataGo:', e);
    }
  },

  setUseKataGo: async (use) => {
    try {
      await invoke('set_use_katago', { useKatago: use });
      set({ useKataGo: use });
    } catch (e) {
      console.error('Failed to set KataGo usage:', e);
    }
  },

  createGame: async (size, komi, rule_set) => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<GameStateResponse>('create_game', { size, komi, ruleSet: rule_set });
      set({ game: response.state, gameResult: null, isLoading: false, komi: komi ?? 6.5 });
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
      // Also apply PDA to KataGo if enabled
      const { useKataGo } = useAppStore.getState();
      if (useKataGo) {
        try {
          await invoke('set_katago_style', { style });
        } catch {
          // KataGo style not available
        }
      }
      set({ aiStyle: style });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  startAiGame: async (size, difficulty, style, komi, rule_set) => {
    const aiStyle = style || useAppStore.getState().aiStyle;
    const gameKomi = komi ?? useAppStore.getState().komi;
    const gameRuleSet = rule_set || useAppStore.getState().rule_set;
    const { timeControl, humanSLProfile } = useAppStore.getState();
    set({ isLoading: true, loadingMessage: 'Oyun kuruluyor...', error: null, isAiGame: true });
    try {
      await invoke('set_ai_difficulty', { level: difficulty });
      await invoke('set_ai_style', { style: aiStyle });

      // Auto-enable KataGo and set difficulty
      const maxVisitsMap = [50, 100, 200, 300, 400, 600, 1000];
      const maxVisits = maxVisitsMap[Math.min(difficulty - 1, 6)];
      try {
        await invoke('init_katago', { humanSl: !!humanSLProfile });
        await invoke('set_use_katago', { useKatago: true });
        await invoke('set_katago_difficulty', { maxVisits });
        // Apply PDA style
        await invoke('set_katago_style', { style: aiStyle });
        // Apply rules
        await invoke('set_katago_rules', { rules: gameRuleSet });
        // Apply human SL profile if set
        if (humanSLProfile) {
          try {
            await invoke('set_human_sl_profile', { profile: humanSLProfile });
          } catch {
            // Human SL model not available
          }
        }
        // Apply time control
        if (timeControl.kind !== 'none') {
          try {
            await invoke('setup_time_control', {
              kind: timeControl.kind,
              mainTime: timeControl.mainTime,
              byoyomiPeriods: timeControl.byoyomiPeriods,
              byoyomiTime: timeControl.byoyomiTime,
              fischerIncrement: timeControl.fischerIncrement,
            });
          } catch {
            // Time control not available
          }
        }
        set({ useKataGo: true, katagoMaxVisits: maxVisits });
      } catch {
        // KataGo not available, fall back to MCTS
        await invoke('set_use_katago', { useKatago: false });
        set({ useKataGo: false });
      }

      // Initialize clock if time control is set
      const tc = useAppStore.getState().timeControl;
      const initialTime = tc.kind !== 'none' ? tc.mainTime : 0;

      const response = await invoke<GameStateResponse>('create_game', { size, komi: gameKomi, ruleSet: gameRuleSet });
      set({
        game: response.state,
        gameResult: null,
        aiDifficulty: difficulty,
        aiStyle: aiStyle,
        komi: gameKomi,
        rule_set: gameRuleSet,
        isLoading: false,
        loadingMessage: null,
        currentView: 'play',
        blackTimeRemaining: initialTime,
        whiteTimeRemaining: initialTime,
        blackByoyomiPeriods: tc.byoyomiPeriods,
        whiteByoyomiPeriods: tc.byoyomiPeriods,
        blackByoyomiTime: tc.byoyomiTime,
        whiteByoyomiTime: tc.byoyomiTime,
        clockActive: tc.kind !== 'none',
      });
    } catch (e) {
      set({ error: String(e), isLoading: false, loadingMessage: null });
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

  createGameFromPosition: async (size, stones, currentPlayer, komi, blackCaptures, whiteCaptures, ruleSet) => {
    set({ isLoading: true, error: null });
    try {
      const stoneTuples = stones.map(s => [s.x, s.y, s.color] as [number, number, string]);
      const response = await invoke<GameStateResponse>('create_game_from_position', {
        size,
        stones: stoneTuples,
        currentPlayer,
        komi,
        blackCaptures,
        whiteCaptures,
        ruleSet: ruleSet ?? 'japanese',
      });
      set({
        game: response.state,
        gameResult: null,
        isLoading: false,
        isAiGame: true,
        currentView: 'play',
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  // Lesson actions
  loadLesson: async (lessonId) => {
    set({ isLoading: true, loadingMessage: 'Ders yükleniyor...', error: null, lessonStep: 0 });
    try {
      const lessonData = await import(`../data/lessons/${lessonId}.json`);
      set({ currentLesson: lessonData.default || lessonData, isLoading: false, loadingMessage: null, currentView: 'learn' });
    } catch (e) {
      set({ error: `Failed to load lesson: ${e}`, isLoading: false, loadingMessage: null });
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
    set({ isLoading: true, loadingMessage: 'Alıştırma hazırlanıyor...', error: null, exerciseAttempts: 0, showHint: false, hintIndex: 0, exerciseResult: null });
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
        loadingMessage: null,
        currentView: 'exercise',
        currentStepIndex: 0,
        stepBoard,
        stepResults: [],
        allStepsCompleted: false,
        lastAttemptedExerciseId: exerciseId,
      });
    } catch (e) {
      set({ error: `Failed to load exercise: ${e}`, isLoading: false, loadingMessage: null });
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
      currentView: 'home',
    });
    saveState({ currentView: 'home', currentExerciseId: null, currentStepIndex: 0, exerciseAttempts: 0 });
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
      ).then(() => get().bumpPlanVersion()).catch((err) => console.warn('Exercise record failed:', err));
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
          ).then(() => get().bumpPlanVersion()).catch((err) => console.warn('Exercise record failed:', err));
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
        ).then(() => get().bumpPlanVersion()).catch((err) => console.warn('Exercise record failed:', err));
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

  retryCurrentStep: () => {
    const { currentExercise, currentStepIndex, stepResults } = get();
    if (!currentExercise?.steps) return;

    const step = currentExercise.steps[currentStepIndex];
    if (!step) return;

    // Remove the last failed step result
    const newResults = stepResults.slice(0, -1);

    // Rebuild board for current step
    let stones = step.initial_stones;
    if (step.opponent_response) {
      stones = [...step.initial_stones, ...step.opponent_response];
    }
    const board = createBoardFromStones(stones, currentExercise.board_size);

    set({
      stepBoard: board,
      stepResults: newResults,
      exerciseResult: null,
      showHint: false,
      hintIndex: 0,
      exerciseAttempts: get().exerciseAttempts,
    });
  },

  // Error handling
  setError: (error) => set({ error }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  loadCatalogs: async () => {
    await Promise.all([loadExerciseCatalog(), loadAllVariations()]);
    set({ catalogLoaded: true });
  },

  bumpPlanVersion: () => set(s => ({ planVersion: s.planVersion + 1 })),

  setOnboardingData: (level, dailyGoal) => set({ userLevel: level, dailyGoal }),

  loadNextExercise: (currentId) => {
    const idx = getExerciseCatalog().findIndex((e) => e.id === currentId);
    if (idx >= 0 && idx < getExerciseCatalog().length - 1) {
      const nextEx = getExerciseCatalog()[idx + 1];
      get().loadExercise(nextEx.id);
    }
  },

  // Time control actions
  setTimeControl: (tc) => set({
    timeControl: tc,
    blackTimeRemaining: tc.kind !== 'none' ? tc.mainTime : 0,
    whiteTimeRemaining: tc.kind !== 'none' ? tc.mainTime : 0,
    blackByoyomiPeriods: tc.byoyomiPeriods,
    whiteByoyomiPeriods: tc.byoyomiPeriods,
    blackByoyomiTime: tc.byoyomiTime,
    whiteByoyomiTime: tc.byoyomiTime,
  }),

  startClock: () => set({ clockActive: true }),

  stopClock: () => set({ clockActive: false }),

  tickClock: () => {
    const { game, clockActive, timeControl } = get();
    if (!game || !clockActive || game.game_over || timeControl.kind === 'none') return;

    const isBlack = game.current_player === 'black';
    if (isBlack) {
      const newTime = get().blackTimeRemaining - 1;
      if (newTime <= 0) {
        if (timeControl.kind === 'byoyomi' && get().blackByoyomiPeriods > 0) {
          set({
            blackTimeRemaining: timeControl.byoyomiTime,
            blackByoyomiPeriods: get().blackByoyomiPeriods - 1,
          });
        } else {
          set({ clockActive: false, blackTimeRemaining: 0 });
        }
      } else {
        set({ blackTimeRemaining: newTime });
      }
    } else {
      const newTime = get().whiteTimeRemaining - 1;
      if (newTime <= 0) {
        if (timeControl.kind === 'byoyomi' && get().whiteByoyomiPeriods > 0) {
          set({
            whiteTimeRemaining: timeControl.byoyomiTime,
            whiteByoyomiPeriods: get().whiteByoyomiPeriods - 1,
          });
        } else {
          set({ clockActive: false, whiteTimeRemaining: 0 });
        }
      } else {
        set({ whiteTimeRemaining: newTime });
      }
    }
  },

  // Human SL actions
  setHumanSLProfile: async (profile) => {
    // Only store the preference. It will be applied when startAiGame creates the engine.
    set({ humanSLProfile: profile || null });
  },

  checkHumanSLModel: async () => {
    try {
      const available = await invoke<boolean>('get_human_sl_model_status');
      set({ humanSLModelAvailable: available });
    } catch {
      set({ humanSLModelAvailable: false });
    }
  },

  // KataGo param actions
  setKatagoParam: async (key, value) => {
    try {
      await invoke('set_katago_param', { param: key, value });
      set(s => ({ katagoParams: { ...s.katagoParams, [key]: value } }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadKatagoParams: async () => {
    try {
      const paramsJson = await invoke<string>('get_katago_params');
      const params = JSON.parse(paramsJson);
      set({ katagoParams: params });
    } catch {
      // KataGo not available
    }
  },
}));

// Hydrate from persisted state
const persisted = loadState();
if (persisted.currentView !== 'home') {
  useAppStore.setState({
    currentView: persisted.currentView as AppState['currentView'],
    lessonStep: persisted.lessonStep,
    currentStepIndex: persisted.currentStepIndex,
    exerciseAttempts: persisted.exerciseAttempts,
    userLevel: persisted.userLevel,
    dailyGoal: persisted.dailyGoal,
  });

  // If there was an active lesson, reload it
  if (persisted.currentView === 'learn' && persisted.currentLessonId) {
    useAppStore.getState().loadLesson(persisted.currentLessonId);
  }
  // If there was an active exercise, reload it
  if (persisted.currentView === 'exercise' && persisted.currentExerciseId) {
    useAppStore.getState().loadExercise(persisted.currentExerciseId);
  }
}

// Subscribe to changes and persist
useAppStore.subscribe((state) => {
  saveState({
    currentView: state.currentView,
    currentLessonId: state.currentLesson?.id ?? null,
    lessonStep: state.lessonStep,
    currentExerciseId: state.currentExercise?.id ?? null,
    currentStepIndex: state.currentStepIndex,
    exerciseAttempts: state.exerciseAttempts,
    userLevel: state.userLevel,
    dailyGoal: state.dailyGoal,
  });
});