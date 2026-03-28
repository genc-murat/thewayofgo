pub mod ai;
pub mod commands;
pub mod engine;

use commands::exercise_commands::*;
use commands::game_commands::*;
use tauri_plugin_sql::Builder as SqlBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            SqlBuilder::default()
                .add_migrations(
                    "sqlite:thewayofgo.db",
                    commands::progress_commands::get_migrations(),
                )
                .build(),
        )
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            create_game,
            create_game_from_position,
            place_stone,
            pass,
            resign,
            get_game_state,
            get_valid_moves,
            ai_get_move,
            ai_place_stone,
            set_ai_difficulty,
            set_ai_style,
            get_ai_style,
            undo,
            undo_multiple,
            get_move_history,
            validate_exercise_move,
            validate_multi_step_move,
            analyze_move,
            get_position_analysis,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
