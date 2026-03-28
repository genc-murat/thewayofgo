use crate::engine::game::GoGame;
use crate::engine::types::StoneColor;

pub fn evaluate_shape(game: &GoGame, x: u8, y: u8) -> f64 {
    let color = game.current_player();
    let board = game.get_board_state();
    let size = game.board_size().to_u8();

    if board[y as usize][x as usize].is_some() {
        return 0.0;
    }

    let mut score = 0.0f64;

    score += check_kosumi(&board, x, y, color, size);
    score += check_hane(&board, x, y, color, size);
    score += check_keima(&board, x, y, color, size);
    score += check_solid_connection(&board, x, y, color, size);
    score += check_empty_triangle(&board, x, y, color, size);
    score += check_bamboo_joint(&board, x, y, color, size);
    score += check_donkey_bridge(&board, x, y, color, size);

    score
}

fn has_friendly(
    board: &[Vec<Option<StoneColor>>],
    x: i16,
    y: i16,
    size: u8,
    color: StoneColor,
) -> bool {
    if x < 0 || x >= size as i16 || y < 0 || y >= size as i16 {
        return false;
    }
    board[y as usize][x as usize] == Some(color)
}

fn check_kosumi(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let diagonals: [(i16, i16); 4] = [(-1, -1), (1, -1), (-1, 1), (1, 1)];
    let mut score = 0.0f64;

    for (dx, dy) in diagonals {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if has_friendly(board, nx, ny, size, color) {
            let adj_x = x as i16 + dx;
            let adj_y = y as i16;
            let adj_x2 = x as i16;
            let adj_y2 = y as i16 + dy;
            if !has_friendly(board, adj_x, adj_y, size, color)
                && !has_friendly(board, adj_x2, adj_y2, size, color)
            {
                score += 3.0;
            }
        }
    }

    score
}

fn check_hane(board: &[Vec<Option<StoneColor>>], x: u8, y: u8, color: StoneColor, size: u8) -> f64 {
    let diagonals: [(i16, i16); 4] = [(-1, -1), (1, -1), (-1, 1), (1, 1)];
    let mut score = 0.0f64;

    for (dx, dy) in diagonals {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if has_friendly(board, nx, ny, size, color) {
            let adj_x = x as i16 + dx;
            let adj_y = y as i16;
            let adj_x2 = x as i16;
            let adj_y2 = y as i16 + dy;
            let has_adj1 = has_friendly(board, adj_x, adj_y, size, color);
            let has_adj2 = has_friendly(board, adj_x2, adj_y2, size, color);
            if has_adj1 || has_adj2 {
                score += 4.0;
            }
        }
    }

    score
}

fn check_keima(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let knight_moves: [(i16, i16); 8] = [
        (-2, -1),
        (-1, -2),
        (2, -1),
        (1, -2),
        (-2, 1),
        (-1, 2),
        (2, 1),
        (1, 2),
    ];
    let mut score = 0.0f64;

    for (dx, dy) in knight_moves {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if has_friendly(board, nx, ny, size, color) {
            let mid_x = if dx.abs() == 2 {
                x as i16 + dx / 2
            } else {
                x as i16
            };
            let mid_y = if dy.abs() == 2 {
                y as i16 + dy / 2
            } else {
                y as i16
            };
            if !has_friendly(board, mid_x, mid_y, size, color) {
                score += 2.0;
            }
        }
    }

    score
}

fn check_solid_connection(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let dirs: [(i16, i16); 4] = [(0, 1), (0, -1), (1, 0), (-1, 0)];
    let mut friendly_adjacent = 0;

    for (dx, dy) in dirs {
        if has_friendly(board, x as i16 + dx, y as i16 + dy, size, color) {
            friendly_adjacent += 1;
        }
    }

    if friendly_adjacent >= 2 {
        3.0
    } else {
        0.0
    }
}

type Offset = (i16, i16);
type ShapePattern = (Offset, Offset, Offset);

fn check_empty_triangle(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let patterns: [ShapePattern; 4] = [
        ((1, 0), (0, 1), (1, 1)),
        ((-1, 0), (0, 1), (-1, 1)),
        ((1, 0), (0, -1), (1, -1)),
        ((-1, 0), (0, -1), (-1, -1)),
    ];

    for (adj1, adj2, diag) in patterns {
        if has_friendly(board, x as i16 + adj1.0, y as i16 + adj1.1, size, color)
            && has_friendly(board, x as i16 + adj2.0, y as i16 + adj2.1, size, color)
            && !has_friendly(board, x as i16 + diag.0, y as i16 + diag.1, size, color)
        {
            return -5.0;
        }
    }

    0.0
}

fn check_bamboo_joint(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let patterns: [ShapePattern; 2] = [((0, 2), (1, 1), (0, 1)), ((2, 0), (1, 1), (1, 0))];

    for (far, diag, between) in patterns {
        if has_friendly(board, x as i16 + far.0, y as i16 + far.1, size, color)
            && has_friendly(board, x as i16 + diag.0, y as i16 + diag.1, size, color)
            && !has_friendly(
                board,
                x as i16 + between.0,
                y as i16 + between.1,
                size,
                color,
            )
        {
            return -3.0;
        }
    }

    0.0
}

fn check_donkey_bridge(
    board: &[Vec<Option<StoneColor>>],
    x: u8,
    y: u8,
    color: StoneColor,
    size: u8,
) -> f64 {
    let patterns: [((i16, i16), (i16, i16)); 4] = [
        ((1, 0), (2, 1)),
        ((-1, 0), (-2, 1)),
        ((0, 1), (1, 2)),
        ((0, -1), (1, -2)),
    ];

    for (adj, far) in patterns {
        if has_friendly(board, x as i16 + adj.0, y as i16 + adj.1, size, color)
            && has_friendly(board, x as i16 + far.0, y as i16 + far.1, size, color)
        {
            let mid_x = x as i16 + (adj.0 + far.0) / 2;
            let mid_y = y as i16 + (adj.1 + far.1) / 2;
            if !has_friendly(board, mid_x, mid_y, size, color) {
                return -4.0;
            }
        }
    }

    0.0
}
