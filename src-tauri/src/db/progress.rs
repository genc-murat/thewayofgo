use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProgress {
    pub id: Option<i64>,
    pub lesson_id: String,
    pub completed: bool,
    pub stars: u8,
    pub best_time_seconds: Option<u32>,
    pub attempts: u32,
    pub last_attempt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseProgress {
    pub id: Option<i64>,
    pub exercise_id: String,
    pub completed: bool,
    pub correct: bool,
    pub attempts: u32,
    pub best_time_seconds: Option<u32>,
    pub last_attempt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyGoal {
    pub date: String,
    pub target_minutes: u32,
    pub actual_minutes: u32,
    pub exercises_completed: u32,
    pub lessons_completed: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Streak {
    pub current: u32,
    pub best: u32,
    pub last_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserStats {
    pub total_lessons_completed: u32,
    pub total_exercises_completed: u32,
    pub total_stars: u32,
    pub total_play_time_minutes: u32,
    pub games_played: u32,
    pub games_won: u32,
    pub current_level: u8,
    pub current_module: u8,
}

pub const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL UNIQUE,
    completed BOOLEAN NOT NULL DEFAULT 0,
    stars INTEGER NOT NULL DEFAULT 0,
    best_time_seconds INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt TEXT
);

CREATE TABLE IF NOT EXISTS exercise_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id TEXT NOT NULL UNIQUE,
    completed BOOLEAN NOT NULL DEFAULT 0,
    correct BOOLEAN NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    best_time_seconds INTEGER,
    last_attempt TEXT
);

CREATE TABLE IF NOT EXISTS daily_goals (
    date TEXT PRIMARY KEY,
    target_minutes INTEGER NOT NULL DEFAULT 20,
    actual_minutes INTEGER NOT NULL DEFAULT 0,
    exercises_completed INTEGER NOT NULL DEFAULT 0,
    lessons_completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_size INTEGER NOT NULL,
    opponent TEXT NOT NULL,
    result TEXT NOT NULL,
    moves INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    played_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress ON exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(date);
"#;
