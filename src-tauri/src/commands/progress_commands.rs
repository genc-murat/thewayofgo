use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LessonProgress {
    pub lesson_id: String,
    pub completed: bool,
    pub stars: u8,
    pub attempts: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseProgressData {
    pub exercise_id: String,
    pub completed: bool,
    pub correct: bool,
    pub attempts: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRecord {
    pub board_size: u8,
    pub opponent: String,
    pub result: String,
    pub moves: u32,
    pub duration_seconds: u32,
}

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: r#"
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
                    played_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            "#,
        kind: MigrationKind::Up,
    }]
}
