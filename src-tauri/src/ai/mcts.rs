use rand::{Rng, RngExt};

use crate::engine::game::GoGame;
use crate::engine::types::{AIDifficulty, Point, StoneColor};

#[derive(Debug, Clone)]
enum GameResult {
    Win(StoneColor),
}

struct MCTSNode {
    move_x: u8,
    move_y: u8,
    visits: u32,
    wins: f64,
    children: Vec<MCTSNode>,
    untried_moves: Vec<(u8, u8)>,
}

impl MCTSNode {
    fn new(moves: Vec<(u8, u8)>, x: u8, y: u8) -> Self {
        MCTSNode {
            move_x: x,
            move_y: y,
            visits: 0,
            wins: 0.0,
            children: Vec::new(),
            untried_moves: moves,
        }
    }

    fn is_fully_expanded(&self) -> bool {
        self.untried_moves.is_empty()
    }
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

        let move_coords: Vec<(u8, u8)> = valid_moves.iter().map(|m| (m.x, m.y)).collect();

        let mut root_children: Vec<MCTSNode> = move_coords
            .iter()
            .map(|&(x, y)| MCTSNode::new(Vec::new(), x, y))
            .collect();

        let simulations = self.difficulty.simulations;
        let current_player = game.current_player();
        let mut rng = rand::rng();
        let sqrt2 = std::f64::consts::SQRT_2;

        for _ in 0..simulations {
            let mut sim_game = game.clone_game();

            let total_visits_ln = (root_children.iter().map(|c| c.visits as f64).sum::<f64>()).ln();

            let selected = root_children
                .iter_mut()
                .max_by(|a, b| {
                    let a_val = if a.visits > 0 {
                        a.wins / a.visits as f64
                            + sqrt2 * (total_visits_ln / a.visits as f64).sqrt()
                    } else {
                        f64::INFINITY
                    };
                    let b_val = if b.visits > 0 {
                        b.wins / b.visits as f64
                            + sqrt2 * (total_visits_ln / b.visits as f64).sqrt()
                    } else {
                        f64::INFINITY
                    };
                    a_val
                        .partial_cmp(&b_val)
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .unwrap();

            if sim_game
                .place_stone(selected.move_x, selected.move_y)
                .is_err()
            {
                continue;
            }

            if !selected.is_fully_expanded() {
                let idx = rng.random_range(0..selected.untried_moves.len());
                let (cx, cy) = selected.untried_moves.swap_remove(idx);

                if sim_game.place_stone(cx, cy).is_err() {
                    selected.visits += 1;
                    continue;
                }

                let child_moves = sim_game
                    .get_valid_moves()
                    .iter()
                    .map(|m| (m.x, m.y))
                    .collect();
                selected.children.push(MCTSNode::new(child_moves, cx, cy));
            }

            let result = self.random_playout(&mut sim_game, &mut rng);

            selected.visits += 1;
            match result {
                GameResult::Win(color) if color == current_player => selected.wins += 1.0,
                GameResult::Win(_) => {}
            }
        }

        root_children
            .iter()
            .max_by_key(|n| n.visits)
            .map(|n| (n.move_x, n.move_y))
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

        let (winner, _) = game.compute_score();
        GameResult::Win(winner)
    }
}
