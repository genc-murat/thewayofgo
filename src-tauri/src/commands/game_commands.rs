use std::sync::{Arc, Mutex};
use tauri::State;

use crate::ai::mcts::MCTSAi;
use crate::ai::katago::KataGoEngine;
use crate::engine::game::GoGame;
use crate::engine::types::*;

pub struct AppState {
    pub game: Arc<Mutex<Option<GoGame>>>,
    pub ai: Arc<Mutex<MCTSAi>>,
    pub katago: Arc<tokio::sync::Mutex<Option<KataGoEngine>>>,
    pub use_katago: Arc<Mutex<bool>>,
}

impl Default for AppState {
    fn default() -> Self {
        AppState {
            game: Arc::new(Mutex::new(None)),
            ai: Arc::new(Mutex::new(MCTSAi::new(AIDifficulty::new(2)))),
            katago: Arc::new(tokio::sync::Mutex::new(None)),
            use_katago: Arc::new(Mutex::new(false)),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameStateResponse {
    pub state: GameState,
    pub result: Option<MoveResult>,
}

#[tauri::command]
pub fn create_game(state: State<AppState>, size: u8, komi: Option<f32>, rule_set: String) -> Result<GameStateResponse, String> {
    let board_size = BoardSize::from_u8(size)?;
    let rule_set_enum = match rule_set.as_str() {
        "japanese" => RuleSet::Japanese,
        "korean" => RuleSet::Korean,
        "chinese" => RuleSet::Chinese,
        _ => return Err("Invalid rule set. Must be japanese, korean, or chinese".to_string()),
    };
    let game = GoGame::new(board_size, komi.unwrap_or(6.5), rule_set_enum);
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
pub async fn init_katago(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<(), String> {
    let mut katago_guard = state.katago.lock().await;
    let needs_init = match katago_guard.as_ref() {
        Some(engine) => !engine.is_healthy(),
        None => true,
    };
    if needs_init {
        let engine = KataGoEngine::new(&handle).await?;
        *katago_guard = Some(engine);
    }
    Ok(())
}

#[tauri::command]
pub fn set_use_katago(state: State<'_, AppState>, use_katago: bool) -> Result<(), String> {
    let mut guard = state.use_katago.lock().map_err(|e| e.to_string())?;
    *guard = use_katago;
    Ok(())
}

#[tauri::command]
pub async fn ai_get_move(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<Option<Point>, String> {
    let use_katago = {
        let guard = state.use_katago.lock().map_err(|e| e.to_string())?;
        *guard
    };

    if use_katago {
        match try_katago_move(&state, &handle).await {
            Ok(mv) => return Ok(mv),
            Err(e) => {
                eprintln!("KataGo failed, falling back to MCTS: {}", e);
                // Disable KataGo so subsequent moves don't keep failing
                if let Ok(mut guard) = state.use_katago.lock() {
                    *guard = false;
                }
                // Fall through to MCTS
            }
        }
    }

    let game_mutex = state.game.clone();
    let ai_mutex = state.ai.clone();
    let handle = std::thread::spawn(move || {
        let game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;

        let mut ai_guard = ai_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        Ok::<Option<Point>, String>(ai_guard.get_move(game))
    });
    handle.join().map_err(|e| format!("AI thread panicked: {:?}", e))?
}

async fn try_katago_move(state: &State<'_, AppState>, handle: &tauri::AppHandle) -> Result<Option<Point>, String> {
    // Ensure KataGo is initialized and healthy
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, current_player) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        (game.get_move_history(), game.board_size().to_u8(), game.current_player())
    };

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };

        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);

            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }
    }

    let color_str = if current_player == StoneColor::Black { "B" } else { "W" };
    let response = engine.gen_move(color_str).await?;

    if response.to_uppercase() == "PASS" {
        return Ok(None);
    }

