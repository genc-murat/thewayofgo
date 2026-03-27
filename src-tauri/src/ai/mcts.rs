use rand::seq::SliceRandom;
use rand::Rng;
use rand::RngExt;

use crate::ai::styles::{get_style_weights, StyleWeights};
use crate::engine::game::GoGame;
use crate::engine::types::{AIDifficulty, AIStyle, Point, StoneColor};

const EXPLORATION_CONSTANT: f64 = 1.414;

struct MCTSNode {
    move_x: u8,
    move_y: u8,
    is_pass: bool,
    visits: u32,
    wins: f64,
    children: Vec<MCTSNode>,
    untried_moves: Vec<(u8, u8)>,
}

impl MCTSNode {
    fn new(x: u8, y: u8, untried_moves: Vec<(u8, u8)>) -> Self {
        MCTSNode {
            move_x: x,
            move_y: y,
            is_pass: false,
            visits: 0,
            wins: 0.0,
            children: Vec::new(),
            untried_moves,
        }
    }

    fn new_pass(untried_moves: Vec<(u8, u8)>) -> Self {
        MCTSNode {
            move_x: 0,
            move_y: 0,
            is_pass: true,
            visits: 0,
            wins: 0.0,
            children: Vec::new(),
            untried_moves,
        }
    }

    fn uct_value(&self, parent_visits: u32) -> f64 {
        if self.visits == 0 {
            return f64::INFINITY;
        }
        let exploit = self.wins / self.visits as f64;
        let explore =
            EXPLORATION_CONSTANT * ((parent_visits as f64).ln() / self.visits as f64).sqrt();
        exploit + explore
    }

    fn best_child_uct(&self) -> Option<usize> {
        self.children
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| {
                a.uct_value(self.visits)
                    .partial_cmp(&b.uct_value(self.visits))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|(i, _)| i)
    }

    fn is_fully_expanded(&self) -> bool {
        self.untried_moves.is_empty()
    }
}

fn select_most_visited(root_children: &[MCTSNode]) -> Option<(u8, u8)> {
    root_children
        .iter()
        .max_by_key(|n| n.visits)
        .map(|n| (n.move_x, n.move_y))
}

pub struct MCTSAi {
    difficulty: AIDifficulty,
    style_weights: StyleWeights,
}

impl MCTSAi {
    pub fn new(difficulty: AIDifficulty) -> Self {
        let style_weights = get_style_weights(difficulty.style);
        MCTSAi {
            difficulty,
            style_weights,
        }
    }

    pub fn style(&self) -> AIStyle {
        self.difficulty.style
    }

    pub fn difficulty_level(&self) -> u8 {
        self.difficulty.level
    }

    pub fn get_move(&self, game: &GoGame) -> Option<Point> {
        let valid_moves = game.get_valid_moves();
        if valid_moves.is_empty() {
            return None;
        }

        if self.difficulty.level == 1 || self.difficulty.simulations == 0 {
            return self.heuristic_move(game, &valid_moves);
        }

        self.mcts_search(game)
    }

