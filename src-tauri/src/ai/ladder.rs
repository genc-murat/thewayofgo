use std::collections::HashSet;

use crate::engine::board_utils;
use crate::engine::game::GoGame;
use crate::engine::types::StoneColor;

const MAX_LADDER_STEPS: u8 = 30;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LadderResult {
    Captures,
    Escapes,
    NotALadder,
}

pub fn read_ladder(game: &GoGame, x: u8, y: u8, color: StoneColor) -> LadderResult {
    let board = game.get_board_state();
    let size = game.board_size().to_u8();

    if board[y as usize][x as usize].is_some() {
        return LadderResult::NotALadder;
    }

    let mut sim_game = game.clone_for_simulation();
    if !sim_game.place_stone_fast(x, y) {
        return LadderResult::NotALadder;
    }

    let opponent = color.opposite();

    let mut target_group: Option<HashSet<(u8, u8)>> = None;
    let dirs: [(i16, i16); 4] = [(0, 1), (0, -1), (1, 0), (-1, 0)];
    for (dx, dy) in dirs {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if nx >= 0 && nx < size as i16 && ny >= 0 && ny < size as i16 {
            let (ux, uy) = (nx as u8, ny as u8);
            let sim_board = sim_game.get_board_state();
            if sim_board[uy as usize][ux as usize] == Some(opponent) {
                let group = board_utils::get_group(&sim_board, ux, uy, size);
                let liberties = board_utils::count_liberties(&sim_board, &group, size);
                if liberties == 1 {
                    target_group = Some(group);
                    break;
                }
            }
        }
    }

    let target_group = match target_group {
        Some(g) => g,
        None => return LadderResult::NotALadder,
    };

    let mut steps = 0u8;
    let mut current_player = opponent;

    while steps < MAX_LADDER_STEPS {
        let sim_board = sim_game.get_board_state();

        let mut alive = false;
        for &(gx, gy) in &target_group {
            if sim_board[gy as usize][gx as usize].is_none() {
                alive = false;
                break;
            }
            alive = true;
        }
        if !alive {
            return LadderResult::Captures;
        }

        let liberties = board_utils::get_liberty_positions(&sim_board, &target_group, size);
        if liberties.len() > 1 {
            return LadderResult::Escapes;
        }

        if liberties.is_empty() {
            return LadderResult::Captures;
        }

        let liberty = liberties[0];

        if current_player == opponent {
            let escape_dirs: [(i16, i16); 4] = [(0, 1), (0, -1), (1, 0), (-1, 0)];
            let mut escaped = false;
            for (dx, dy) in escape_dirs {
                let nx = liberty.0 as i16 + dx;
                let ny = liberty.1 as i16 + dy;
                if nx >= 0 && nx < size as i16 && ny >= 0 && ny < size as i16 {
                    let (ux, uy) = (nx as u8, ny as u8);
                    if sim_board[uy as usize][ux as usize].is_none() {
                        let adjacent_to_group = target_group.iter().any(|&(gx, gy)| {
                            ((gx as i16 - ux as i16).abs() + (gy as i16 - uy as i16).abs()) == 1
                        });
                        if adjacent_to_group {
                            escaped = true;
                            break;
                        }
                    }
                }
            }

            if escaped {
                let current = sim_game.current_player();
                if current != opponent {
                    sim_game.pass_fast();
                }
                if sim_game.place_stone_fast(liberty.0, liberty.1) {
                    escaped = true;
                }
            }

            if !escaped {
                let current = sim_game.current_player();
                if current != opponent {
                    sim_game.pass_fast();
                }
                if !sim_game.place_stone_fast(liberty.0, liberty.1) {
                    return LadderResult::Captures;
                }
            }
        } else {
            let current = sim_game.current_player();
            if current != color {
                sim_game.pass_fast();
            }
            if !sim_game.place_stone_fast(liberty.0, liberty.1) {
                return LadderResult::Escapes;
            }
        }

        let new_board = sim_game.get_board_state();
        let mut new_target = HashSet::new();
        for &(gx, gy) in &target_group {
            if new_board[gy as usize][gx as usize] == Some(opponent) {
                new_target.insert((gx, gy));
            }
        }
        if new_target.is_empty() {
            return LadderResult::Captures;
        }

        let new_liberties = board_utils::count_liberties(&new_board, &new_target, size);
        if new_liberties > 1 {
            return LadderResult::Escapes;
        }

        steps += 1;
        current_player = if current_player == color {
            opponent
        } else {
            color
        };
    }

    LadderResult::Escapes
}