    if response.len() >= 2 {
        let col_char = response.chars().next().unwrap().to_ascii_uppercase();
        let col = if col_char > 'I' { col_char as u8 - b'A' - 1 } else { col_char as u8 - b'A' };
        let row_str: String = response.chars().skip(1).collect();
        let row_num: u8 = row_str.parse().map_err(|_| "Failed to parse KataGo row")?;
        let row = board_size - row_num;
        return Ok(Some(Point { x: col, y: row }));
    }

    Err(format!("Unexpected KataGo response: {}", response))
}

#[tauri::command]
pub async fn set_katago_difficulty(state: State<'_, AppState>, handle: tauri::AppHandle, max_visits: u32) -> Result<(), String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;
    engine.set_param("maxVisits", &max_visits.to_string()).await
}

#[tauri::command]
pub async fn ai_place_stone(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<GameStateResponse, String> {
    let ai_move = ai_get_move(state.clone(), handle).await?;

    let mut game_guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = game_guard.as_mut().ok_or("No active game")?;

    let result = if let Some(mov) = ai_move {
        game.place_stone(mov.x, mov.y)?
    } else {
        game.pass()
    };

    let game_state = game.get_game_state();

    Ok(GameStateResponse {
        state: game_state,
        result: Some(result),
    })
}

#[tauri::command]
pub fn set_ai_difficulty(state: State<AppState>, level: u8) -> Result<(), String> {
    let mut ai = state.ai.lock().map_err(|e| e.to_string())?;
    let current_style = ai.style();
    *ai = MCTSAi::new(AIDifficulty::new_with_style(level, current_style));
    Ok(())
}

#[tauri::command]
pub fn set_ai_style(state: State<AppState>, style: String) -> Result<(), String> {
    let ai_style: AIStyle = serde_json::from_str(&format!("\"{}\"", style))
        .map_err(|_| format!("Invalid AI style: {}", style))?;
    let mut ai = state.ai.lock().map_err(|e| e.to_string())?;
    let current_level = ai.difficulty_level();
    *ai = MCTSAi::new(AIDifficulty::new_with_style(current_level, ai_style));
    Ok(())
}

#[tauri::command]
pub fn get_ai_style(state: State<AppState>) -> Result<String, String> {
    let ai = state.ai.lock().map_err(|e| e.to_string())?;
    let style = ai.style();
    let style_str = serde_json::to_string(&style)
        .map_err(|e| e.to_string())?
        .trim_matches('"')
        .to_string();
    Ok(style_str)
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

#[derive(Debug, Clone, serde::Serialize)]
pub struct MoveAnalysis {
    pub explanation: String,
    pub confidence: u8,
    pub tactics: Vec<String>,
}

#[tauri::command]
pub fn analyze_move(state: State<AppState>, x: u8, y: u8) -> Result<MoveAnalysis, String> {
    let guard = state.game.lock().map_err(|e| e.to_string())?;
    let game = guard.as_ref().ok_or("No active game")?;

    let mut tactics = Vec::new();
    let mut score: i32 = 0;

    // Check captures
    let captures = game.would_capture_count(x, y);
    if captures > 0 {
        tactics.push(format!("{} taş yakalama", captures));
        score += captures as i32 * 15;
    }

    // Check atari
    if game.creates_atari(x, y) {
        tactics.push("Atari yaratır".to_string());
        score += 8;
    }

    // Check self-atari
    if game.is_self_atari(x, y) {
        tactics.push("Kendi taşı atari durumuna sokar".to_string());
        score -= 12;
    }

    // Check connections
    let connected = game.connects_friendly_groups(x, y);
    if connected > 1 {
        tactics.push("Grupları bağlar".to_string());
        score += 3 * connected as i32;
    }

    // Check liberties
    let liberties = game.get_group_liberties_at(x, y);
    if liberties > 0 && liberties <= 2 {
        tactics.push(format!("Grup özgürlükleri: {}", liberties));
    }

    // Game stage analysis
    let move_number = game.move_number();
    let board_size = game.board_size().to_u8();
    let board_area = (board_size as u32).pow(2);
    let progress = move_number as f32 / board_area as f32;

    let stage_comment = if progress < 0.15 {
        "Açılış aşamasında"
    } else if progress < 0.5 {
        "Orta oyunda"
    } else {
        "Bitiriş aşamasında"
    };

    // Generate explanation
    let explanation = if tactics.is_empty() {
        format!("{} stratejik bir hamle. Pozisyonu değerlendirin.", stage_comment)
    } else {
        format!("{}: {}", stage_comment, tactics.join(" | "))
    };

    let confidence = if score > 20 { 95 } else if score > 10 { 80 } else if score > 0 { 65 } else if score > -10 { 50 } else { 35 };

    // Educational commentary
    let ai = state.ai.lock().map_err(|e| e.to_string())?;
    let educational_commentary = ai.generate_commentary(game, x, y);

    let full_explanation = match educational_commentary {
        Some(commentary) => format!("{}\n{}", explanation, commentary),
        None => explanation,
    };

    Ok(MoveAnalysis {
        explanation: full_explanation,
        confidence,
        tactics,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PositionAnalysis {
    pub candidates: Vec<MoveCandidateResponse>,
    pub best_variation: Vec<Point>,
    pub evaluation: f64,
    pub total_simulations: u32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MoveCandidateResponse {
    pub x: u8,
    pub y: u8,
    pub visits: u32,
    pub win_rate: f64,
    pub is_best: bool,
}

#[tauri::command]
pub async fn get_position_analysis(state: State<'_, AppState>) -> Result<PositionAnalysis, String> {
    let game_mutex = state.game.clone();
    let ai_mutex = state.ai.clone();

    let handle = std::thread::spawn(move || {
        let game_guard = game_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;

        let mut ai_guard = ai_mutex.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        match ai_guard.analyze_position(game) {
            Some(analysis) => Ok(PositionAnalysis {
                candidates: analysis.candidates.into_iter().map(|c| MoveCandidateResponse {
                    x: c.x,
                    y: c.y,
                    visits: c.visits,
                    win_rate: c.win_rate,
                    is_best: c.is_best,
                }).collect(),
                best_variation: analysis.best_variation,
                evaluation: analysis.evaluation,
                total_simulations: analysis.total_simulations,
            }),
            None => Err("No analysis available".to_string()),
        }
    });

    handle.join().map_err(|e| format!("AI thread panicked: {:?}", e))?
}

#[tauri::command]
pub fn create_game_from_position(
    state: State<AppState>,
    size: u8,
    stones: Vec<(u8, u8, String)>,
    current_player: String,
    komi: Option<f32>,
    black_captures: Option<u32>,
    white_captures: Option<u32>,
    rule_set: String,
) -> Result<GameStateResponse, String> {
    let board_size = BoardSize::from_u8(size)?;
    let player = match current_player.as_str() {
        "black" => StoneColor::Black,
        "white" => StoneColor::White,
        _ => return Err("Invalid current player color".to_string()),
    };

    let parsed_stones: Vec<(u8, u8, StoneColor)> = stones
        .into_iter()
        .map(|(x, y, color)| {
            let c = match color.as_str() {
                "black" => StoneColor::Black,
                "white" => StoneColor::White,
                _ => return Err(format!("Invalid stone color: {}", color)),
            };
            Ok((x, y, c))
        })
        .collect::<Result<Vec<_>, String>>()?;

    let rule_set_enum = match rule_set.as_str() {
        "japanese" => RuleSet::Japanese,
        "korean" => RuleSet::Korean,
        "chinese" => RuleSet::Chinese,
        _ => return Err("Invalid rule set. Must be japanese, korean, or chinese".to_string()),
    };
    let game = GoGame::from_position(
        board_size,
        &parsed_stones,
        player,
        komi.unwrap_or(6.5),
        black_captures.unwrap_or(0),
        white_captures.unwrap_or(0),
        rule_set_enum,
    );
    let game_state = game.get_game_state();

    let mut guard = state.game.lock().map_err(|e| e.to_string())?;
    *guard = Some(game);

    Ok(GameStateResponse {
        state: game_state,
        result: None,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct KataMoveEvaluation {
    pub move_str: String,
    pub x: u8,
    pub y: u8,
    pub visits: u32,
    pub win_rate: f64,
    pub score_mean: f64,
    pub is_best: bool,
    pub quality: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct KataPositionAnalysis {
    pub evaluations: Vec<KataMoveEvaluation>,
    pub best_move: String,
    pub score_mean: f64,
    pub turn: String,
}

#[tauri::command]
pub async fn get_katago_analysis(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<KataPositionAnalysis, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, komi) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        (game.get_move_history(), game.board_size().to_u8(), game.get_game_state().komi)
    };

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };
        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);
            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }
    }

    let result = engine.analyze_position(board_size, komi).await?;

    Ok(KataPositionAnalysis {
        evaluations: result.evaluations.into_iter().map(|e| KataMoveEvaluation {
            move_str: e.move_str,
            x: e.x,
            y: e.y,
            visits: e.visits,
            win_rate: e.win_rate,
            score_mean: e.score_mean,
            is_best: e.is_best,
            quality: e.quality,
        }).collect(),
        best_move: result.best_move,
        score_mean: result.score_mean,
        turn: result.turn,
    })
}

#[tauri::command]
pub async fn get_katago_move_evaluation(
    state: State<'_, AppState>,
    handle: tauri::AppHandle,
    x: u8,
    y: u8,
) -> Result<KataMoveEvaluation, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, komi, current_player) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        let gs = game.get_game_state();
        (game.get_move_history(), gs.board_size, gs.komi, gs.current_player)
    };

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };
        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);
            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }
    }

    let color_str = if current_player == StoneColor::Black { "B" } else { "W" };
    let col_char = (b'A' + if x >= 8 { x + 1 } else { x }) as char;
    let vertex = format!("{}{}", col_char, board_size - y);

    let result = engine.analyze_move(color_str, &vertex, board_size, komi).await?;

    Ok(KataMoveEvaluation {
        move_str: result.move_str,
        x: result.x,
        y: result.y,
        visits: result.visits,
        win_rate: result.win_rate,
        score_mean: result.score_mean,
        is_best: result.is_best,
        quality: result.quality,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct KataHintResult {
    pub x: u8,
    pub y: u8,
    pub move_str: String,
    pub win_rate: f64,
    pub score_mean: f64,
}

#[tauri::command]
pub async fn get_katago_exercise_hint(
    state: State<'_, AppState>,
    handle: tauri::AppHandle,
    stones: Vec<(u8, u8, String)>,
    board_size: u8,
    _current_player: String,
) -> Result<KataHintResult, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (x, y, color) in &stones {
        let color_str = if color == "black" { "B" } else { "W" };
        let col_char = (b'A' + if *x >= 8 { *x + 1 } else { *x }) as char;
        let vertex = format!("{}{}", col_char, board_size - y);
        engine.play_move(color_str, &vertex).await?;
    }

    let result = engine.analyze_position(board_size, 6.5).await?;

    let best = result.evaluations.into_iter()
        .find(|e| e.is_best)
        .ok_or("No best move found")?;

    Ok(KataHintResult {
        x: best.x,
        y: best.y,
        move_str: best.move_str,
        win_rate: best.win_rate,
        score_mean: best.score_mean,
    })
}

// --- Ownership Analysis ---

#[derive(Debug, Clone, serde::Serialize)]
pub struct KataOwnershipResult {
    pub evaluations: Vec<KataMoveEvaluation>,
    pub best_move: String,
    pub score_mean: f64,
    pub turn: String,
    pub ownership: Vec<f64>,
}

#[tauri::command]
pub async fn get_katago_ownership(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<KataOwnershipResult, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, komi) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        (game.get_move_history(), game.board_size().to_u8(), game.get_game_state().komi)
    };

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };
        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);
            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }
    }

    let result = engine.analyze_position_with_ownership(board_size, komi).await?;

    Ok(KataOwnershipResult {
        evaluations: result.evaluations.into_iter().map(|e| KataMoveEvaluation {
            move_str: e.move_str, x: e.x, y: e.y, visits: e.visits,
            win_rate: e.win_rate, score_mean: e.score_mean, is_best: e.is_best, quality: e.quality,
        }).collect(),
        best_move: result.best_move,
        score_mean: result.score_mean,
        turn: result.turn,
        ownership: result.ownership,
    })
}