    fn heuristic_move(&self, game: &GoGame, valid_moves: &[Point]) -> Option<Point> {
        let mut rng = rand::rng();
        let board_size = game.board_size().to_u8();
        let center = board_size as f64 / 2.0;
        let board_area = board_size as u32;
        let move_number = game.move_number();
        let game_progress = move_number as f64 / board_area as f64;
        let w = &self.style_weights;
        let current_player = game.current_player();

        let mut scored: Vec<(usize, f64)> = valid_moves
            .iter()
            .enumerate()
            .map(|(i, m)| {
                let mut score = 0.0f64;

                let captures = game.would_capture_count(m.x, m.y);
                if captures > 0 {
                    score += w.capture_mult * captures as f64;
                }

                if game.creates_atari(m.x, m.y) {
                    score += w.atari_weight;
                }

                if game.is_self_atari(m.x, m.y) {
                    score += w.self_atari_penalty;
                }

                let connections = game.connects_friendly_groups(m.x, m.y);
                if connections > 1 {
                    score += w.connection_weight * (connections as f64 - 1.0);
                }

                let dist = ((m.x as f64 - center).powi(2) + (m.y as f64 - center).powi(2)).sqrt();
                score += (center - dist).max(0.0) * w.center_weight;

                let edge_dist =
                    m.x.min(m.y)
                        .min(board_size - 1 - m.x)
                        .min(board_size - 1 - m.y);
                if edge_dist == 0 {
                    score += w.edge_penalty_first;
                } else if edge_dist == 1 {
                    score += w.edge_penalty_second;
                } else if edge_dist == 2 || edge_dist == 3 {
                    score += 2.0;
                }

                // Proximity scoring for aggressive/defensive styles
                if w.proximity_weight != 0.0 {
                    let proximity =
                        compute_proximity_score(game, m.x, m.y, current_player, board_size);
                    score += w.proximity_weight * proximity;
                }

                // Territory weight for defensive/educational styles
                if w.territory_weight != 0.0 {
                    let territory =
                        compute_territory_score(game, m.x, m.y, current_player, board_size);
                    score += w.territory_weight * territory;
                }

                let noise = match self.difficulty.level {
                    1 => rng.random_range(-5.0f64..5.0),
                    _ => rng.random_range(-w.noise_scale..w.noise_scale),
                };
                score += noise;

                (i, score)
            })
            .collect();

        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        let best_score = scored[0].1;
        let positive_score_moves: Vec<_> = scored.iter().filter(|(_, s)| *s > 0.0).collect();

        if game_progress > 0.4 {
            if positive_score_moves.is_empty() {
                return None;
            }
            if best_score < -3.0 && game_progress > 0.6 {
                return None;
            }
        }

        if game_progress > 0.7 && best_score < 1.0 {
            return None;
        }

        let top_count = (scored.len() as f64 * 0.3).max(1.0) as usize;
        let pick_idx = rng.random_range(0..top_count.min(scored.len()));
        Some(valid_moves[scored[pick_idx].0].clone())
    }

    fn mcts_search(&self, game: &GoGame) -> Option<Point> {
        let valid_moves = game.get_valid_moves();
        if valid_moves.is_empty() {
            return None;
        }

        let move_coords: Vec<(u8, u8)> = valid_moves.iter().map(|m| (m.x, m.y)).collect();

        let mut root_children: Vec<MCTSNode> = move_coords
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let untried: Vec<(u8, u8)> = move_coords
                    .iter()
                    .enumerate()
                    .filter(|(j, _)| *j != i)
                    .map(|(_, &c)| c)
                    .collect();
                let mut rng = rand::rng();
                let mut untried = untried;
                untried.shuffle(&mut rng);
                MCTSNode::new(x, y, untried)
            })
            .collect();

        let pass_untried: Vec<(u8, u8)> = move_coords.clone();
        root_children.push(MCTSNode::new_pass(pass_untried));

        let simulations = self.difficulty.simulations;
        let current_player = game.current_player();
        let use_heavy_playout = self.difficulty.level >= 4;
        let mut rng = rand::rng();

        for _ in 0..simulations {
            let mut sim_game = game.clone_for_simulation();

            let root_idx = match root_children.iter().position(|c| c.visits == 0) {
                Some(idx) => idx,
                None => root_children
                    .iter()
                    .enumerate()
                    .max_by(|(_, a), (_, b)| {
                        a.uct_value(total_root_visits(&root_children))
                            .partial_cmp(&b.uct_value(total_root_visits(&root_children)))
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .map(|(i, _)| i)
                    .unwrap_or(0),
            };

            let node = &root_children[root_idx];
            let moved = if node.is_pass {
                sim_game.pass_fast();
                true
            } else if sim_game.place_stone_fast(node.move_x, node.move_y) {
                true
            } else {
                continue;
            };

            if moved {
                let mut current = &mut root_children[root_idx];

                while current.is_fully_expanded() && !current.children.is_empty() {
                    if let Some(child_idx) = current.best_child_uct() {
                        let child = &current.children[child_idx];
                        let moved = if child.is_pass {
                            sim_game.pass_fast();
                            true
                        } else {
                            sim_game.place_stone_fast(child.move_x, child.move_y)
                        };
                        if !moved {
                            break;
                        }
                        current = &mut current.children[child_idx];
                    } else {
                        break;
                    }
                }

                if !current.is_fully_expanded() && !current.untried_moves.is_empty() {
                    let move_idx = rng.random_range(0..current.untried_moves.len());
                    let (cx, cy) = current.untried_moves.swap_remove(move_idx);

                    if sim_game.place_stone_fast(cx, cy) {
                        let child_valid = get_valid_moves_fast(&sim_game);
                        let child = MCTSNode::new(cx, cy, child_valid);
                        current.children.push(child);
                    }
                }

                let result = if use_heavy_playout {
                    heavy_playout(&mut sim_game, &mut rng, &self.style_weights)
                } else {
                    light_playout(&mut sim_game, &mut rng, &self.style_weights)
                };

                root_children[root_idx].visits += 1;
                let board_area = (sim_game.board_size().to_u8() as f64).powi(2);
                let normalized = result.margin as f64 / board_area * 0.5;
                if result.winner == current_player {
                    root_children[root_idx].wins += 0.5 + normalized.min(0.5);
                } else {
                    root_children[root_idx].wins += (0.5 - normalized.min(0.5)).max(0.0);
                }
            }
        }

        let best = root_children.iter().max_by_key(|n| n.visits).unwrap();
        if best.is_pass {
            return None;
        }

        select_most_visited(&root_children).map(|(x, y)| Point { x, y })
    }
}

