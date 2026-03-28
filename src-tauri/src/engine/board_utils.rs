use std::collections::HashSet;

use super::types::StoneColor;

pub fn neighbors(x: u8, y: u8, size: u8) -> Vec<(u8, u8)> {
    let mut result = Vec::with_capacity(4);
    if x > 0 {
        result.push((x - 1, y));
    }
    if x < size - 1 {
        result.push((x + 1, y));
    }
    if y > 0 {
        result.push((x, y - 1));
    }
    if y < size - 1 {
        result.push((x, y + 1));
    }
    result
}

pub fn get_group(board: &[Vec<Option<StoneColor>>], x: u8, y: u8, size: u8) -> HashSet<(u8, u8)> {
    let color = match board[y as usize][x as usize] {
        Some(c) => c,
        None => return HashSet::new(),
    };

    let mut group = HashSet::new();
    let mut stack = vec![(x, y)];

    while let Some((cx, cy)) = stack.pop() {
        if group.contains(&(cx, cy)) {
            continue;
        }
        if board[cy as usize][cx as usize] != Some(color) {
            continue;
        }
        group.insert((cx, cy));

        for (nx, ny) in neighbors(cx, cy, size) {
            if !group.contains(&(nx, ny)) {
                stack.push((nx, ny));
            }
        }
    }

    group
}

pub fn count_liberties(
    board: &[Vec<Option<StoneColor>>],
    group: &HashSet<(u8, u8)>,
    size: u8,
) -> usize {
    get_liberty_positions(board, group, size).len()
}

pub fn get_liberty_positions(
    board: &[Vec<Option<StoneColor>>],
    group: &HashSet<(u8, u8)>,
    size: u8,
) -> Vec<(u8, u8)> {
    let mut liberties = Vec::new();
    let mut seen = HashSet::new();

    for &(x, y) in group {
        for (nx, ny) in neighbors(x, y, size) {
            if board[ny as usize][nx as usize].is_none() && seen.insert((nx, ny)) {
                liberties.push((nx, ny));
            }
        }
    }

    liberties
}

pub fn group_has_liberties(
    board: &[Vec<Option<StoneColor>>],
    group: &HashSet<(u8, u8)>,
    size: u8,
) -> bool {
    for &(x, y) in group {
        for (nx, ny) in neighbors(x, y, size) {
            if board[ny as usize][nx as usize].is_none() {
                return true;
            }
        }
    }
    false
}
