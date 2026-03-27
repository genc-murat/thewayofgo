use std::sync::{Arc, Mutex};
use tauri::State;

use crate::ai::mcts::MCTSAi;
use crate::engine::game::GoGame;
use crate::engine::types::*;

pub struct AppState {
    pub game: Arc<Mutex<Option<GoGame>>>,
    pub ai: Arc<Mutex<MCTSAi>>,
}

impl Default for AppState {
    fn default() -> Self {
        AppState {
            game: Arc::new(Mutex::new(None)),
            ai: Arc::new(Mutex::new(MCTSAi::new(AIDifficulty::new(2)))),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameStateResponse {
    pub state: GameState,
    pub result: Option<MoveResult>,
}

#[tauri::command]
pub fn create_game(state: State<AppState>, size: u8) -> Result<GameStateResponse, String> {
    let board_size = BoardSize::from_u8(size)?;
    let game = GoGame::new(board_size);
    let game_state = game.get_game_state();

    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    *guard = Some(game);

    Ok(GameStateResponse {
        state: game_state,
        result: None,
    })
}

#[tauri::command]
pub fn place_stone(state: State<AppState>, x: u8, y: u8) -> Result<GameStateResponse, String> {
    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_mut().ok_or("No active game")?;

    let result = game.place_stone(x, y)?;
    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: Some(result),
    })
}

#[tauri::command]
pub fn pass(state: State<AppState>) -> Result<GameStateResponse, String> {
    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_mut().ok_or("No active game")?;

    let result = game.pass();
    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: Some(result),
    })
}

#[tauri::command]
pub fn resign(state: State<AppState>, player: String) -> Result<GameStateResponse, String> {
    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_mut().ok_or("No active game")?;

    let color = match player.as_str() {
        "black" => StoneColor::Black,
        "white" => StoneColor::White,
        _ => return Err("Invalid player color".to_string()),
    };

    let result = game.resign(color);
    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: Some(result),
    })
}

#[tauri::command]
pub fn get_game_state(state: State<AppState>) -> Result<GameStateResponse, String> {
    let guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_ref().ok_or("No active game")?;

    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: None,
    })
}

#[tauri::command]
pub fn get_valid_moves(state: State<AppState>) -> Result<Vec<Point>, String> {
    let guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_ref().ok_or("No active game")?;

    Ok(game.get_valid_moves())
}

#[tauri::command]
pub async fn ai_get_move(state: State<'_, AppState>) -> Result<Option<Point>, String> {
    let game_mutex = state.game.clone();
    let ai_mutex = state.ai.clone();
    let handle = std::thread::spawn(move || {
        let game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;

        let ai_guard = ai_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        Ok::<Option<Point>, String>(ai_guard.get_move(game))
    });
    handle.join().map_err(|e| format!("AI thread panicked: {:?}", e))?
}

#[tauri::command]
pub async fn ai_place_stone(state: State<'_, AppState>) -> Result<GameStateResponse, String> {
    let game_mutex = state.game.clone();
    let ai_mutex = state.ai.clone();
    let handle = std::thread::spawn(move || {
        let ai_move = {
            let game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let game = game_guard.as_ref().ok_or("No active game")?;

            let ai_guard = ai_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            ai_guard.get_move(game)
        };

        if let Some(mov) = ai_move {
            let mut game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let game = game_guard.as_mut().ok_or("No active game")?;

            let result = game.place_stone(mov.x, mov.y)?;
            let game_state = game.get_game_state();

            Ok::<GameStateResponse, String>(GameStateResponse {
                state: game_state,
                result: Some(result),
            })
        } else {
            let mut game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let game = game_guard.as_mut().ok_or("No active game")?;

            let result = game.pass();
            let game_state = game.get_game_state();

            Ok::<GameStateResponse, String>(GameStateResponse {
                state: game_state,
                result: Some(result),
            })
        }
    });
    handle.join().map_err(|e| format!("AI thread panicked: {:?}", e))?
}

#[tauri::command]
pub fn set_ai_difficulty(state: State<AppState>, level: u8) -> Result<(), String> {
    let mut ai = state.ai.lock().map_err(|e| e.to_string())?;
    *ai = MCTSAi::new(AIDifficulty::new(level));
    Ok(())
}

#[tauri::command]
pub fn undo(state: State<AppState>) -> Result<GameStateResponse, String> {
    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_mut().ok_or("No active game")?;

    game.undo()?;

    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: None,
    })
}

#[tauri::command]
pub fn undo_multiple(state: State<AppState>, count: u8) -> Result<GameStateResponse, String> {
    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_mut().ok_or("No active game")?;

    game.undo_multiple(count)?;

    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: None,
    })
}

#[tauri::command]
pub fn get_move_history(state: State<AppState>) -> Result<Vec<MoveRecord>, String> {
    let guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_ref().ok_or("No active game")?;

    Ok(game.get_move_history())
}