struct PlayoutResult {
    winner: StoneColor,
    margin: f32,
}

fn total_root_visits(children: &[MCTSNode]) -> u32 {
    children.iter().map(|c| c.visits).sum()
}

fn get_valid_moves_fast(game: &GoGame) -> Vec<(u8, u8)> {
    let size = game.board_size().to_u8();
    let mut moves = Vec::new();
    for y in 0..size {
        for x in 0..size {
            if game.is_valid_move(x, y) {
                moves.push((x, y));
            }
        }
    }
    moves
}

fn light_playout(game: &mut GoGame, rng: &mut impl Rng, weights: &StyleWeights) -> PlayoutResult {
    let max_moves = (game.board_size().to_u8() as u32).pow(2) * 2;
    let mut moves_played = 0u32;

    while moves_played < max_moves {
        if game.is_game_over_fast() {
            break;
        }

        let valid_moves = get_valid_moves_fast(game);
        if valid_moves.is_empty() {
            game.pass_fast();
            continue;
        }

        if let Some(m) = pick_heuristic_move(game, &valid_moves, rng, false, weights) {
            game.place_stone_fast(m.0, m.1);
        } else {
            game.pass_fast();
        }

        moves_played += 1;
    }

    let (winner, score) = game.compute_score();
    PlayoutResult {
        winner,
        margin: score.black_total - score.white_total,
    }
}

fn heavy_playout(game: &mut GoGame, rng: &mut impl Rng, weights: &StyleWeights) -> PlayoutResult {
    let max_moves = (game.board_size().to_u8() as u32).pow(2) * 2;
    let mut moves_played = 0u32;

    while moves_played < max_moves {
        if game.is_game_over_fast() {
            break;
        }

        let valid_moves = get_valid_moves_fast(game);
        if valid_moves.is_empty() {
            game.pass_fast();
            continue;
        }

        let remaining = max_moves - moves_played;
        let force_tactical = remaining < 40;

        if let Some(m) = pick_heuristic_move(game, &valid_moves, rng, force_tactical, weights) {
            game.place_stone_fast(m.0, m.1);
        } else {
            game.pass_fast();
        }

        moves_played += 1;
    }

    let (winner, score) = game.compute_score();
    PlayoutResult {
        winner,
        margin: score.black_total - score.white_total,
    }
}

