use crate::engine::game::GoGame;
use crate::engine::types::StoneColor;

const MAX_INFLUENCE_DISTANCE: i16 = 5;

pub fn compute_influence_map(game: &GoGame) -> Vec<Vec<f64>> {
    let board = game.get_board_state();
    let size = game.board_size().to_u8() as usize;
    let mut map = vec![vec![0.0f64; size]; size];

    for (by, row) in board.iter().enumerate().take(size) {
        for (bx, cell) in row.iter().enumerate().take(size) {
            if let Some(color) = cell {
                let sign = match color {
                    StoneColor::Black => 1.0,
                    StoneColor::White => -1.0,
                };

                let edge_factor = edge_influence_factor(bx as u8, by as u8, size as u8);

                for dy in -MAX_INFLUENCE_DISTANCE..=MAX_INFLUENCE_DISTANCE {
                    for dx in -MAX_INFLUENCE_DISTANCE..=MAX_INFLUENCE_DISTANCE {
                        let nx = bx as i16 + dx;
                        let ny = by as i16 + dy;

                        if nx < 0 || nx >= size as i16 || ny < 0 || ny >= size as i16 {
                            continue;
                        }

                        let dist_sq = (dx * dx + dy * dy) as f64;
                        if dist_sq == 0.0 {
                            continue;
                        }

                        let effective_range = MAX_INFLUENCE_DISTANCE as f64 * edge_factor;
                        if dist_sq > effective_range * effective_range {
                            continue;
                        }

                        let influence = sign * edge_factor / dist_sq;
                        map[ny as usize][nx as usize] += influence;
                    }
                }
            }
        }
    }

    map
}

pub fn get_influence_at(map: &[Vec<f64>], x: u8, y: u8) -> f64 {
    let ux = x as usize;
    let uy = y as usize;
    if uy < map.len() && ux < map[uy].len() {
        map[uy][ux]
    } else {
        0.0
    }
}

fn edge_influence_factor(x: u8, y: u8, size: u8) -> f64 {
    let edge_dist = x
        .min(y)
        .min(size.saturating_sub(1).saturating_sub(x))
        .min(size.saturating_sub(1).saturating_sub(y));

    match edge_dist {
        0 => 0.6,
        1 => 0.8,
        _ => 1.0,
    }
}
