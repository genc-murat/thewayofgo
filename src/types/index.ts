export type StoneColor = 'black' | 'white';

export type AIStyle = 'balanced' | 'aggressive' | 'defensive' | 'educational';

export interface Point {
  x: number;
  y: number;
}

export interface Stone {
  x: number;
  y: number;
  color: StoneColor;
}

export type BoardSize = 9 | 13 | 19;

export interface GameState {
  board_size: number;
  current_player: StoneColor;
  board: (StoneColor | null)[][];
  move_number: number;
  black_captures: number;
  white_captures: number;
  last_move: Point | null;
  game_over: boolean;
  passes_in_a_row: number;
  komi: number;
}

export interface MoveResult {
  success: boolean;
  captured_stones: Point[];
  error: string | null;
  game_over: boolean;
  winner: StoneColor | null;
  score: ScoreResult | null;
}

export interface ScoreResult {
  black_territory: number;
  white_territory: number;
  black_captures: number;
  white_captures: number;
  komi: number;
  black_total: number;
  white_total: number;
  winner: StoneColor;
  margin: number;
}

export interface GameStateResponse {
  state: GameState;
  result: MoveResult | null;
}

export type MoveType = 'stone' | 'pass' | 'resign';

export interface MoveRecord {
  move_type: MoveType;
  x: number | null;
  y: number | null;
  captured_stones: Point[];
  player: StoneColor;
  board_snapshot: (StoneColor | null)[][];
  black_captures: number;
  white_captures: number;
}

// Lesson types
export interface LessonContent {
  type: 'text' | 'board' | 'animation';
  content?: string;
  size?: number;
  stones?: Stone[];
  highlights?: Highlight[];
  annotation?: string;
  steps?: AnimationStep[];
}

export interface Highlight {
  x: number;
  y: number;
  type: 'liberty' | 'capture' | 'territory' | 'good' | 'bad';
}

export interface AnimationStep {
  stones: Stone[];
  captured?: Point[];
  text: string;
}

export interface Lesson {
  id: string;
  level: number;
  module: number;
  lesson: number;
  title: string;
  description: string;
  duration_minutes: number;
  content: LessonContent[];
  prerequisites: string[];
  next_lesson: string | null;
  required_exercise: string | null;
}

// Exercise types
export type ExerciseType =
  | 'place_correct'
  | 'capture_stones'
  | 'defend_group'
  | 'life_and_death'
  | 'connect_groups'
  | 'cut_groups'
  | 'territorial_control'
  | 'endgame'
  | 'opening'
  | 'tesuji'
  | 'reading_comprehension'
  | 'shape_recognition'
  | 'move_evaluation'
  | 'position_judgment';

export interface MoveOption {
  x: number;
  y: number;
  is_correct: boolean;
  explanation: string;
}

export interface ExerciseStep {
  initial_stones: Stone[];
  correct_moves: MoveOption[];
  opponent_response?: Stone[];
  explanation?: string;
  hints?: string[];
}

export interface Exercise {
  id: string;
  level: number;
  module: number;
  lesson: number;
  type: ExerciseType;
  title: string;
  description: string;
  board_size: BoardSize;
  initial_stones: Stone[];
  correct_moves: MoveOption[];
  hints: string[];
  difficulty: number;
  stars_required: number;
  steps?: ExerciseStep[];
}

export interface StepResult {
  step_index: number;
  correct: boolean;
  explanation: string;
  best_move: [number, number] | null;
  all_steps_completed: boolean;
}

export interface ExerciseResult {
  correct: boolean;
  explanation: string;
  best_move: [number, number] | null;
  shown_consequences: boolean;
}

// Progress types
export interface UserProgress {
  lesson_id: string;
  completed: boolean;
  stars: number;
  attempts: number;
}

export interface ExerciseProgress {
  exercise_id: string;
  completed: boolean;
  correct: boolean;
  attempts: number;
}

export interface UserStats {
  total_lessons_completed: number;
  total_exercises_completed: number;
  total_stars: number;
  total_play_time_minutes: number;
  games_played: number;
  games_won: number;
  current_level: number;
  current_module: number;
}

export interface Streak {
  current: number;
  best: number;
  last_date: string | null;
}

// SRS types
export interface SRSCardInfo {
  card_id: string;
  exercise_type: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_review: string | null;
  lapses: number;
}

// Study plan types
export interface StudyPlanItemData {
  id: string;
  type: 'review' | 'lesson' | 'exercise' | 'game' | 'daily_problem';
  title: string;
  description: string;
  estimated_minutes: number;
  completed: boolean;
}

