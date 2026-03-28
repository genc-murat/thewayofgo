use std::collections::HashSet;

use crate::engine::board_utils;
use crate::engine::game::GoGame;
use crate::engine::types::StoneColor;

pub fn is_eye(game: &GoGame, x: u8, y: u8, color: StoneColor) -> bool {
    let board = game.get_board_state();
    let size = game.board_size().to_u8();

    if board[y as usize][x as usize].is_some() {
        return false;
    }

    let mut total_neighbors = 0usize;
    let mut friendly_neighbors = 0usize;

    if x > 0 {
        total_neighbors += 1;
        if board[y as usize][(x - 1) as usize] == Some(color) {
            friendly_neighbors += 1;
        }
    }
    if x < size - 1 {
        total_neighbors += 1;
        if board[y as usize][(x + 1) as usize] == Some(color) {
            friendly_neighbors += 1;
        }
    }
    if y > 0 {
        total_neighbors += 1;
        if board[(y - 1) as usize][x as usize] == Some(color) {
            friendly_neighbors += 1;
        }
    }
    if y < size - 1 {
        total_neighbors += 1;
        if board[(y + 1) as usize][x as usize] == Some(color) {
            friendly_neighbors += 1;
        }
    }

    if friendly_neighbors < total_neighbors {
        return false;
    }

    if is_false_eye(game, x, y, color) {
        return false;
    }

    true
}

pub fn is_false_eye(game: &GoGame, x: u8, y: u8, color: StoneColor) -> bool {
    let board = game.get_board_state();
    let size = game.board_size().to_u8();

    let mut diag_groups: Vec<StoneColor> = Vec::new();

    let diagonals: [(i16, i16); 4] = [(-1, -1), (1, -1), (-1, 1), (1, 1)];
    for (dx, dy) in diagonals {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if nx >= 0 && nx < size as i16 && ny >= 0 && ny < size as i16 {
            if let Some(stone) = board[ny as usize][nx as usize] {
                diag_groups.push(stone);
            }
        }
    }

    if diag_groups.len() >= 2 {
        let opponent = color.opposite();
        let opponent_count = diag_groups.iter().filter(|&&c| c == opponent).count();
        if opponent_count >= 2 {
            return true;
        }
    }

    let mut diag_friendly_groups: HashSet<(u8, u8)> = HashSet::new();
    for (dx, dy) in diagonals {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if nx >= 0 && nx < size as i16 && ny >= 0 && ny < size as i16 {
            let (ux, uy) = (nx as u8, ny as u8);
            if board[uy as usize][ux as usize] == Some(color) {
                let group = board_utils::get_group(&board, ux, uy, size);
                let representative = *group.iter().min().unwrap();
                diag_friendly_groups.insert(representative);
            }
        }
    }

    if diag_friendly_groups.len() > 1 {
        let mut common_neighbors = 0;
        for (dx, dy) in [(-1, 0), (1, 0), (0, -1), (0, 1)] {
            let nx = x as i16 + dx;
            let ny = y as i16 + dy;
            if nx >= 0
                && nx < size as i16
                && ny >= 0
                && ny < size as i16
                && board[ny as usize][nx as usize] == Some(color)
            {
                common_neighbors += 1;
            }
        }
        if common_neighbors < 2 {
            return true;
        }
    }

    false
}

pub fn is_real_eye(game: &GoGame, x: u8, y: u8, color: StoneColor) -> bool {
    is_eye(game, x, y, color) && !is_false_eye(game, x, y, color)
}
