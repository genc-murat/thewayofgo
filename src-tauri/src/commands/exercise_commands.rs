use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseConfig {
    pub id: String,
    #[serde(alias = "type")]
    pub exercise_type: ExerciseType,
    pub board_size: u8,
    pub initial_stones: Vec<StonePosition>,
    pub correct_moves: Vec<MoveOption>,
    pub hints: Vec<String>,
    pub explanation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExerciseType {
    PlaceCorrect,
    CaptureStones,
    DefendGroup,
    LifeAndDeath,
    ConnectGroups,
    CutGroups,
    TerritorialControl,
    Endgame,
    Opening,
    Tesuji,
    ReadingComprehension,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StonePosition {
    pub x: u8,
    pub y: u8,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveOption {
    pub x: u8,
    pub y: u8,
    pub is_correct: bool,
    pub explanation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseResult {
    pub correct: bool,
    pub explanation: String,
    pub best_move: Option<(u8, u8)>,
    pub shown_consequences: bool,
}

#[tauri::command]
#[specta::specta]
pub fn validate_exercise_move(
    exercise_json: String,
    x: u8,
    y: u8,
) -> Result<ExerciseResult, String> {
    let exercise: ExerciseConfig = serde_json::from_str(&exercise_json)
        .map_err(|e| format!("Invalid exercise JSON: {}", e))?;

    for correct_move in &exercise.correct_moves {
        if correct_move.x == x && correct_move.y == y {
            return Ok(ExerciseResult {
                correct: correct_move.is_correct,
                explanation: correct_move.explanation.clone(),
                best_move: if !correct_move.is_correct {
                    exercise
                        .correct_moves
                        .iter()
                        .find(|m| m.is_correct)
                        .map(|m| (m.x, m.y))
                } else {
                    None
                },
                shown_consequences: true,
            });
        }
    }

    // Move not in options - try to determine if it's valid
    Ok(ExerciseResult {
        correct: false,
        explanation: "Bu hamle beklenen seçenekler arasında değil.".to_string(),
        best_move: exercise
            .correct_moves
            .iter()
            .find(|m| m.is_correct)
            .map(|m| (m.x, m.y)),
        shown_consequences: false,
    })
}
