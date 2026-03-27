use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
#[serde(rename_all = "snake_case")]
pub enum StoneColor {
    Black,
    White,
}

impl StoneColor {
    pub fn opposite(&self) -> Self {
        match self {
            StoneColor::Black => StoneColor::White,
            StoneColor::White => StoneColor::Black,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BoardSize {
    Small,
    Medium,
    Large,
}

impl BoardSize {
    pub fn to_u8(&self) -> u8 {
        match self {
            BoardSize::Small => 9,
            BoardSize::Medium => 13,
            BoardSize::Large => 19,
        }
    }

    pub fn from_u8(size: u8) -> Result<Self, String> {
        match size {
            9 => Ok(BoardSize::Small),
            13 => Ok(BoardSize::Medium),
            19 => Ok(BoardSize::Large),
            _ => Err(format!(
                "Invalid board size: {}. Must be 9, 13, or 19.",
                size
            )),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: u8,
    pub y: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResult {
    pub success: bool,
    pub captured_stones: Vec<Point>,
    pub error: Option<String>,
    pub game_over: bool,
    pub winner: Option<StoneColor>,
    pub score: Option<ScoreResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreResult {
    pub black_territory: u32,
    pub white_territory: u32,
    pub black_captures: u32,
    pub white_captures: u32,
    pub komi: f32,
    pub black_total: f32,
    pub white_total: f32,
    pub winner: StoneColor,
    pub margin: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub board_size: u8,
    pub current_player: StoneColor,
    pub board: Vec<Vec<Option<StoneColor>>>,
    pub move_number: u32,
    pub black_captures: u32,
    pub white_captures: u32,
    pub last_move: Option<Point>,
    pub game_over: bool,
    pub passes_in_a_row: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveRecord {
    pub move_type: MoveType,
    pub x: Option<u8>,
    pub y: Option<u8>,
    pub captured_stones: Vec<Point>,
    pub player: StoneColor,
    pub board_snapshot: Vec<Vec<Option<StoneColor>>>,
    pub black_captures: u32,
    pub white_captures: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MoveType {
    Stone,
    Pass,
    Resign,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIDifficulty {
    pub level: u8,
    pub simulations: u32,
}

impl AIDifficulty {
    pub fn new(level: u8) -> Self {
        let simulations = match level {
            1 => 0,
            2 => 100,
            3 => 500,
            4 => 2000,
            5 => 5000,
            _ => 200,
        };
        AIDifficulty { level, simulations }
    }
}
