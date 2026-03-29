use std::collections::HashMap;

use crate::engine::types::StoneColor;

const MAX_BOARD: usize = 19;

#[derive(Debug, Clone)]
struct FixedZobristTable {
    black: [[u64; MAX_BOARD]; MAX_BOARD],
    white: [[u64; MAX_BOARD]; MAX_BOARD],
    player: u64,
}

impl FixedZobristTable {
    fn new() -> Self {
        let mut state: u64 = 0x00DE_C0DE_1234_5678;
        let mut next = || -> u64 {
            state ^= state << 13;
            state ^= state >> 7;
            state ^= state << 17;
            state
        };

        let mut black = [[0u64; MAX_BOARD]; MAX_BOARD];
        let mut white = [[0u64; MAX_BOARD]; MAX_BOARD];
        for y in 0..MAX_BOARD {
            for x in 0..MAX_BOARD {
                black[y][x] = next();
                white[y][x] = next();
            }
        }
        FixedZobristTable {
            black,
            white,
            player: next(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct JosekiEntry {
    pub x: u8,
    pub y: u8,
    pub weight: f64,
    pub name: Option<String>,
}

#[derive(Debug, Clone)]
pub struct JosekiBook {
    entries: HashMap<u64, Vec<JosekiEntry>>,
    zobrist: FixedZobristTable,
}

impl JosekiBook {
    pub fn new() -> Self {
        let zobrist = FixedZobristTable::new();
        let mut book = JosekiBook {
            entries: HashMap::new(),
            zobrist,
        };
        book.load_patterns();
        book
    }

    fn compute_hash(
        &self,
        board: &[Vec<Option<StoneColor>>],
        current_player: StoneColor,
        size: u8,
    ) -> u64 {
        let mut hash = 0u64;
        for (y, row) in board.iter().enumerate().take(size as usize) {
            for (x, cell) in row.iter().enumerate().take(size as usize) {
                if let Some(color) = cell {
                    match color {
                        StoneColor::Black => hash ^= self.zobrist.black[y][x],
                        StoneColor::White => hash ^= self.zobrist.white[y][x],
                    }
                }
            }
        }
        if current_player == StoneColor::White {
            hash ^= self.zobrist.player;
        }
        hash
    }

    pub fn lookup(
        &self,
        board: &[Vec<Option<StoneColor>>],
        current_player: StoneColor,
        size: u8,
    ) -> Option<&[JosekiEntry]> {
        let hash = self.compute_hash(board, current_player, size);
        self.entries.get(&hash).map(|v| v.as_slice())
    }

    fn add_pattern(
        &mut self,
        board: &[Vec<Option<StoneColor>>],
        current_player: StoneColor,
        size: u8,
        moves: Vec<JosekiEntry>,
    ) {
        let hash = self.compute_hash(board, current_player, size);
        self.entries.insert(hash, moves);
    }

    fn empty_board(size: usize) -> Vec<Vec<Option<StoneColor>>> {
        vec![vec![None; size]; size]
    }

    fn board_with_stones(
        size: usize,
        stones: &[(u8, u8, StoneColor)],
    ) -> Vec<Vec<Option<StoneColor>>> {
        let mut board = Self::empty_board(size);
        for &(x, y, color) in stones {
            board[y as usize][x as usize] = Some(color);
        }
        board
    }

    fn load_patterns(&mut self) {
        self.load_9x9_patterns();
        self.load_13x13_patterns();
        self.load_19x19_patterns();
    }

    fn load_9x9_patterns(&mut self) {
        // Empty board → star points (hoshi)
        let board = Self::empty_board(9);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 1.0,
                    name: Some("Tengen (9x9)".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 2,
                    weight: 0.8,
                    name: Some("Hoshi (komoku)".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 2,
                    weight: 0.8,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 6,
                    weight: 0.8,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.8,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.7,
                    name: Some("San-san (3-3)".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 3,
                    weight: 0.7,
                    name: Some("San-san".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 5,
                    weight: 0.7,
                    name: Some("San-san".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 5,
                    weight: 0.7,
                    name: Some("San-san".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.6,
                    name: Some("Komoku (3-4)".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 2,
                    weight: 0.6,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 3,
                    weight: 0.6,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 3,
                    weight: 0.6,
                    name: Some("Komoku".to_string()),
                },
            ],
        );

        // After B(4,4) → common responses
        let board = Self::board_with_stones(9, &[(4, 4, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 2,
                    y: 2,
                    weight: 0.9,
                    name: Some("Hoshi approach".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.9,
                    name: Some("Diagonal".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.7,
                    name: Some("San-san invasion".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 5,
                    weight: 0.7,
                    name: Some("San-san".to_string()),
                },
            ],
        );

        // After B(4,4) W(2,2) → B response
        let board =
            Self::board_with_stones(9, &[(4, 4, StoneColor::Black), (2, 2, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.9,
                    name: Some("Diagonal response".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 6,
                    weight: 0.7,
                    name: Some("Low approach".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 2,
                    weight: 0.7,
                    name: Some("High approach".to_string()),
                },
            ],
        );

        // After B(2,2) (san-san opening)
        let board = Self::board_with_stones(9, &[(2, 2, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.9,
                    name: Some("Tengen".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.8,
                    name: Some("Opposite corner".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.6,
                    name: Some("Approach".to_string()),
                },
            ],
        );

        // After B(3,3) (san-san in corner)
        let board = Self::board_with_stones(9, &[(3, 3, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.8,
                    name: Some("Tengen".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 3,
                    weight: 0.7,
                    name: Some("Approach".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.7,
                    name: Some("Approach".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.6,
                    name: Some("Diagonal".to_string()),
                },
            ],
        );

        // After B(3,3) W(2,3) → B response
        let board =
            Self::board_with_stones(9, &[(3, 3, StoneColor::Black), (2, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 2,
                    weight: 0.9,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.8,
                    name: Some("Extension".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.7,
                    name: Some("Diagonal".to_string()),
                },
            ],
        );

        // After B(4,4) W(6,6) B(2,6) → opposite corner response
        let board = Self::board_with_stones(
            9,
            &[
                (4, 4, StoneColor::Black),
                (6, 6, StoneColor::White),
                (2, 6, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 6,
                    y: 2,
                    weight: 0.8,
                    name: Some("Remaining corner".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 6,
                    weight: 0.7,
                    name: Some("Approach".to_string()),
                },
            ],
        );

        // After B(2,2) W(6,6) → double san-san opening
        let board =
            Self::board_with_stones(9, &[(2, 2, StoneColor::Black), (6, 6, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.9,
                    name: Some("Tengen".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.7,
                    name: Some("San-san approach".to_string()),
                },
            ],
        );

        // After B(3,3) W(6,3) B(4,2) → approach continuation
        let board = Self::board_with_stones(
            9,
            &[
                (3, 3, StoneColor::Black),
                (6, 3, StoneColor::White),
                (4, 2, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.9,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 2,
                    weight: 0.7,
                    name: Some("Extension".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.6,
                    name: Some("Diagonal".to_string()),
                },
            ],
        );

        // After B(4,4) W(3,3) → after 3-3 invasion
        let board =
            Self::board_with_stones(9, &[(4, 4, StoneColor::Black), (3, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 2,
                    y: 4,
                    weight: 0.9,
                    name: Some("Block".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.6,
                    name: Some("Tenuki".to_string()),
                },
            ],
        );

        // After B(2,2) W(5,3) B(3,2) → keima response
        let board = Self::board_with_stones(
            9,
            &[
                (2, 2, StoneColor::Black),
                (5, 3, StoneColor::White),
                (3, 2, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.8,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.7,
                    name: Some("Diagonal".to_string()),
                },
            ],
        );

        // After B(3,2) W(5,2) → komoku approach sequence
        let board =
            Self::board_with_stones(9, &[(3, 2, StoneColor::Black), (5, 2, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            9,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.9,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.7,
                    name: Some("Keima".to_string()),
                },
            ],
        );

        // After B(4,4) W(4,3) B(3,3) → front approach continuation
        let board = Self::board_with_stones(
            9,
            &[
                (4, 4, StoneColor::Black),
                (4, 3, StoneColor::White),
                (3, 3, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.8,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 2,
                    weight: 0.7,
                    name: Some("Extension".to_string()),
                },
            ],
        );

        // After B(2,2) W(6,2) B(3,2) → diagonal pattern
        let board = Self::board_with_stones(
            9,
            &[
                (2, 2, StoneColor::Black),
                (6, 2, StoneColor::White),
                (3, 2, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            9,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Keima".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 2,
                    weight: 0.7,
                    name: Some("Pincer".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.6,
                    name: Some("Diagonal".to_string()),
                },
            ],
        );
    }

    fn load_13x13_patterns(&mut self) {
        // Empty board → star points
        let board = Self::empty_board(13);
        self.add_pattern(
            &board,
            StoneColor::Black,
            13,
            vec![
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 1.0,
                    name: Some("Tengen (13x13)".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 3,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 9,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 9,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 6,
                    weight: 0.7,
                    name: Some("Side star".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 6,
                    weight: 0.7,
                    name: Some("Side star".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 3,
                    weight: 0.7,
                    name: Some("Side star".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 9,
                    weight: 0.7,
                    name: Some("Side star".to_string()),
                },
            ],
        );

        // After B(3,3)
        let board = Self::board_with_stones(13, &[(3, 3, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            13,
            vec![
                JosekiEntry {
                    x: 9,
                    y: 9,
                    weight: 0.9,
                    name: Some("Opposite hoshi".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Approach".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.8,
                    name: Some("Approach".to_string()),
                },
            ],
        );

        // After B(3,3) W(4,3) → B response
        let board =
            Self::board_with_stones(13, &[(3, 3, StoneColor::Black), (4, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            13,
            vec![
                JosekiEntry {
                    x: 2,
                    y: 3,
                    weight: 0.9,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.8,
                    name: Some("Extension".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.7,
                    name: Some("Side star".to_string()),
                },
            ],
        );

        // After B(4,4) → responses
        let board = Self::board_with_stones(13, &[(4, 4, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            13,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.9,
                    name: Some("Kosumi approach".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.8,
                    name: Some("Low approach".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("High approach".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 4,
                    weight: 0.7,
                    name: Some("Far approach".to_string()),
                },
            ],
        );

        // After B(6,6) (tengen on 13x13) → responses
        let board = Self::board_with_stones(13, &[(6, 6, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            13,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 3,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 9,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 9,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
            ],
        );

        // After B(3,3) W(9,3) → opposite corner approach
        let board =
            Self::board_with_stones(13, &[(3, 3, StoneColor::Black), (9, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            13,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Approach".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.8,
                    name: Some("High approach".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.7,
                    name: Some("Tengen".to_string()),
                },
            ],
        );

        // After B(4,4) W(3,3) B(2,4) → 3-3 invasion response
        let board = Self::board_with_stones(
            13,
            &[
                (4, 4, StoneColor::Black),
                (3, 3, StoneColor::White),
                (2, 4, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            13,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.8,
                    name: Some("Block".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.7,
                    name: Some("Hane".to_string()),
                },
            ],
        );

        // After B(9,9) W(3,3) → diagonal on 13x13
        let board =
            Self::board_with_stones(13, &[(9, 9, StoneColor::Black), (3, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            13,
            vec![
                JosekiEntry {
                    x: 9,
                    y: 3,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 9,
                    weight: 0.8,
                    name: Some("Corner".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 6,
                    weight: 0.7,
                    name: Some("Tengen".to_string()),
                },
            ],
        );

        // After B(3,3) W(5,3) B(3,5) → double approach
        let board = Self::board_with_stones(
            13,
            &[
                (3, 3, StoneColor::Black),
                (5, 3, StoneColor::White),
                (3, 5, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            13,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 5,
                    weight: 0.8,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.7,
                    name: Some("Kosumi".to_string()),
                },
            ],
        );
    }

    fn load_19x19_patterns(&mut self) {
        // Empty board → star points
        let board = Self::empty_board(19);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.95,
                    name: Some("Komoku (3-4)".to_string()),
                },
                JosekiEntry {
                    x: 15,
                    y: 3,
                    weight: 0.95,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 15,
                    weight: 0.95,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.95,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 15,
                    weight: 0.95,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 15,
                    y: 3,
                    weight: 0.95,
                    name: Some("Komoku".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.9,
                    name: Some("Hoshi (4-4)".to_string()),
                },
                JosekiEntry {
                    x: 15,
                    y: 4,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 15,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 9,
                    weight: 0.5,
                    name: Some("Tengen".to_string()),
                },
            ],
        );

        // After B(3,4) (komoku in top-left)
        let board = Self::board_with_stones(19, &[(3, 3, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Diagonal komoku".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 3,
                    weight: 0.85,
                    name: Some("One-space approach".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 5,
                    weight: 0.8,
                    name: Some("High approach".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 3,
                    weight: 0.7,
                    name: Some("Low approach".to_string()),
                },
            ],
        );

        // After B(4,4) (hoshi in top-left)
        let board = Self::board_with_stones(19, &[(4, 4, StoneColor::Black)]);
        self.add_pattern(
            &board,
            StoneColor::White,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Diagonal hoshi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.85,
                    name: Some("Low approach".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 4,
                    weight: 0.8,
                    name: Some("High approach".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Approach".to_string()),
                },
            ],
        );

        // After B(3,3) W(15,15) → second move
        let board = Self::board_with_stones(
            19,
            &[(3, 3, StoneColor::Black), (15, 15, StoneColor::White)],
        );
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 3,
                    weight: 0.9,
                    name: Some("Opposite corner".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 15,
                    weight: 0.9,
                    name: Some("Opposite corner".to_string()),
                },
            ],
        );

        // After B(3,3) W(5,3) → B pincer response
        let board =
            Self::board_with_stones(19, &[(3, 3, StoneColor::Black), (5, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 2,
                    y: 3,
                    weight: 0.9,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 2,
                    weight: 0.8,
                    name: Some("Extension".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 2,
                    weight: 0.7,
                    name: Some("Pincer".to_string()),
                },
            ],
        );

        // After B(4,4) W(3,4) → B response to low approach
        let board =
            Self::board_with_stones(19, &[(4, 4, StoneColor::Black), (3, 4, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 5,
                    y: 3,
                    weight: 0.9,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.7,
                    name: Some("Block".to_string()),
                },
            ],
        );

        // After B(4,4) W(5,4) → B response to high approach
        let board =
            Self::board_with_stones(19, &[(4, 4, StoneColor::Black), (5, 4, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.9,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 6,
                    y: 4,
                    weight: 0.7,
                    name: Some("Far pincer".to_string()),
                },
            ],
        );

        // After B(3,3) W(3,5) → high approach to komoku
        let board =
            Self::board_with_stones(19, &[(3, 3, StoneColor::Black), (3, 5, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 4,
                    y: 5,
                    weight: 0.9,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.8,
                    name: Some("Block".to_string()),
                },
                JosekiEntry {
                    x: 2,
                    y: 5,
                    weight: 0.7,
                    name: Some("Kosumi".to_string()),
                },
            ],
        );

        // After B(4,4) W(4,3) → approach from front
        let board =
            Self::board_with_stones(19, &[(4, 4, StoneColor::Black), (4, 3, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.9,
                    name: Some("Kosumi".to_string()),
                },
                JosekiEntry {
                    x: 5,
                    y: 3,
                    weight: 0.8,
                    name: Some("Hane".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.7,
                    name: Some("Low approach".to_string()),
                },
            ],
        );

        // After B(3,3) W(15,3) B(3,15) → opposite corner sequence
        let board = Self::board_with_stones(
            19,
            &[
                (3, 3, StoneColor::Black),
                (15, 3, StoneColor::White),
                (3, 15, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Remaining corner".to_string()),
                },
                JosekiEntry {
                    x: 9,
                    y: 9,
                    weight: 0.7,
                    name: Some("Tengen".to_string()),
                },
            ],
        );

        // After B(4,4) W(15,4) → diagonal hoshi response
        let board =
            Self::board_with_stones(19, &[(4, 4, StoneColor::Black), (15, 4, StoneColor::White)]);
        self.add_pattern(
            &board,
            StoneColor::Black,
            19,
            vec![
                JosekiEntry {
                    x: 3,
                    y: 4,
                    weight: 0.85,
                    name: Some("Low approach".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 3,
                    weight: 0.8,
                    name: Some("High approach".to_string()),
                },
            ],
        );

        // After B(3,3) W(3,15) B(15,3) → fuseki continuation
        let board = Self::board_with_stones(
            19,
            &[
                (3, 3, StoneColor::Black),
                (3, 15, StoneColor::White),
                (15, 3, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Diagonal".to_string()),
                },
                JosekiEntry {
                    x: 4,
                    y: 4,
                    weight: 0.7,
                    name: Some("Hoshi".to_string()),
                },
            ],
        );

        // After B(4,4) W(4,15) B(15,4) → standard 19x19 fuseki
        let board = Self::board_with_stones(
            19,
            &[
                (4, 4, StoneColor::Black),
                (4, 15, StoneColor::White),
                (15, 4, StoneColor::Black),
            ],
        );
        self.add_pattern(
            &board,
            StoneColor::White,
            19,
            vec![
                JosekiEntry {
                    x: 15,
                    y: 15,
                    weight: 0.9,
                    name: Some("Hoshi".to_string()),
                },
                JosekiEntry {
                    x: 3,
                    y: 3,
                    weight: 0.8,
                    name: Some("Komoku".to_string()),
                },
            ],
        );
    }
}

impl Default for JosekiBook {
    fn default() -> Self {
        Self::new()
    }
}
