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
  | 'reading_comprehension';

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
