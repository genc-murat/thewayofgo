use rand::{Rng, RngExt};
use std::collections::HashMap;

use crate::engine::game::GoGame;
use crate::engine::types::{AIDifficulty, Point, StoneColor};

#[derive(Debug, Clone)]
enum GameResult {
    Win(StoneColor),
    Draw,
}

pub struct MCTSAi {
    difficulty: AIDifficulty,
}

impl MCTSAi {
    pub fn new(difficulty: AIDifficulty) -> Self {
        MCTSAi { difficulty }
    }

    pub fn get_move(&self, game: &GoGame) -> Option<Point> {
        let valid_moves = game.get_valid_moves();
        if valid_moves.is_empty() {
            return None;
        }

        if self.difficulty.level <= 2 {
            return self.get_beginner_move(game, &valid_moves);
        }

        let best = self.mcts_search(game);
        best.map(|(x, y)| Point { x, y })
    }

    fn get_beginner_move(&self, game: &GoGame, valid_moves: &[Point]) -> Option<Point> {
        let mut rng = rand::rng();

        match self.difficulty.level {
            1 => {
                if rng.random_range(0..100) < 60 {
                    let idx = rng.random_range(0..valid_moves.len());
                    return Some(valid_moves[idx].clone());
                }
                self.center_weighted_move(game, valid_moves, &mut rng)
            }
            2 => {
                if rng.random_range(0..100) < 30 {
                    let idx = rng.random_range(0..valid_moves.len());
                    return Some(valid_moves[idx].clone());
                }
                self.heuristic_move(game, valid_moves, &mut rng)
            }
            _ => self.mcts_search(game).map(|(x, y)| Point { x, y }),
        }
    }

    fn center_weighted_move(
        &self,
        game: &GoGame,
        valid_moves: &[Point],
        rng: &mut impl Rng,
    ) -> Option<Point> {
        let center = game.board_size().to_u8() as f32 / 2.0;
        let weights: Vec<f64> = valid_moves
            .iter()
            .map(|m| {
                let dist = ((m.x as f32 - center).powi(2) + (m.y as f32 - center).powi(2)).sqrt();
                (center - dist).max(0.1) as f64
            })
            .collect();

        let total: f64 = weights.iter().sum();
        let mut roll = rng.random_range(0.0..total);

        for (i, &w) in weights.iter().enumerate() {
            roll -= w;
            if roll <= 0.0 {
                return Some(valid_moves[i].clone());
            }
        }

        valid_moves.last().cloned()
    }

    fn heuristic_move(
        &self,
        game: &GoGame,
        valid_moves: &[Point],
        rng: &mut impl Rng,
    ) -> Option<Point> {
        let board_size = game.board_size().to_u8();
        let mut scored_moves: Vec<(Point, f64)> = valid_moves
            .iter()
            .map(|m| {
                let mut score = 0.0;
                let center = board_size as f32 / 2.0;

                let dist = ((m.x as f32 - center).powi(2) + (m.y as f32 - center).powi(2)).sqrt();
                score += (center - dist) as f64 * 2.0;

                let edge_dist =
                    m.x.min(m.y)
                        .min(board_size - 1 - m.x)
                        .min(board_size - 1 - m.y);
                if edge_dist == 2 || edge_dist == 3 {
                    score += 5.0;
                }

                score += rng.random_range(-3.0..3.0);

                (m.clone(), score)
            })
            .collect();

        scored_moves.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scored_moves.first().map(|(p, _)| p.clone())
    }

    fn mcts_search(&self, game: &GoGame) -> Option<(u8, u8)> {
        let valid_moves = game.get_valid_moves();
        if valid_moves.is_empty() {
            return None;
        }

        let mut move_wins: HashMap<(u8, u8), f64> = HashMap::new();
        let mut move_visits: HashMap<(u8, u8), u32> = HashMap::new();
        let mut rng = rand::rng();

        let simulations = self.difficulty.simulations;
        let current_player = game.current_player();

        for _ in 0..simulations {
            let mut sim_game = game.clone_game();

            let move_idx = rng.random_range(0..valid_moves.len());
            let test_move = &valid_moves[move_idx];

            if sim_game.place_stone(test_move.x, test_move.y).is_err() {
                continue;
            }

            let result = self.random_playout(&mut sim_game, &mut rng);

            let entry = move_wins.entry((test_move.x, test_move.y)).or_insert(0.0);
            let visit_entry = move_visits.entry((test_move.x, test_move.y)).or_insert(0);

            *visit_entry += 1;
            match result {
                GameResult::Win(color) if color == current_player => *entry += 1.0,
                GameResult::Win(_) => {}
                GameResult::Draw => *entry += 0.5,
            }
        }

        let best_move = valid_moves
            .iter()
            .map(|m| {
                let wins = move_wins.get(&(m.x, m.y)).copied().unwrap_or(0.0);
                let visits = move_visits.get(&(m.x, m.y)).copied().unwrap_or(0);
                let win_rate = if visits > 0 {
                    wins / visits as f64
                } else {
                    0.0
                };
                (m, win_rate, visits)
            })
            .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

        best_move.map(|(m, _, _)| (m.x, m.y))
    }

    fn random_playout(&self, game: &mut GoGame, rng: &mut impl Rng) -> GameResult {
        let max_moves = (game.board_size().to_u8() as u32).pow(2);
        let mut moves_played = 0u32;
        let mut consecutive_passes = 0u8;

        while moves_played < max_moves && consecutive_passes < 2 {
            let valid_moves = game.get_valid_moves();
            if valid_moves.is_empty() {
                consecutive_passes += 1;
                game.pass();
            } else {
                consecutive_passes = 0;
                let idx = rng.random_range(0..valid_moves.len());
                let mov = &valid_moves[idx];
                if game.place_stone(mov.x, mov.y).is_err() {
                    consecutive_passes += 1;
                    game.pass();
                }
            }
            moves_played += 1;
        }

        let state = game.get_game_state();
        let mut black_count = 0u32;
        let mut white_count = 0u32;
        for row in &state.board {
            for cell in row {
                match cell {
                    Some(StoneColor::Black) => black_count += 1,
                    Some(StoneColor::White) => white_count += 1,
                    None => {}
                }
            }
        }

        if black_count > white_count {
            GameResult::Win(StoneColor::Black)
        } else if white_count > black_count {
            GameResult::Win(StoneColor::White)
        } else {
            GameResult::Draw
        }
    }
}