// Joseki types
export interface JosekiVariation {
  name: string;
  moves: { x: number; y: number; color: StoneColor }[];
  explanation?: string;
}

export interface Joseki {
  id: string;
  name: string;
  description: string;
  moves: { x: number; y: number; color: StoneColor }[];
  variations: JosekiVariation[];
  difficulty: number;
  stars_required: number;
}

// AI Analysis types
export interface MoveCandidate {
  x: number;
  y: number;
  visits: number;
  win_rate: number;
  is_best: boolean;
}

export interface SearchAnalysis {
  candidates: MoveCandidate[];
  best_variation: { x: number; y: number }[];
  evaluation: number;
  total_simulations: number;
}

// Glossary types
export interface GlossaryEntry {
  id: string;
  term: string;
  term_en?: string;
  term_jp?: string;
  definition: string;
  category: 'temel' | 'teknik' | 'strateji' | 'oyun_sonu' | 'terim';
  related_terms: string[];
  level: number;
  example_stones?: Stone[];
  example_size?: number;
  example_annotation?: string;
}

// Shape types
export interface GoShape {
  id: string;
  name: string;
  name_jp?: string;
  description: string;
  category: 'connection' | 'eye_shape' | 'attack' | 'defense' | 'territory' | 'efficiency';
  level: number;
  board_size: number;
  stones: Stone[];
  highlights?: Highlight[];
  key_points: string[];
  when_to_use: string;
  related_exercises?: string[];
  related_lessons?: string[];
}

// Quiz types
export interface Quiz {
  id: string;
  lesson_id: string;
  questions: QuizQuestion[];
}

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion;

export interface MultipleChoiceQuestion {
  id: number;
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface TrueFalseQuestion {
  id: number;
  type: 'true_false';
  statement: string;
  correct: boolean;
  explanation: string;
}

// Reading Ladder types
export interface LadderRung {
  exercise_id: string;
  stars_to_unlock: number;
}

export interface ReadingLadder {
  id: string;
  title: string;
  description: string;
  category: 'life_and_death' | 'tesuji' | 'capture' | 'endgame' | 'reading';
  difficulty_range: [number, number];
  rungs: LadderRung[];
}

// Variant types
export type VariationCategory = 'corner' | 'life_death' | 'capture' | 'fuseki' | 'endgame' | 'tesuji' | 'joseki';

// KataGo analysis types
export interface KataMoveEvaluation {
  move_str: string;
  x: number;
  y: number;
  visits: number;
  win_rate: number;
  score_mean: number;
  is_best: boolean;
  quality: 'best' | 'good' | 'acceptable' | 'mistake' | 'blunder' | 'unknown';
}

export interface KataPositionAnalysis {
  evaluations: KataMoveEvaluation[];
  best_move: string;
  score_mean: number;
  turn: string;
}

export interface HeatmapEntry {
  x: number;
  y: number;
  win_rate: number;
  score_mean: number;
  visits: number;
  quality: string;
  is_best: boolean;
  rank: number;
}

export interface ScoreEstimate {
  score_mean: number;
  turn: string;
}

export interface VariationPosition {
  id: string;
  title: string;
  description: string;
  level: number;
  board_size: BoardSize;
  initial_stones: Stone[];
  variations: Variation[];
  category?: VariationCategory;
  quiz?: VariantQuiz;
  territory_markers?: TerritoryMarker[];
}

export interface Variation {
  id: string;
  label: string;
  is_best: boolean;
  moves: Stone[];
  result_description: string;
  evaluation: 'good' | 'bad' | 'neutral';
  sub_variations?: Variation[];
  move_annotations?: string[];
  territory_change?: { black: number; white: number };
}

export interface VariantQuiz {
  question: string;
  correct_variation_id: string;
  hint?: string;
}

export interface TerritoryMarker {
  x: number;
  y: number;
  owner: 'black' | 'white';
}

export interface VariantProgressData {
  position_id: string;
  variation_id: string;
  explored: boolean;
  quiz_completed: boolean;
  quiz_correct: boolean;
  attempts: number;
  last_attempt: string | null;
}

// KataGo ownership
export interface KataOwnershipResult {
  evaluations: KataMoveEvaluation[];
  best_move: string;
  score_mean: number;
  turn: string;
  ownership: number[];
}

// Score history
export interface ScoreHistoryPoint {
  move_number: number;
  score_mean: number;
  win_rate: number;
}

// Variation sequence
export interface VariationSequence {
  evaluations: KataMoveEvaluation[];
  best_move: string;
  score_mean: number;
  turn: string;
  pv: Point[];
}