// --- Score History ---

#[derive(Debug, Clone, serde::Serialize)]
pub struct ScoreHistoryPoint {
    pub move_number: u32,
    pub score_mean: f64,
    pub win_rate: f64,
}

#[tauri::command]
pub async fn get_game_score_history(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<Vec<ScoreHistoryPoint>, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, komi) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        (game.get_move_history(), game.board_size().to_u8(), game.get_game_state().komi)
    };

    let mut points = Vec::new();

    // Analyze starting position (move 0)
    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;
    if let Ok(result) = engine.analyze_position(board_size, komi).await {
        points.push(ScoreHistoryPoint {
            move_number: 0,
            score_mean: result.score_mean,
            win_rate: result.evaluations.first().map(|e| e.win_rate).unwrap_or(0.5),
        });
    }

    // Analyze after each move
    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };
        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);
            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }

        if let Ok(result) = engine.analyze_position(board_size, komi).await {
            points.push(ScoreHistoryPoint {
                move_number: (i + 1) as u32,
                score_mean: result.score_mean,
                win_rate: result.evaluations.first().map(|e| e.win_rate).unwrap_or(0.5),
            });
        }
    }

    Ok(points)
}

// --- Variation Sequence ---

#[derive(Debug, Clone, serde::Serialize)]
pub struct VariationResult {
    pub evaluations: Vec<KataMoveEvaluation>,
    pub best_move: String,
    pub score_mean: f64,
    pub turn: String,
    pub pv: Vec<Point>,
}