fn pick_heuristic_move(
    game: &GoGame,
    valid_moves: &[(u8, u8)],
    rng: &mut impl Rng,
    force_tactical: bool,
    weights: &StyleWeights,
) -> Option<(u8, u8)> {
    let board_size = game.board_size().to_u8();
    let center = board_size as f64 / 2.0;
    let board_area = board_size as u32;
    let game_progress = game.move_number() as f64 / board_area as f64;

    let mut best_tactical: Option<(usize, f64)> = None;
    let mut wts: Vec<f64> = Vec::with_capacity(valid_moves.len());

    for (i, &(x, y)) in valid_moves.iter().enumerate() {
        let captures = game.would_capture_count(x, y);
        let atari = game.creates_atari(x, y);
        let self_atari = game.is_self_atari(x, y);

        let mut weight = 1.0f64;

        if captures > 0 {
            weight += weights.base_capture_bonus * captures as f64;
            if best_tactical.is_none() || captures as f64 > best_tactical.unwrap().1 {
                best_tactical = Some((i, captures as f64));
            }
        }

        if atari {
            weight += weights.base_atari_bonus;
            if best_tactical.is_none() {
                best_tactical = Some((i, 4.0));
            }
        }

        if self_atari {
            weight *= 0.15;
        }

        let edge_dist = x.min(y).min(board_size - 1 - x).min(board_size - 1 - y);
        if edge_dist == 0 {
            weight *= 0.2;
        } else if edge_dist == 1 {
            weight *= 0.6;
        } else if edge_dist == 2 || edge_dist == 3 {
            weight *= 1.3;
        }

        let dist = ((x as f64 - center).powi(2) + (y as f64 - center).powi(2)).sqrt();
        weight += (center - dist).max(0.0) * weights.connection_bonus_per;

        if game_progress > 0.5 {
            weight *= 0.5;
        }
        if game_progress > 0.7 {
            weight *= 0.3;
        }

        wts.push(weight);
    }

    if force_tactical {
        if let Some((idx, _)) = best_tactical {
            return Some(valid_moves[idx]);
        }
    }

    let capture_threshold = if force_tactical {
        0.8
    } else {
        weights.capture_threshold
    };
    if let Some((idx, _)) = best_tactical {
        if rng.random_range(0.0f64..1.0) < capture_threshold {
            return Some(valid_moves[idx]);
        }
    }

    let total: f64 = wts.iter().sum();
    if total <= 0.0 {
        return None;
    }

    if game_progress > 0.5 && best_tactical.is_none() {
        let pass_probability = (game_progress - 0.5) * 1.5;
        if rng.random_range(0.0f64..1.0) < pass_probability {
            return None;
        }
    }

    let mut roll = rng.random_range(0.0..total);
    for (i, &w) in wts.iter().enumerate() {
        roll -= w;
        if roll <= 0.0 {
            return Some(valid_moves[i]);
        }
    }

    valid_moves.last().copied()
}

fn compute_proximity_score(
    game: &GoGame,
    x: u8,
    y: u8,
    current_player: StoneColor,
    board_size: u8,
) -> f64 {
    let board = game.get_board_state();
    let opponent = current_player.opposite();
    let mut min_distance: Option<u8> = None;
    let mut friendly_distance: Option<u8> = None;

    for by in 0..board_size {
        for bx in 0..board_size {
            if let Some(stone) = board[by as usize][bx as usize] {
                let dist = ((x as i16 - bx as i16).unsigned_abs()
                    + (y as i16 - by as i16).unsigned_abs()) as u8;
                if stone == opponent {
                    min_distance = Some(match min_distance {
                        Some(d) => d.min(dist),
                        None => dist,
                    });
                } else if stone == current_player {
                    friendly_distance = Some(match friendly_distance {
                        Some(d) => d.min(dist),
                        None => dist,
                    });
                }
            }
        }
    }

    match min_distance {
        Some(d) if d <= 3 => (4 - d) as f64,
        _ => 0.0,
    }
}

fn compute_territory_score(
    game: &GoGame,
    x: u8,
    y: u8,
    current_player: StoneColor,
    board_size: u8,
) -> f64 {
    let board = game.get_board_state();
    let mut friendly_count = 0u8;
    let mut empty_count = 0u8;

    let dirs: [(i16, i16); 4] = [(0, 1), (0, -1), (1, 0), (-1, 0)];
    for (dx, dy) in dirs {
        let nx = x as i16 + dx;
        let ny = y as i16 + dy;
        if nx >= 0 && nx < board_size as i16 && ny >= 0 && ny < board_size as i16 {
            match board[ny as usize][nx as usize] {
                Some(stone) if stone == current_player => friendly_count += 1,
                None => empty_count += 1,
                _ => {}
            }
        }
    }

    (friendly_count as f64 * 1.5) + (empty_count as f64 * 0.5)
}