#[tauri::command]
pub async fn get_variation_sequence(state: State<'_, AppState>, handle: tauri::AppHandle) -> Result<VariationResult, String> {
    {
        let mut katago_guard = state.katago.lock().await;
        let needs_init = match katago_guard.as_ref() {
            Some(engine) => !engine.is_healthy(),
            None => true,
        };
        if needs_init {
            let engine = KataGoEngine::new(&handle).await?;
            *katago_guard = Some(engine);
        }
    }

    let katago_guard = state.katago.lock().await;
    let engine = katago_guard.as_ref().ok_or("KataGo engine not initialized")?;

    let (history, board_size, komi) = {
        let game_guard = state.game.lock().map_err(|e| e.to_string())?;
        let game = game_guard.as_ref().ok_or("No active game")?;
        (game.get_move_history(), game.board_size().to_u8(), game.get_game_state().komi)
    };

    engine.clear_board().await?;
    engine.set_board_size(board_size).await?;

    for (i, m) in history.iter().enumerate() {
        let color = if i % 2 == 0 { "B" } else { "W" };
        if m.move_type == MoveType::Stone {
            let mx = m.x.unwrap_or(0);
            let my = m.y.unwrap_or(0);
            let col_char = (b'A' + if mx >= 8 { mx + 1 } else { mx }) as char;
            let vertex = format!("{}{}", col_char, board_size - my);
            engine.play_move(color, &vertex).await?;
        } else if m.move_type == MoveType::Pass {
            engine.play_move(color, "pass").await?;
        }
    }

    let result = engine.analyze_position_with_pv(board_size, komi).await?;

    Ok(VariationResult {
        evaluations: result.evaluations.into_iter().map(|e| KataMoveEvaluation {
            move_str: e.move_str, x: e.x, y: e.y, visits: e.visits,
            win_rate: e.win_rate, score_mean: e.score_mean, is_best: e.is_best, quality: e.quality,
        }).collect(),
        best_move: result.best_move,
        score_mean: result.score_mean,
        turn: result.turn,
        pv: result.pv.into_iter().map(|(x, y)| Point { x, y }).collect(),
    })
}
